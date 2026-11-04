import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { inject } from '@angular/core';
import { IconComponent } from '../icon/icon';

export type PaymentStep = 'form' | 'processing' | 'success' | 'failure';

function luhnCheck(control: AbstractControl): ValidationErrors | null {
  const val = (control.value ?? '').replace(/\s/g, '');
  if (!/^\d{16}$/.test(val)) return { cardNumber: true };
  let sum = 0;
  for (let i = 0; i < val.length; i++) {
    let d = +val[val.length - 1 - i];
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0 ? null : { cardNumber: true };
}

function expiryCheck(control: AbstractControl): ValidationErrors | null {
  const val = control.value ?? '';
  if (!/^\d{2}\/\d{2}$/.test(val)) return { expiry: true };
  const [mm, yy] = val.split('/').map(Number);
  if (mm < 1 || mm > 12) return { expiry: true };
  const now = new Date();
  const cardDate = new Date(2000 + yy, mm - 1, 1);
  return cardDate < new Date(now.getFullYear(), now.getMonth(), 1) ? { expiry: true } : null;
}

@Component({
  selector: 'app-payment-modal',
  imports: [ReactiveFormsModule, IconComponent, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overlay" (click)="onOverlayClick($event)">
      <div class="modal" role="dialog" aria-modal="true">

        @if (step() === 'form') {
          <div class="modal-header">
            <div>
              <span class="modal-label">Paiement sécurisé</span>
              <h2 class="modal-title">{{ eventTitle() }}</h2>
            </div>
            <button class="close-btn" type="button" (click)="close.emit()">
              <app-icon name="x" [size]="18" />
            </button>
          </div>

          <div class="price-row">
            <span class="price-label">Total à régler</span>
            <span class="price-amount">{{ price() | number:'1.0-0' }} FCFA</span>
          </div>

          <form [formGroup]="paymentForm" (ngSubmit)="pay()" class="pay-form" autocomplete="off">
            <div class="form-group">
              <label class="form-label">Numéro de carte</label>
              <div class="card-input-wrapper">
                <app-icon name="credit-card" [size]="16" class="card-icon" />
                <input
                  type="text"
                  formControlName="cardNumber"
                  class="form-control card-input"
                  placeholder="0000 0000 0000 0000"
                  maxlength="19"
                  (input)="formatCard($event)"
                  [class.is-invalid]="f['cardNumber'].invalid && f['cardNumber'].touched"
                />
              </div>
              @if (f['cardNumber'].invalid && f['cardNumber'].touched) {
                <div class="field-error">Numéro de carte invalide</div>
              }
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Expiration</label>
                <input
                  type="text"
                  formControlName="expiry"
                  class="form-control"
                  placeholder="MM/AA"
                  maxlength="5"
                  (input)="formatExpiry($event)"
                  [class.is-invalid]="f['expiry'].invalid && f['expiry'].touched"
                />
                @if (f['expiry'].invalid && f['expiry'].touched) {
                  <div class="field-error">Date invalide</div>
                }
              </div>

              <div class="form-group">
                <label class="form-label">CVV</label>
                <input
                  type="text"
                  formControlName="cvv"
                  class="form-control"
                  placeholder="123"
                  maxlength="3"
                  [class.is-invalid]="f['cvv'].invalid && f['cvv'].touched"
                />
                @if (f['cvv'].invalid && f['cvv'].touched) {
                  <div class="field-error">CVV invalide</div>
                }
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Titulaire de la carte</label>
              <input
                type="text"
                formControlName="holder"
                class="form-control"
                placeholder="Ex : Aya Kouassi"
                [class.is-invalid]="f['holder'].invalid && f['holder'].touched"
              />
              @if (f['holder'].invalid && f['holder'].touched) {
                <div class="field-error">Nom du titulaire requis</div>
              }
            </div>

            <div class="demo-hint">
              <app-icon name="info" [size]="13" />
              <span>Mode démo — aucun débit réel. Carte test : <strong>4242 4242 4242 4242</strong></span>
            </div>

            <button
              type="submit"
              class="btn-pay"
              [disabled]="paymentForm.invalid"
            >
              <app-icon name="lock" [size]="15" />
              <span>Payer {{ price() | number:'1.0-0' }} FCFA</span>
            </button>
          </form>
        }

        @if (step() === 'processing') {
          <div class="centered-state">
            <div class="processing-ring">
              <div class="processing-spinner"></div>
            </div>
            <p class="state-title">Traitement en cours...</p>
            <p class="state-sub">Veuillez patienter, ne fermez pas cette fenêtre.</p>
          </div>
        }

        @if (step() === 'success') {
          <div class="centered-state">
            <div class="success-icon-wrap">
              <app-icon name="check" [size]="28" [strokeWidth]="2.5" />
            </div>
            <p class="state-title">Paiement accepté</p>
            <p class="state-sub">Votre réservation est confirmée. Un récapitulatif s'affiche ci-dessous.</p>
          </div>
        }

        @if (step() === 'failure') {
          <div class="centered-state">
            <div class="failure-icon-wrap">
              <app-icon name="x" [size]="26" />
            </div>
            <p class="state-title">Paiement refusé</p>
            <p class="state-sub">La transaction a échoué. Vérifiez vos informations et réessayez.</p>
            <button class="btn-retry" (click)="retry()">Réessayer</button>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(17, 24, 39, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }
    .modal {
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid #e5e7eb;
      width: 100%;
      max-width: 420px;
      padding: 28px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.12);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .modal-label {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #6b7280;
      display: block;
      margin-bottom: 4px;
    }
    .modal-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
      line-height: 1.3;
      max-width: 280px;
    }
    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #9ca3af;
      padding: 4px;
      display: flex;
      align-items: center;
      border-radius: 6px;
      transition: color 0.15s;
      flex-shrink: 0;
    }
    .close-btn:hover { color: #111827; }
    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 22px;
    }
    .price-label {
      font-size: 0.84rem;
      color: #6b7280;
      font-weight: 500;
    }
    .price-amount {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
    }
    .pay-form { display: flex; flex-direction: column; gap: 0; }
    .form-group { margin-bottom: 14px; }
    .form-label {
      display: block;
      font-size: 0.82rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 5px;
    }
    .form-control {
      width: 100%;
      padding: 9px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.9rem;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.15s;
      font-family: inherit;
    }
    .form-control:focus { border-color: #111827; }
    .form-control.is-invalid { border-color: #ef4444; }
    .card-input-wrapper { position: relative; }
    .card-icon {
      position: absolute;
      left: 11px;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      pointer-events: none;
    }
    .card-input { padding-left: 36px; }
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .field-error {
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: 3px;
    }
    .demo-hint {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 0.76rem;
      color: #6b7280;
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 16px;
    }
    .demo-hint strong { color: #374151; }
    .btn-pay {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px;
      background: #111827;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn-pay:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-pay:not(:disabled):hover { opacity: 0.85; }
    .centered-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 16px 0 8px;
      gap: 10px;
    }
    .processing-ring {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }
    .processing-spinner {
      width: 44px;
      height: 44px;
      border: 3px solid #e5e7eb;
      border-top-color: #111827;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success-icon-wrap {
      width: 60px;
      height: 60px;
      background: #ecfdf5;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10b981;
      margin-bottom: 4px;
    }
    .failure-icon-wrap {
      width: 60px;
      height: 60px;
      background: #fef2f2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #dc2626;
      margin-bottom: 4px;
    }
    .state-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }
    .state-sub {
      font-size: 0.84rem;
      color: #6b7280;
      margin: 0;
      max-width: 300px;
      line-height: 1.5;
    }
    .btn-retry {
      margin-top: 8px;
      padding: 9px 20px;
      background: #111827;
      color: #fff;
      border: none;
      border-radius: 7px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn-retry:hover { opacity: 0.85; }
  `],
})
export class PaymentModalComponent {
  eventTitle = input.required<string>();
  price = input.required<number>();

  close = output<void>();
  paid = output<void>();

  step = signal<PaymentStep>('form');

  private readonly fb = inject(FormBuilder);

  paymentForm: FormGroup = this.fb.group({
    cardNumber: ['', [Validators.required, luhnCheck]],
    expiry: ['', [Validators.required, expiryCheck]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
    holder: ['', [Validators.required, Validators.maxLength(100)]],
  });

  get f() { return this.paymentForm.controls; }

  formatCard(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 16);
    input.value = digits.replace(/(.{4})/g, '$1 ').trim();
    this.paymentForm.get('cardNumber')!.setValue(digits, { emitEvent: false });
  }

  formatExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
    input.value = val;
    this.paymentForm.get('expiry')!.setValue(input.value, { emitEvent: false });
  }

  pay(): void {
    if (this.paymentForm.invalid) return;
    this.step.set('processing');

    setTimeout(() => {
      const succeed = Math.random() > 0.15;
      if (succeed) {
        this.step.set('success');
        setTimeout(() => this.paid.emit(), 1200);
      } else {
        this.step.set('failure');
      }
    }, 2200);
  }

  retry(): void {
    this.step.set('form');
    this.paymentForm.reset();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      if (this.step() === 'form') this.close.emit();
    }
  }
}
