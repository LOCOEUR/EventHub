import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/events/event-list/event-list').then(
        (m) => m.EventListComponent,
      ),
  },
  {
    path: 'events/:id',
    loadComponent: () =>
      import('./features/events/event-detail/event-detail').then(
        (m) => m.EventDetailComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/admin/login/login').then(
        (m) => m.AdminLoginComponent,
      ),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'events/new',
        loadComponent: () =>
          import('./features/events/event-form/event-form').then(
            (m) => m.EventFormComponent,
          ),
      },
      {
        path: 'events/:id/edit',
        loadComponent: () =>
          import('./features/events/event-form/event-form').then(
            (m) => m.EventFormComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
