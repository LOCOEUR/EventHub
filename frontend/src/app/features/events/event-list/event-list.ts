import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../core/services/event.service';
import { EventItem } from '../../../core/models/event.model';
import { IconComponent } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-event-list',
  imports: [RouterLink, DatePipe, FormsModule, IconComponent],
  template: `
    <div class="event-list-container">
      <section class="section-header">
        <div>
          <h1 class="page-title">Programmation culturelle</h1>
          <p class="page-subtitle">
            Découvrez nos événements et réservez vos billets en ligne
          </p>
        </div>

        <div class="search-input-wrapper">
          <app-icon name="search" [size]="15" class="search-icon" />
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Rechercher un événement..."
            class="search-input"
          />
          @if (searchQuery()) {
            <button class="clear-btn" (click)="searchQuery.set('')" aria-label="Effacer la recherche">
              <app-icon name="close" [size]="13" />
            </button>
          }
        </div>
      </section>

      @if (loading()) {
        <div class="state-card">
          <div class="spinner"></div>
          <p>Chargement des événements...</p>
        </div>
      } @else if (errorMessage()) {
        <div class="state-card error-state">
          <div class="state-icon">
            <app-icon name="alert" [size]="24" />
          </div>
          <h3>Erreur de connexion</h3>
          <p>{{ errorMessage() }}</p>
          <button class="btn btn-outline btn-sm" (click)="loadEvents()">Réessayer</button>
        </div>
      } @else if (filteredEvents().length === 0) {
        <div class="state-card">
          <div class="state-icon">
            <app-icon name="calendar" [size]="28" [strokeWidth]="1.8" />
          </div>
          @if (searchQuery()) {
            <h3>Aucun résultat pour "{{ searchQuery() }}"</h3>
            <p>Essayez avec d'autres termes de recherche.</p>
            <button class="btn btn-outline btn-sm" (click)="searchQuery.set('')">Effacer le filtre</button>
          } @else {
            <h3>Aucun événement programmé</h3>
            <p>De nouvelles dates seront publiées prochainement.</p>
          }
        </div>
      } @else {
        <div class="events-grid">
          @for (event of filteredEvents(); track event.id) {
            <article class="event-card">
              <div class="card-header">
                <span class="event-date">{{ event.date | date: 'dd/MM/yyyy' }}</span>
                <div class="capacity-status">
                  @if (event.availableSpots === 0) {
                    <span class="badge badge-soldout">Complet</span>
                  } @else if (event.availableSpots <= 3) {
                    <span class="badge badge-warning">{{ event.availableSpots }} place(s) restante(s)</span>
                  } @else {
                    <span class="badge badge-available">{{ event.availableSpots }} places libres</span>
                  }
                </div>
              </div>

              <div class="card-body">
                <h2 class="event-title">
                  <a [routerLink]="['/events', event.id]">{{ event.title }}</a>
                </h2>

                <div class="meta-row">
                  <app-icon name="map-pin" [size]="14" class="meta-icon" />
                  <span>{{ event.location }}</span>
                </div>

                <div class="meta-row">
                  <app-icon name="clock" [size]="14" class="meta-icon" />
                  <span>{{ event.date | date: 'HH:mm' }}</span>
                </div>

                <p class="event-desc">{{ event.description }}</p>

                <div class="capacity-bar-wrapper">
                  <div class="capacity-bar-labels">
                    <span>Disponibilité</span>
                    <span>{{ event.availableSpots }} / {{ event.totalSpots }} restantes</span>
                  </div>
                  <div class="progress-track">
                    <div
                      class="progress-fill"
                      [style.width.%]="((event.totalSpots - event.availableSpots) / event.totalSpots) * 100"
                      [class.progress-full]="event.availableSpots === 0"
                    ></div>
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <a [routerLink]="['/events', event.id]" class="btn btn-primary btn-block btn-sm">
                  @if (event.availableSpots === 0) {
                    Voir les détails
                  } @else {
                    Réserver un ticket
                  }
                </a>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .event-list-container {
      max-width: 1140px;
      margin: 0 auto;
      padding: 32px 20px 80px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }
    .page-title {
      font-size: 1.6rem;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.01em;
      margin-bottom: 4px;
    }
    .page-subtitle {
      font-size: 0.95rem;
      color: #6b7280;
    }
    .search-input-wrapper {
      position: relative;
      width: 280px;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      color: #9ca3af;
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 8px 32px 8px 36px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.88rem;
      background: #ffffff;
      outline: none;
      transition: border-color 0.15s;
    }
    .search-input:focus {
      border-color: #111827;
    }
    .clear-btn {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      cursor: pointer;
      color: #9ca3af;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    .event-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      transition: border-color 0.15s;
    }
    .event-card:hover {
      border-color: #9ca3af;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      border-bottom: 1px solid #f3f4f6;
    }
    .event-date {
      font-size: 0.82rem;
      font-weight: 600;
      color: #6b7280;
    }
    .badge {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 4px;
    }
    .badge-available {
      background: #ecfdf5;
      color: #065f46;
    }
    .badge-warning {
      background: #fffbeb;
      color: #92400e;
    }
    .badge-soldout {
      background: #fef2f2;
      color: #991b1b;
    }
    .card-body {
      padding: 18px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }
    .event-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 10px;
      line-height: 1.35;
    }
    .event-title a {
      color: #111827;
      text-decoration: none;
    }
    .event-title a:hover {
      color: #4f46e5;
    }
    .meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.84rem;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .meta-icon {
      color: #9ca3af;
      flex-shrink: 0;
    }
    .event-desc {
      font-size: 0.88rem;
      color: #4b5563;
      line-height: 1.5;
      margin: 10px 0 16px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .capacity-bar-wrapper {
      margin-top: auto;
      padding-top: 10px;
    }
    .capacity-bar-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .progress-track {
      background: #f3f4f6;
      height: 4px;
      border-radius: 2px;
      overflow: hidden;
    }
    .progress-fill {
      background: #111827;
      height: 100%;
      border-radius: 2px;
      transition: width 0.2s ease;
    }
    .progress-fill.progress-full {
      background: #ef4444;
    }
    .card-footer {
      padding: 12px 18px;
      border-top: 1px solid #f3f4f6;
      background: #ffffff;
      border-radius: 0 0 10px 10px;
    }
    .btn-block {
      width: 100%;
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
    .state-card h3 {
      font-size: 1.05rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 6px;
    }
    .state-card p {
      font-size: 0.88rem;
      color: #6b7280;
      margin-bottom: 16px;
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
export class EventListComponent implements OnInit {
  private readonly eventService = inject(EventService);

  events = signal<EventItem[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  searchQuery = signal<string>('');

  filteredEvents = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.events();
    return this.events().filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        e.location.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query),
    );
  });

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.eventService.getEvents().subscribe({
      next: (data) => {
        this.events.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
