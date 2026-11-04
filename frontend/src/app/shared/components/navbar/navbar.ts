import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    <header class="header">
      <div class="container nav-content">
        <a routerLink="/" class="logo">
          <span class="logo-mark">
            <app-icon name="ticket" [size]="18" />
          </span>
          <span class="logo-text">Event<span class="logo-accent">Hub</span></span>
        </a>

        <nav class="nav-links">
          <a
            routerLink="/"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-link"
          >
            Billetterie
          </a>

          @if (authService.isAuthenticated()) {
            <a
              routerLink="/admin"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link"
            >
              Dashboard
            </a>
            <a
              routerLink="/admin/events/new"
              routerLinkActive="active"
              class="btn btn-primary btn-nav"
            >
              <app-icon name="plus" [size]="14" [strokeWidth]="2.5" />
              <span>Créer un événement</span>
            </a>
            <button
              type="button"
              class="btn-logout"
              (click)="authService.logout()"
              title="Se déconnecter"
            >
              Déconnexion
            </button>
          }
        </nav>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .nav-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 64px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      font-weight: 700;
      font-size: 1.25rem;
      color: #111827;
      letter-spacing: -0.01em;
    }
    .logo-mark {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #111827;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-accent {
      color: #4f46e5;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .nav-link {
      text-decoration: none;
      color: #4b5563;
      font-size: 0.88rem;
      font-weight: 500;
      padding: 6px 10px;
      border-radius: 6px;
      transition: color 0.15s ease;
    }
    .nav-link:hover, .nav-link.active {
      color: #111827;
    }
    .btn-nav {
      gap: 6px;
      font-size: 0.85rem;
      padding: 7px 12px;
    }
    .btn-logout {
      background: none;
      border: none;
      color: #9ca3af;
      font-size: 0.84rem;
      font-weight: 500;
      cursor: pointer;
      padding: 6px 8px;
      border-radius: 6px;
      transition: color 0.15s;
    }
    .btn-logout:hover {
      color: #dc2626;
    }
  `],
})
export class NavbarComponent {
  authService = inject(AuthService);
}
