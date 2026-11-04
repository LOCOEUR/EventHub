import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface AdminUser {
  email: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storageKey = 'eventhub_admin_user';
  currentUser = signal<AdminUser | null>(this.getInitialUser());
  isAuthenticated = computed(() => !!this.currentUser());

  constructor(private readonly router: Router) {}

  login(email: string, password: string): boolean {
    if (
      (email === 'admin@eventhub.com' && password === 'admin123') ||
      (email.trim().length > 0 && password.length >= 4)
    ) {
      const user: AdminUser = {
        email: email.trim(),
        name: 'Administrateur',
      };
      this.currentUser.set(user);
      localStorage.setItem(this.storageKey, JSON.stringify(user));
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(this.storageKey);
    this.router.navigate(['/']);
  }

  private getInitialUser(): AdminUser | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}

