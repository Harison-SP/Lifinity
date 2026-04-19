import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast } from '../../models/toast.model';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input({ required: true }) toast!: Toast;
  @Output() dismiss = new EventEmitter<string>();

  progressWidth = 100;
  private timer: any;
  private progressInterval: any;
  private startTime: number = 0;
  private remaining: number = 0;

  ngOnInit() {
    if (this.toast.autoDismiss && this.toast.duration) {
      this.remaining = this.toast.duration;
      this.startTimer();
    }
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  startTimer() {
    this.startTime = Date.now();
    this.timer = setTimeout(() => {
      this.dismiss.emit(this.toast.id);
    }, this.remaining);

    if (this.toast.duration) {
      this.progressInterval = setInterval(() => {
        const elapsed = Date.now() - this.startTime;
        const currentRemaining = Math.max(0, this.remaining - elapsed);
        this.progressWidth = (currentRemaining / this.toast.duration!) * 100;
      }, 16); // ~60fps
    }
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  onMouseEnter() {
    if (this.toast.autoDismiss) {
      const elapsed = Date.now() - this.startTime;
      this.remaining = Math.max(0, this.remaining - elapsed);
      this.clearTimer();
    }
  }

  onMouseLeave() {
    if (this.toast.autoDismiss && this.remaining > 0) {
      this.startTimer();
    }
  }

  onClose() {
    this.dismiss.emit(this.toast.id);
  }

  getIcon(): string {
    switch (this.toast.type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  }

  getIconClass(): string {
    switch (this.toast.type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-white/60';
    }
  }

  getTypeClasses(): string {
    switch (this.toast.type) {
      case 'success': return 'border-green-500/20';
      case 'error': return 'border-red-500/20';
      case 'warning': return 'border-yellow-500/20';
      case 'info': return 'border-blue-500/20';
      default: return 'border-white/10';
    }
  }
}
