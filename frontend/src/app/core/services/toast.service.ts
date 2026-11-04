import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts = signal<ToastMessage[]>([]);
  private counter = 0;

  showSuccess(message: string): void {
    this.addToast('success', message);
  }

  showError(message: string): void {
    this.addToast('error', message);
  }

  showInfo(message: string): void {
    this.addToast('info', message);
  }

  remove(id: number): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  private addToast(type: 'success' | 'error' | 'info', message: string): void {
    const id = ++this.counter;
    this.toasts.update((current) => [...current, { id, type, message }]);

    setTimeout(() => {
      this.remove(id);
    }, 4500);
  }
}

