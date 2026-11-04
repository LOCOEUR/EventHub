import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { EventService } from '../../../core/services/event.service';
import { ToastService } from '../../../core/services/toast.service';
import { EventItem } from '../../../core/models/event.model';
import { IconComponent } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-event-form',
  imports: [RouterLink, ReactiveFormsModule, IconComponent],
  template: `
    <div class="form-container">
      <div class="breadcrumb">
        <a routerLink="/admin" class="back-link">
          <app-icon name="arrow-left" [size]="15" />
          <span>Retour au tableau de bord</span>
        </a>
      </div>

      <div class="form-card">
        <div class="card-header">
          <div class="header-icon-wrapper">
            <app-icon [name]="isEditMode() ? 'edit' : 'calendar'" [size]="18" />
          </div>
          <div>
            <h1 class="form-title">
              {{ isEditMode() ? "Modifier l'événement" : "Créer un événement" }}
            </h1>
            <p class="form-subtitle">
              {{
                isEditMode()
                  ? "Mettez à jour les informations et la capacité"
                  : "Remplissez les détails pour ouvrir la billetterie"
              }}
            </p>
          </div>
        </div>

        @if (serverError()) {
          <div class="alert-error">
            <app-icon name="alert" [size]="15" />
            <div>{{ serverError() }}</div>
          </div>
        }

        <form [formGroup]="eventForm" (ngSubmit)="onSubmit()" class="main-form">
          <div class="form-group">
            <label for="title" class="form-label">Titre de l'événement *</label>
            <input
              id="title"
              type="text"
              formControlName="title"
              placeholder="Ex: Nuit des Arts et de la Culture"
              class="form-control"
              [class.is-invalid]="
                eventForm.get('title')?.invalid && eventForm.get('title')?.touched
              "
            />
            @if (
              eventForm.get('title')?.hasError('required') &&
              eventForm.get('title')?.touched
            ) {
              <div class="field-error">Le titre est obligatoire</div>
            }
          </div>

          <div class="form-group">
            <label for="description" class="form-label">Description *</label>
            <textarea
              id="description"
              rows="4"
              formControlName="description"
              placeholder="Programme, intervenants, déroulement..."
              class="form-control"
              [class.is-invalid]="
                eventForm.get('description')?.invalid &&
                eventForm.get('description')?.touched
              "
            ></textarea>
            @if (
              eventForm.get('description')?.hasError('required') &&
              eventForm.get('description')?.touched
            ) {
              <div class="field-error">La description est obligatoire</div>
            }
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="date" class="form-label">Date et heure de début *</label>
              <input
                id="date"
                type="datetime-local"
                formControlName="date"
                class="form-control"
                [class.is-invalid]="
                  eventForm.get('date')?.invalid && eventForm.get('date')?.touched
                "
              />
              @if (
                eventForm.get('date')?.hasError('required') &&
                eventForm.get('date')?.touched
              ) {
                <div class="field-error">La date est requise</div>
              }
            </div>

            <div class="form-group">
              <label for="location" class="form-label">Lieu *</label>
              <input
                id="location"
                type="text"
                formControlName="location"
                placeholder="Ex: Musée d'Art Moderne, Abidjan"
                class="form-control"
                [class.is-invalid]="
                  eventForm.get('location')?.invalid &&
                  eventForm.get('location')?.touched
                "
              />
              @if (
                eventForm.get('location')?.hasError('required') &&
                eventForm.get('location')?.touched
              ) {
                <div class="field-error">Le lieu est obligatoire</div>
              }
            </div>
          </div>

          <div class="form-group">
            <label for="totalSpots" class="form-label">Nombre total de places *</label>
            <input
              id="totalSpots"
              type="number"
              min="1"
              formControlName="totalSpots"
              class="form-control"
              [class.is-invalid]="
                eventForm.get('totalSpots')?.invalid &&
                eventForm.get('totalSpots')?.touched
              "
            />
            <div class="field-hint">
              @if (isEditMode() && existingEvent()) {
                Réservations actuelles : {{ existingEvent()!.totalSpots - existingEvent()!.availableSpots }}. La capacité totale ne peut pas être inférieure à ce nombre.
              } @else {
                Quota maximum de tickets mis en vente.
              }
            </div>
            @if (
              eventForm.get('totalSpots')?.hasError('min') &&
              eventForm.get('totalSpots')?.touched
            ) {
              <div class="field-error">La capacité doit être d'au moins 1 place</div>
            }
          </div>

          <div class="form-group">
            <label for="price" class="form-label">Prix du billet (FCFA) *</label>
            <input
              id="price"
              type="number"
              min="0"
              step="1"
              formControlName="price"
              class="form-control"
              [class.is-invalid]="
                eventForm.get('price')?.invalid &&
                eventForm.get('price')?.touched
              "
            />
            <div class="field-hint">Saisissez 0 pour une entrée gratuite.</div>
            @if (eventForm.get('price')?.hasError('min') && eventForm.get('price')?.touched) {
              <div class="field-error">Le prix ne peut pas être négatif</div>
            }
          </div>

          <div class="form-group">
            <div class="category-header">
              <label class="form-label">Catégories de billets</label>
              <button type="button" class="btn-action" (click)="addCategory()">Ajouter une catégorie</button>
            </div>
            <div formArrayName="ticketCategories" class="category-list">
              @for (category of ticketCategories.controls; track $index) {
                <div class="category-row" [formGroupName]="$index">
                  <input type="text" formControlName="name" placeholder="Ex: VIP" class="form-control" />
                  <input type="number" formControlName="price" min="0" step="1" placeholder="Prix en FCFA" class="form-control" />
                  <button type="button" class="btn-action btn-action-danger" (click)="removeCategory($index)">Supprimer</button>
                </div>
              }
            </div>
            <div class="field-hint">Laissez vide si vous utilisez uniquement le prix général ci-dessus.</div>
          </div>

          <div class="form-actions">
            <a routerLink="/admin" class="btn btn-outline">Annuler</a>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="eventForm.invalid || isSubmitting()"
            >
              @if (isSubmitting()) {
                <span>Enregistrement...</span>
              } @else {
                <span>{{ isEditMode() ? 'Mettre à jour' : "Créer l'événement" }}</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 720px;
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
    .form-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 32px;
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid #f3f4f6;
    }
    .header-icon-wrapper {
      width: 42px;
      height: 42px;
      border-radius: 8px;
      background: #f3f4f6;
      color: #111827;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .form-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.01em;
      margin: 0 0 2px;
    }
    .form-subtitle {
      font-size: 0.88rem;
      color: #6b7280;
      margin: 0;
    }
    .alert-error {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fef2f2;
      color: #991b1b;
      padding: 10px 14px;
      border-radius: 6px;
      border: 1px solid #fecaca;
      margin-bottom: 20px;
      font-size: 0.85rem;
    }
    .form-group {
      margin-bottom: 18px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 600px) {
      .form-row {
        grid-template-columns: 1fr;
      }
      .form-card {
        padding: 20px;
      }
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
      padding: 9px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.9rem;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.15s;
      font-family: inherit;
    }
    .form-control:focus {
      border-color: #111827;
    }
    .form-control.is-invalid {
      border-color: #ef4444;
    }
    .field-hint {
      font-size: 0.78rem;
      color: #6b7280;
      margin-top: 5px;
    }
    .field-error {
      font-size: 0.78rem;
      color: #dc2626;
      margin-top: 4px;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid #f3f4f6;
    }
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .category-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .category-row {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 8px;
      align-items: start;
    }
    .btn-action {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: #fff;
      color: #374151;
      padding: 8px 10px;
      cursor: pointer;
      white-space: nowrap;
    }
    .btn-action-danger { color: #b91c1c; }
    @media (max-width: 600px) {
      .category-row { grid-template-columns: 1fr 1fr; }
      .category-row .btn-action { grid-column: 1 / -1; }
    }
  `],
})
export class EventFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly toastService = inject(ToastService);

  isEditMode = signal<boolean>(false);
  eventId = signal<number | null>(null);
  existingEvent = signal<EventItem | null>(null);
  isSubmitting = signal<boolean>(false);
  serverError = signal<string | null>(null);

  eventForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', [Validators.required]],
    date: ['', [Validators.required]],
    location: ['', [Validators.required, Validators.maxLength(255)]],
    totalSpots: [50, [Validators.required, Validators.min(1)]],
    price: [0, [Validators.required, Validators.min(0)]],
    ticketCategories: this.fb.array([]),
  });

  get ticketCategories(): FormArray {
    return this.eventForm.get('ticketCategories') as FormArray;
  }

  addCategory(category = { name: '', price: 0 }): void {
    this.ticketCategories.push(
      this.fb.group({
        name: [category.name, [Validators.required, Validators.maxLength(100)]],
        price: [category.price, [Validators.required, Validators.min(0)]],
      }),
    );
  }

  removeCategory(index: number): void {
    this.ticketCategories.removeAt(index);
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode.set(true);
      this.eventId.set(+idParam);
      this.loadEvent(+idParam);
    }
  }

  loadEvent(id: number): void {
    this.eventService.getEvent(id).subscribe({
      next: (event) => {
        this.existingEvent.set(event);
        const d = new Date(event.date);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

        this.eventForm.patchValue({
          title: event.title,
          description: event.description,
          date: formattedDate,
          location: event.location,
          totalSpots: event.totalSpots,
          price: event.price,
        });
        this.ticketCategories.clear();
        for (const category of event.ticketCategories ?? []) {
          this.addCategory(category);
        }
      },
      error: (err) => {
        this.serverError.set(err.message);
        this.toastService.showError('Impossible de charger les données de cet événement.');
      },
    });
  }

  onSubmit(): void {
    if (this.eventForm.invalid) return;

    this.isSubmitting.set(true);
    this.serverError.set(null);

    const formVal = this.eventForm.value;
    const payload = {
      ...formVal,
      date: new Date(formVal.date).toISOString(),
      totalSpots: +formVal.totalSpots,
      price: +formVal.price,
      ticketCategories: (formVal.ticketCategories ?? []).map((category: { name: string; price: number }) => ({
        name: category.name,
        price: +category.price,
      })),
    };

    if (this.isEditMode() && this.eventId()) {
      this.eventService.updateEvent(this.eventId()!, payload).subscribe({
        next: (updated) => {
          this.isSubmitting.set(false);
          this.toastService.showSuccess(`Événement "${updated.title}" mis à jour.`);
          this.router.navigate(['/admin']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.serverError.set(err.message);
          this.toastService.showError(err.message);
        },
      });
    } else {
      this.eventService.createEvent(payload).subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.toastService.showSuccess(`Événement "${created.title}" créé.`);
          this.router.navigate(['/admin']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.serverError.set(err.message);
          this.toastService.showError(err.message);
        },
      });
    }
  }
}
