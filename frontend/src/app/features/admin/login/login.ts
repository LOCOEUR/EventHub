import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-admin-login',
  imports: [RouterLink, ReactiveFormsModule, IconComponent],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-header">
          <div class="brand-badge">
            <app-icon name="lock" [size]="20" />
          </div>
          <h1 class="login-title">Espace Gestion</h1>
          <p class="login-subtitle">Connectez-vous pour administrer les événements</p>
        </div>

        <div class="demo-box">
          <span class="demo-label">Compte de test :</span>
          <code>admin&#64;eventhub.com</code> / <code>admin123</code>
        </div>

        @if (errorMessage()) {
          <div class="alert-error">
            <app-icon name="alert" [size]="15" />
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="email" class="form-label">Identifiant ou Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="form-control"
              placeholder="admin@eventhub.com"
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Mot de passe</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="form-control"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block btn-lg"
            [disabled]="loginForm.invalid"
          >
            Se connecter
          </button>
        </form>

        <div class="login-footer">
          <a routerLink="/" class="back-link">
            <app-icon name="arrow-left" [size]="14" />
            <span>Retour à la billetterie publique</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: calc(100vh - 120px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 30px 20px;
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 36px 30px;
    }
    .login-header {
      text-align: center;
      margin-bottom: 24px;
    }
    .brand-badge {
      width: 44px;
      height: 44px;
      background: #f3f4f6;
      color: #111827;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;
    }
    .login-title {
      font-size: 1.45rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 4px;
    }
    .login-subtitle {
      font-size: 0.88rem;
      color: #6b7280;
      margin: 0;
    }
    .demo-box {
      background: #f9fafb;
      border: 1px dashed #d1d5db;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 0.82rem;
      color: #4b5563;
      margin-bottom: 20px;
      text-align: center;
    }
    .demo-label {
      font-weight: 600;
      margin-right: 4px;
    }
    code {
      background: #e5e7eb;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 0.8rem;
    }
    .alert-error {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fef2f2;
      color: #991b1b;
      padding: 10px 14px;
      border-radius: 6px;
      border: 1px solid #fecaca;
      margin-bottom: 18px;
      font-size: 0.84rem;
    }
    .form-group {
      margin-bottom: 18px;
    }
    .form-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }
    .form-control {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.92rem;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.15s;
    }
    .form-control:focus {
      border-color: #111827;
    }
    .btn-block {
      width: 100%;
      margin-top: 10px;
    }
    .login-footer {
      margin-top: 24px;
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #f3f4f6;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: #6b7280;
      text-decoration: none;
      font-weight: 500;
    }
    .back-link:hover {
      color: #111827;
    }
  `],
})
export class AdminLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  errorMessage = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    email: ['admin@eventhub.com', [Validators.required]],
    password: ['admin123', [Validators.required]],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;
    const success = this.authService.login(email, password);

    if (success) {
      this.toastService.showSuccess('Connexion réussie à l\'espace gestion.');
      this.router.navigate(['/admin']);
    } else {
      this.errorMessage.set('Identifiants incorrects. Veuillez réessayer.');
    }
  }
}

