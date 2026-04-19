import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '../models/toast.model';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly MAX_TOASTS = 5;
  private readonly DEFAULT_DURATION = 5000;

  toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'info', duration: number = this.DEFAULT_DURATION) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { 
      id, 
      message, 
      type, 
      duration, 
      autoDismiss: duration > 0 
    };

    this.toasts.update(currentToasts => {
      const updatedToasts = [...currentToasts, newToast];
      if (updatedToasts.length > this.MAX_TOASTS) {
        // Shift out the oldest one (FIFO)
        return updatedToasts.slice(1);
      }
      return updatedToasts;
    });
  }

  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }

  dismiss(id: string) {
    this.toasts.update(currentToasts => currentToasts.filter(t => t.id !== id));
  }

  clearAll() {
    this.toasts.set([]);
  }
}
