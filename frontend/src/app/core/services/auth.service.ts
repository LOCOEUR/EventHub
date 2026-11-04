import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';

export interface AdminUser {
  email: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storageKey = 'eventhub_admin_user';
  private readonly tokenKey = 'eventhub_admin_token';
  private readonly http = inject(HttpClient);
  currentUser = signal<AdminUser | null>(this.getInitialUser());
  isAuthenticated = computed(() => !!this.currentUser());

  constructor(private readonly router: Router) {}

  login(email: string, password: string): Observable<AdminUser> {
    return this.http
      .post<{ accessToken: string; user: AdminUser }>('http://localhost:3000/api/auth/login', {
        email: email.trim(),
        password,
      })
      .pipe(
        tap(({ accessToken, user }) => {
          this.currentUser.set(user);
          localStorage.setItem(this.storageKey, JSON.stringify(user));
          localStorage.setItem(this.tokenKey, accessToken);
        }),
        map(({ user }) => user),
      );
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private getInitialUser(): AdminUser | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored && this.getToken() ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
