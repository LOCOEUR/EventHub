import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { EventService } from '../../../core/services/event.service';
import { BookingService } from '../../../core/services/booking.service';
import { ToastService } from '../../../core/services/toast.service';
import { EventItem, BookingItem } from '../../../core/models/event.model';
import { IconComponent } from '../../../shared/components/icon/icon';
import { PaymentModalComponent } from '../../../shared/components/payment-modal/payment-modal';

@Component({
  selector: 'app-event-detail',
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    IconComponent,
    PaymentModalComponent,
  ],
  template: `
    <div class="detail-container">
      <div class="breadcrumb">
        <a routerLink="/" class="back-link">
          <app-icon name="arrow-left" [size]="15" />
          <span>Retour aux événements</span>
        </a>
      </div>

      @if (loading()) {
        <div class="state-card">
          <div class="spinner"></div>
          <p>Chargement des détails...</p>
        </div>
      } @else if (error()) {
        <div class="state-card error-state">
          <div class="state-icon">
            <app-icon name="alert" [size]="24" />
          </div>
          <h3>Événement introuvable</h3>
          <p>{{ error() }}</p>
          <a routerLink="/" class="btn btn-outline btn-sm">Retour à l'accueil</a>
        </div>
      } @else if (event()) {
        <div class="detail-grid">
          <div class="main-info">
            <div class="event-card-detail">
              <div class="header-tags">
                <span class="category-tag">Événement culturel</span>
                @if (event()!.availableSpots === 0) {
                  <span class="badge badge-soldout">Complet</span>
                } @else if (event()!.availableSpots <= 3) {
                  <span class="badge badge-warning">{{ event()!.availableSpots }} place(s) restante(s)</span>
                } @else {
                  <span class="badge badge-available">{{ event()!.availableSpots }} places disponibles</span>
                }
              </div>

              <h1 class="event-main-title">{{ event()!.title }}</h1>

              <div class="meta-banner">
                <div class="meta-cell">
                  <div class="meta-icon-wrapper">
                    <app-icon name="calendar" [size]="18" />
                  </div>
                  <div>
                    <div class="meta-label">Date et heure</div>
                    <div class="meta-val">
                      {{ event()!.date | date: 'dd/MM/yyyy à HH:mm' }}
                    </div>
                  </div>
                </div>

                <div class="meta-cell">
                  <div class="meta-icon-wrapper">
                    <app-icon name="map-pin" [size]="18" />
                  </div>
                  <div>
                    <div class="meta-label">Lieu</div>
                    <div class="meta-val">{{ event()!.location }}</div>
                  </div>
                </div>

                <div class="meta-cell">
                  <div class="meta-icon-wrapper">
                    <app-icon name="ticket" [size]="18" />
                  </div>
                  <div>
                    <div class="meta-label">Disponibilité</div>
                    <div class="meta-val">
                      {{ event()!.availableSpots }} / {{ event()!.totalSpots }} places libres
                    </div>
                  </div>
                </div>
              </div>

              <div class="section-divider"></div>

              <h2 class="section-heading">Description</h2>
              <p class="description-text">{{ event()!.description }}</p>
            </div>

            @if (myBooking()) {
              <div class="ticket-confirmation-card">
                <div class="ticket-badge">
                  <app-icon name="check" [size]="16" [strokeWidth]="2.5" />
                  <span>Votre billet est confirmé</span>
                </div>
                <div class="ticket-content">
                  <div class="ticket-row">
                    <span class="ticket-label">Titulaire :</span>
                    <span class="ticket-val">{{ myBooking()!.userName }}</span>
                  </div>
                  <div class="ticket-row">
                    <span class="ticket-label">Email de confirmation :</span>
                    <span class="ticket-val">{{ myBooking()!.userEmail }}</span>
                  </div>
                  <div class="ticket-row">
                    <span class="ticket-label">Référence du ticket :</span>
                    <span class="ticket-code">{{ myBooking()!.id }}</span>
                  </div>
                </div>
                <div class="ticket-footer">
                  <button
                    type="button"
                    class="btn-cancel-my-ticket"
                    (click)="cancelMyBooking()"
                    [disabled]="isCancelling()"
                  >
                    {{ isCancelling() ? 'Annulation...' : 'Annuler ma réservation (libérer la place)' }}
                  </button>
                </div>
              </div>
            }
          </div>

          <div class="sidebar-booking">
            <div class="booking-card">
              <div class="booking-header">
                <h3>Réserver un ticket</h3>
                <p class="booking-subtitle">Entrée nominative • Confirmation immédiate</p>
              </div>

              @if (event()!.availableSpots === 0) {
                <div class="soldout-notice">
                  <app-icon name="slash" [size]="24" class="soldout-icon" />
                  <h4>Événement complet</h4>
                  <p>Toutes les places sont actuellement réservées.</p>
                  <span class="soldout-tip">
                    Si une place est libérée suite à une annulation, la billetterie rouvrira automatiquement.
                  </span>
                </div>
              } @else {
                <form [formGroup]="bookingForm" (ngSubmit)="submitBooking()" class="booking-form">
                  @if (event()!.ticketCategories?.length) {
                    <div class="form-group">
                      <label for="ticketCategory" class="form-label">Catégorie de billet *</label>
                      <select id="ticketCategory" formControlName="ticketCategory" class="form-control">
                        @for (category of event()!.ticketCategories; track category.name) {
                          <option [value]="category.name">{{ category.name }} - {{ category.price | number:'1.0-0' }} FCFA</option>
                        }
                      </select>
                    </div>
                  }
                  <div class="form-group">
                    <label for="userName" class="form-label">Nom et prénom *</label>
                    <input
                      id="userName"
                      type="text"
                      formControlName="userName"
                      placeholder="Ex: Aya Kouassi"
                      class="form-control"
                      [class.is-invalid]="
                        bookingForm.get('userName')?.invalid &&
                        bookingForm.get('userName')?.touched
                      "
                    />
                    @if (
                      bookingForm.get('userName')?.invalid &&
                      bookingForm.get('userName')?.touched
                    ) {
                      <div class="field-error">Veuillez renseigner votre nom</div>
                    }
                  </div>

                  <div class="form-group">
                    <label for="userEmail" class="form-label">Adresse email *</label>
                    <input
                      id="userEmail"
                      type="email"
                      formControlName="userEmail"
                      placeholder="Ex: aya.kouassi@example.com"
                      class="form-control"
                      [class.is-invalid]="
                        bookingForm.get('userEmail')?.invalid &&
                        bookingForm.get('userEmail')?.touched
                      "
                    />
                    @if (
                      bookingForm.get('userEmail')?.hasError('required') &&
                      bookingForm.get('userEmail')?.touched
                    ) {
                      <div class="field-error">L'adresse email est requise</div>
                    }
                    @if (
                      bookingForm.get('userEmail')?.hasError('email') &&
                      bookingForm.get('userEmail')?.touched
                    ) {
                      <div class="field-error">Format d'adresse email invalide</div>
                    }
                  </div>

                  @if (bookingError()) {
                    <div class="form-alert-error">
                      <app-icon name="alert" [size]="15" />
                      <span>{{ bookingError() }}</span>
                    </div>
                  }

                  <button
                    type="submit"
                    class="btn btn-primary btn-block btn-lg"
                    [disabled]="bookingForm.invalid || isSubmitting()"
                  >
                    @if (isSubmitting()) {
                      <span>Validation en cours...</span>
                    } @else {
                      <span>Confirmer ma réservation</span>
                    }
                  </button>

                  <div class="booking-guarantee">
                    <app-icon name="lock" [size]="13" />
                    <span>Réservation garantie • Annulation possible</span>
                  </div>
                </form>
              }
            </div>
          </div>
        </div>
      }
    </div>

    @if (showPaymentModal() && event()) {
      <app-payment-modal
        [eventTitle]="event()!.title"
        [price]="selectedTicketPrice()"
        (close)="closePaymentModal()"
        (paid)="completeBooking()"
      />
    }
  `,
  styles: [`
    .detail-container {
      max-width: 1140px;
      margin: 0 auto;
      padding: 24px 20px 80px;
    }
    .breadcrumb {
      margin-bottom: 20px;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 500;
      transition: color 0.15s;
    }
    .back-link:hover {
      color: #111827;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 28px;
      align-items: start;
    }
    @media (max-width: 860px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }
    .event-card-detail {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 24px;
    }
    .header-tags {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 14px;
    }
    .category-tag {
      font-size: 0.75rem;
      font-weight: 500;
      color: #4b5563;
      background: #f3f4f6;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .badge {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 4px;
    }
    .badge-available { background: #ecfdf5; color: #065f46; }
    .badge-warning { background: #fffbeb; color: #92400e; }
    .badge-soldout { background: #fef2f2; color: #991b1b; }
    .event-main-title {
      font-size: 1.85rem;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.01em;
      line-height: 1.25;
      margin: 0 0 24px;
    }
    .meta-banner {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #f3f4f6;
      margin-bottom: 24px;
    }
    .meta-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .meta-icon-wrapper {
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .meta-label {
      font-size: 0.72rem;
      color: #6b7280;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .meta-val {
      font-size: 0.92rem;
      font-weight: 600;
      color: #111827;
    }
    .section-divider {
      height: 1px;
      background: #f3f4f6;
      margin: 24px 0;
    }
    .section-heading {
      font-size: 1.15rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 12px;
    }
    .description-text {
      font-size: 0.95rem;
      color: #374151;
      line-height: 1.65;
      white-space: pre-line;
      margin: 0;
    }
    .ticket-confirmation-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-left: 4px solid #10b981;
      border-radius: 10px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .ticket-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #065f46;
      background: #ecfdf5;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .ticket-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.9rem;
      margin-bottom: 16px;
    }
    .ticket-row {
      display: flex;
      gap: 10px;
    }
    .ticket-label {
      color: #6b7280;
      min-width: 150px;
    }
    .ticket-val {
      font-weight: 500;
      color: #111827;
    }
    .ticket-code {
      font-family: monospace;
      font-size: 0.82rem;
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
      color: #111827;
    }
    .ticket-footer {
      padding-top: 14px;
      border-top: 1px solid #f3f4f6;
    }
    .btn-cancel-my-ticket {
      background: none;
      border: none;
      color: #b91c1c;
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
    }
    .btn-cancel-my-ticket:hover:not(:disabled) {
      color: #7f1d1d;
    }
    .booking-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      position: sticky;
      top: 84px;
    }
    .booking-header {
      margin-bottom: 20px;
    }
    .booking-header h3 {
      font-size: 1.15rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 4px;
    }
    .booking-subtitle {
      font-size: 0.84rem;
      color: #6b7280;
      margin: 0;
    }
    .soldout-notice {
      text-align: center;
      padding: 24px 16px;
      background: #fef2f2;
      border-radius: 8px;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .soldout-icon {
      margin-bottom: 8px;
      display: inline-flex;
    }
    .soldout-notice h4 {
      font-size: 0.95rem;
      margin: 0 0 6px;
    }
    .soldout-notice p {
      font-size: 0.84rem;
      line-height: 1.4;
      margin: 0 0 10px;
    }
    .soldout-tip {
      display: block;
      font-size: 0.78rem;
      color: #7f1d1d;
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-label {
      display: block;
      font-size: 0.84rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
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
    }
    .form-control:focus {
      border-color: #111827;
    }
    .form-control.is-invalid {
      border-color: #ef4444;
    }
    .field-error {
      font-size: 0.78rem;
      color: #dc2626;
      margin-top: 4px;
    }
    .form-alert-error {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fef2f2;
      color: #991b1b;
      padding: 9px 12px;
      border-radius: 6px;
      font-size: 0.82rem;
      margin-bottom: 14px;
      border: 1px solid #fecaca;
    }
    .btn-block {
      width: 100%;
    }
    .booking-guarantee {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 0.76rem;
      color: #6b7280;
      margin-top: 14px;
    }
    .state-card {
      text-align: center;
      padding: 48px 20px;
      background: #ffffff;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      max-width: 440px;
      margin: 40px auto;
    }
    .state-icon {
      color: #9ca3af;
      margin-bottom: 12px;
      display: flex;
      justify-content: center;
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 2px solid #e5e7eb;
      border-top-color: #111827;
      border-radius: 50%;
      margin: 0 auto 12px;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class EventDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly eventService = inject(EventService);
  private readonly bookingService = inject(BookingService);
  private readonly toastService = inject(ToastService);

  event = signal<EventItem | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);
  bookingError = signal<string | null>(null);
  showPaymentModal = signal<boolean>(false);

  myBooking = signal<BookingItem | null>(null);
  isCancelling = signal<boolean>(false);

  bookingForm: FormGroup = this.fb.group({
    ticketCategory: [''],
    userName: ['', [Validators.required, Validators.maxLength(150)]],
    userEmail: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadEventData(+idParam);
    }
  }

  loadEventData(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.eventService.getEvent(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.bookingForm.patchValue({
          ticketCategory: event.ticketCategories?.[0]?.name ?? '',
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  submitBooking(): void {
    if (this.bookingForm.invalid || !this.event()) return;

    this.bookingError.set(null);
    this.showPaymentModal.set(true);
  }

  selectedTicketPrice(): number {
    const categoryName = this.bookingForm.get('ticketCategory')?.value;
    return this.event()?.ticketCategories?.find((category) => category.name === categoryName)?.price
      ?? this.event()?.price
      ?? 0;
  }

  closePaymentModal(): void {
    if (!this.isSubmitting()) {
      this.showPaymentModal.set(false);
    }
  }

  completeBooking(): void {
    if (this.bookingForm.invalid || !this.event()) return;

    this.isSubmitting.set(true);
    const eventId = this.event()!.id;

    this.bookingService.createBooking(eventId, this.bookingForm.value).subscribe({
      next: (booking) => {
        this.isSubmitting.set(false);
        this.showPaymentModal.set(false);
        this.myBooking.set(booking);
        this.toastService.showSuccess(
          `Réservation confirmée ! Votre référence : ${booking.id.slice(0, 8)}...`,
        );
        this.bookingForm.reset();
        this.loadEventData(eventId);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.showPaymentModal.set(false);
        this.bookingError.set(err.message);
        this.toastService.showError(err.message);
      },
    });
  }

  cancelMyBooking(): void {
    if (!this.myBooking()) return;

    const confirmed = window.confirm(
      'Souhaitez-vous vraiment annuler votre billet ? La place sera immédiatement restituée.',
    );
    if (!confirmed) return;

    this.isCancelling.set(true);

    this.bookingService.cancelBooking(this.myBooking()!.id).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.myBooking.set(null);
        this.toastService.showSuccess('Votre réservation a été annulée avec succès.');
        if (this.event()) {
          this.loadEventData(this.event()!.id);
        }
      },
      error: (err) => {
        this.isCancelling.set(false);
        this.toastService.showError(err.message);
      },
    });
  }
}
