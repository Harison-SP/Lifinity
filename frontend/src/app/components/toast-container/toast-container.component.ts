import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.css'],
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(30px)', height: 0, marginBottom: 0 }),
          animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateX(0)', height: '*', marginBottom: '*' }))
        ], { optional: true }),
        query(':leave', [
          animate('250ms ease-in', style({ opacity: 0, transform: 'translateX(30px)', height: 0, marginBottom: 0, padding: 0 }))
        ], { optional: true })
      ])
    ])
  ]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
  toasts = this.toastService.toasts;

  dismiss(id: string) {
    this.toastService.dismiss(id);
  }
}
