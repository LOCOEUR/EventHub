import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-toast',
  imports: [IconComponent],
  template: `
    <aside class="toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [class]="'toast-' + toast.type" role="status">
          <div class="toast-icon">
            @if (toast.type === 'success') {
              <app-icon name="check" [size]="16" [strokeWidth]="2.5" />
            } @else if (toast.type === 'error') {
              <app-icon name="alert" [size]="16" />
            } @else {
              <app-icon name="info" [size]="16" />
            }
          </div>
          <div class="toast-message">{{ toast.message }}</div>
          <button
            type="button"
            class="toast-close"
            (click)="toastService.remove(toast.id)"
            aria-label="Fermer"
          >
            <app-icon name="close" [size]="13" />
          </button>
        </div>
      }
    </aside>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
      width: calc(100% - 48px);
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      font-size: 0.9rem;
      color: #1f2937;
    }
    .toast-success .toast-icon {
      color: #059669;
    }
    .toast-error .toast-icon {
      color: #dc2626;
    }
    .toast-info .toast-icon {
      color: #2563eb;
    }
    .toast-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .toast-message {
      flex-grow: 1;
      line-height: 1.4;
      font-weight: 500;
    }
    .toast-close {
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
    }
    .toast-close:hover {
      color: #111827;
    }
  `],
})
export class ToastComponent {
  toastService = inject(ToastService);
}
