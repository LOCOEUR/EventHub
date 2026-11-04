import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { EventService } from '../../../core/services/event.service';
import { BookingService } from '../../../core/services/booking.service';
import { ToastService } from '../../../core/services/toast.service';
import { EventItem, BookingItem } from '../../../core/models/event.model';
import { IconComponent } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, DatePipe, IconComponent],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <div>
          <span class="header-badge">Espace Organisateur</span>
          <h1 class="dashboard-title">Tableau de bord</h1>
          <p class="dashboard-subtitle">Supervisez vos événements et l'état des réservations</p>
        </div>

        <div class="header-actions">
          <a routerLink="/" class="btn btn-outline btn-sm">
            Voir le site public
          </a>
          <a routerLink="/admin/events/new" class="btn btn-primary">
            <app-icon name="plus" [size]="15" [strokeWidth]="2.5" />
            <span>Créer un événement</span>
          </a>
        </div>
      </div>

      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon-wrapper">
            <app-icon name="calendar" [size]="18" />
          </div>
          <div>
            <div class="stat-value">{{ events().length }}</div>
            <div class="stat-label">Événements programmés</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper">
            <app-icon name="ticket" [size]="18" />
          </div>
          <div>
            <div class="stat-value">{{ totalBookedSpots() }}</div>
            <div class="stat-label">Billets réservés</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper">
            <app-icon name="check" [size]="18" [strokeWidth]="2.5" />
          </div>
          <div>
            <div class="stat-value">{{ totalAvailableSpots() }}</div>
            <div class="stat-label">Places encore libres</div>
          </div>
        </div>
      </div>

      
      <div class="table-card">
        <div class="table-header">
          <h2 class="table-title">Liste des événements</h2>
          <span class="table-count">{{ events().length }} événement(s)</span>
        </div>

        @if (loading()) {
          <div class="table-state">
            <div class="spinner"></div>
            <p>Chargement des événements...</p>
          </div>
        } @else if (events().length === 0) {
          <div class="table-state">
            <p>Aucun événement créé pour le moment.</p>
            <a routerLink="/admin/events/new" class="btn btn-primary btn-sm">
              Créer votre premier événement
            </a>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Titre & Lieu</th>
                  <th>Date</th>
                  <th>Réservations</th>
                  <th>Statut</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (event of events(); track event.id) {
                  <tr>
                    <td>
                      <div class="event-name">{{ event.title }}</div>
                      <div class="event-loc">{{ event.location }}</div>
                    </td>
                    <td>
                      <div class="cell-date">{{ event.date | date: 'dd/MM/yyyy' }}</div>
                      <div class="cell-time">{{ event.date | date: 'HH:mm' }}</div>
                    </td>
                    <td>
                      <div class="booking-ratio">
                        <span>{{ event.totalSpots - event.availableSpots }} / {{ event.totalSpots }}</span>
                        <span class="ratio-pct">
                          ({{ (((event.totalSpots - event.availableSpots) / event.totalSpots) * 100).toFixed(0) }}%)
                        </span>
                      </div>
                      <div class="table-progress">
                        <div
                          class="table-progress-fill"
                          [style.width.%]="((event.totalSpots - event.availableSpots) / event.totalSpots) * 100"
                          [class.is-full]="event.availableSpots === 0"
                        ></div>
                      </div>
                    </td>
                    <td>
                      @if (event.availableSpots === 0) {
                        <span class="badge badge-soldout">Complet</span>
                      } @else {
                        <span class="badge badge-available">{{ event.availableSpots }} libre(s)</span>
                      }
                    </td>
                    <td class="text-right">
                      <div class="actions-group">
                        <button
                          type="button"
                          class="btn-action"
                          [class.active]="selectedEvent()?.id === event.id"
                          (click)="toggleBookingsView(event)"
                          title="Gérer les inscrits"
                        >
                          <app-icon name="ticket" [size]="14" />
                          <span>Inscrits</span>
                        </button>
                        <a
                          [routerLink]="['/admin/events', event.id, 'edit']"
                          class="btn-action"
                          title="Modifier cet événement"
                        >
                          <app-icon name="edit" [size]="14" />
                        </a>
                        <button
                          type="button"
                          class="btn-action btn-action-danger"
                          (click)="confirmDelete(event)"
                          title="Supprimer cet événement"
                        >
                          <app-icon name="trash" [size]="14" />
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      
      @if (selectedEvent()) {
        <div class="drawer-card">
          <div class="drawer-header">
            <div>
              <h3>Inscriptions pour « {{ selectedEvent()!.title }} »</h3>
              <p class="drawer-subtitle">
                Total réservations : {{ selectedBookings().length }} • Annulez une réservation pour restituer la place
              </p>
            </div>
            <button class="btn-close-drawer" (click)="selectedEvent.set(null)">
              <app-icon name="close" [size]="14" />
            </button>
          </div>

          @if (loadingBookings()) {
            <p class="drawer-empty">Chargement des inscrits...</p>
          } @else if (selectedBookings().length === 0) {
            <p class="drawer-empty">Aucune réservation pour cet événement.</p>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Email</th>
                    <th>Date d'inscription</th>
                    <th>Statut</th>
                    <th class="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (booking of selectedBookings(); track booking.id) {
                    <tr [class.is-cancelled]="booking.status === 'CANCELLED'">
                      <td class="font-medium">{{ booking.userName }}</td>
                      <td>{{ booking.userEmail }}</td>
                      <td class="cell-date">{{ booking.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                      <td>
                        @if (booking.status === 'CONFIRMED') {
                          <span class="badge badge-available">Confirmée</span>
                        } @else {
                          <span class="badge badge-neutral">Annulée</span>
                        }
                      </td>
                      <td class="text-right">
                        @if (booking.status === 'CONFIRMED') {
                          <button
                            type="button"
                            class="btn-cancel"
                            (click)="cancelBooking(booking.id)"
                            [disabled]="cancellingId() === booking.id"
                          >
                            {{ cancellingId() === booking.id ? 'Annulation...' : 'Annuler le ticket' }}
                          </button>
                        } @else {
                          <span class="cell-muted">Place restituée</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1140px;
      margin: 0 auto;
      padding: 32px 20px 80px;
    }
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }
    .header-badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 600;
      color: #4f46e5;
      background: #eef2ff;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }
    .dashboard-title {
      font-size: 1.6rem;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.01em;
      margin: 0 0 4px;
    }
    .dashboard-subtitle {
      font-size: 0.92rem;
      color: #6b7280;
      margin: 0;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .stat-icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: #f3f4f6;
      color: #111827;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-value {
      font-size: 1.45rem;
      font-weight: 700;
      color: #111827;
      line-height: 1.1;
    }
    .stat-label {
      font-size: 0.8rem;
      color: #6b7280;
      margin-top: 2px;
    }
    .table-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f3f4f6;
    }
    .table-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    .table-count {
      font-size: 0.82rem;
      color: #6b7280;
    }
    .table-responsive {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    .data-table th {
      text-align: left;
      padding: 11px 16px;
      background: #f9fafb;
      color: #4b5563;
      font-weight: 600;
      font-size: 0.8rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: middle;
    }
    .data-table tbody tr:hover {
      background: #fbfbfb;
    }
    .is-cancelled {
      background: #fafafa;
      opacity: 0.6;
    }
    .event-name {
      font-weight: 600;
      color: #111827;
    }
    .event-loc {
      font-size: 0.8rem;
      color: #6b7280;
    }
    .cell-date {
      color: #111827;
      font-size: 0.85rem;
    }
    .cell-time {
      color: #6b7280;
      font-size: 0.78rem;
    }
    .booking-ratio {
      font-size: 0.82rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }
    .ratio-pct {
      font-weight: 400;
      color: #6b7280;
      margin-left: 4px;
    }
    .table-progress {
      width: 100px;
      background: #f3f4f6;
      height: 4px;
      border-radius: 2px;
      overflow: hidden;
    }
    .table-progress-fill {
      background: #111827;
      height: 100%;
    }
    .table-progress-fill.is-full {
      background: #ef4444;
    }
    .badge {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .badge-available { background: #ecfdf5; color: #065f46; }
    .badge-soldout { background: #fef2f2; color: #991b1b; }
    .badge-neutral { background: #f3f4f6; color: #6b7280; }
    .text-right {
      text-align: right;
    }
    .actions-group {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-action {
      height: 30px;
      padding: 0 10px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      background: #ffffff;
      color: #4b5563;
      font-size: 0.8rem;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s;
    }
    .btn-action:hover {
      background: #f9fafb;
      color: #111827;
      border-color: #d1d5db;
    }
    .btn-action.active {
      background: #111827;
      color: #ffffff;
      border-color: #111827;
    }
    .btn-action-danger:hover {
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }
    .drawer-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 24px;
    }
    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .drawer-header h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 4px;
    }
    .drawer-subtitle {
      font-size: 0.84rem;
      color: #6b7280;
      margin: 0;
    }
    .btn-close-drawer {
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 4px;
    }
    .btn-close-drawer:hover {
      color: #111827;
    }
    .drawer-empty {
      font-size: 0.88rem;
      color: #6b7280;
      padding: 20px 0;
      text-align: center;
    }
    .btn-cancel {
      background: #ffffff;
      color: #b91c1c;
      border: 1px solid #fecaca;
      border-radius: 5px;
      padding: 3px 8px;
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-cancel:hover:not(:disabled) {
      background: #fef2f2;
    }
    .cell-muted {
      font-size: 0.78rem;
      color: #9ca3af;
    }
    .font-medium {
      font-weight: 500;
      color: #111827;
    }
    .table-state {
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
      font-size: 0.9rem;
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #e5e7eb;
      border-top-color: #111827;
      border-radius: 50%;
      margin: 0 auto 10px;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly bookingService = inject(BookingService);
  private readonly toastService = inject(ToastService);

  events = signal<EventItem[]>([]);
  loading = signal<boolean>(true);

  selectedEvent = signal<EventItem | null>(null);
  selectedBookings = signal<BookingItem[]>([]);
  loadingBookings = signal<boolean>(false);
  cancellingId = signal<string | null>(null);

  totalBookedSpots = computed(() => {
    return this.events().reduce(
      (sum, e) => sum + (e.totalSpots - e.availableSpots),
      0,
    );
  });

  totalAvailableSpots = computed(() => {
    return this.events().reduce((sum, e) => sum + e.availableSpots, 0);
  });

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading.set(true);
    this.eventService.getEvents().subscribe({
      next: (data) => {
        this.events.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.toastService.showError(err.message);
        this.loading.set(false);
      },
    });
  }

  toggleBookingsView(event: EventItem): void {
    if (this.selectedEvent()?.id === event.id) {
      this.selectedEvent.set(null);
      return;
    }

    this.selectedEvent.set(event);
    this.loadingBookings.set(true);

    this.bookingService.getEventBookings(event.id).subscribe({
      next: (bookings) => {
        this.selectedBookings.set(bookings);
        this.loadingBookings.set(false);
      },
      error: () => {
        this.loadingBookings.set(false);
      },
    });
  }

  cancelBooking(bookingId: string): void {
    const confirmed = window.confirm(
      'Annuler cette réservation et restituer immédiatement la place à la vente ?',
    );
    if (!confirmed) return;

    this.cancellingId.set(bookingId);

    this.bookingService.cancelBooking(bookingId).subscribe({
      next: () => {
        this.cancellingId.set(null);
        this.toastService.showSuccess(
          'Réservation annulée. La place est de nouveau disponible.',
        );
        this.loadEvents();
        if (this.selectedEvent()) {
          this.bookingService
            .getEventBookings(this.selectedEvent()!.id)
            .subscribe((b) => this.selectedBookings.set(b));
        }
      },
      error: (err) => {
        this.cancellingId.set(null);
        this.toastService.showError(err.message);
      },
    });
  }

  confirmDelete(event: EventItem): void {
    const confirmed = window.confirm(
      `Confirmez-vous la suppression de "${event.title}" ?`,
    );
    if (!confirmed) return;

    this.eventService.deleteEvent(event.id).subscribe({
      next: () => {
        this.toastService.showSuccess(`L'événement "${event.title}" a été supprimé.`);
        if (this.selectedEvent()?.id === event.id) {
          this.selectedEvent.set(null);
        }
        this.loadEvents();
      },
      error: (err) => {
        this.toastService.showError(err.message);
      },
    });
  }
}

