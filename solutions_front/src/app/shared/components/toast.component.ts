import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastType } from '@shared/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" [class.show]="show" [class.center]="position === 'center'">
      <div class="toast" 
           [class.toast-success]="type === 'success'" 
           [class.toast-error]="type === 'error'"
           [class.toast-info]="type === 'info'"
           [class.toast-warning]="type === 'warning'"
           [class.toast-center]="position === 'center'">
        <div class="toast-icon">
          <!-- Success Icon -->
          <svg *ngIf="type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <!-- Error Icon -->
          <svg *ngIf="type === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <!-- Info Icon -->
          <svg *ngIf="type === 'info'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <!-- Warning Icon -->
          <svg *ngIf="type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="toast-content">
          <p *ngIf="!allowHtml">{{ message }}</p>
          <p *ngIf="allowHtml" [innerHTML]="message"></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed !important;
      right: 20px;
      z-index: 10000;
      opacity: 0;
      bottom: 20px;
      transform: translateY(20px);
      transition: all 0.3s ease-in-out;
      pointer-events: none;
      z-index: 99999 !important;
    }

    .toast-container.center {
      top: 50%;
      left: 50%;
      right: auto;
      transform: translate(-50%, -50%) scale(0.9);
      max-width: 90vw;
    }

    .toast-container.show {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .toast-container.center.show {
      transform: translate(-50%, -50%) scale(1);
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 18px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-left: 4px solid #3b82f6;
      min-width: 300px;
      max-width: 500px;
    }

    .toast.toast-center {
      min-width: 400px;
      max-width: 600px;
      padding: 20px 24px;
    }

    .toast-success {
      border-left-color: #10b981;
      background: #f0fdf4;
    }

    .toast-error {
      border-left-color: #ef4444;
      background: #fef2f2;
    }

    .toast-info {
      border-left-color: #3b82f6;
      background: #eff6ff;
    }

    .toast-warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }

    .toast-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    }

    .toast-success .toast-icon {
      color: #10b981;
    }

    .toast-error .toast-icon {
      color: #ef4444;
    }

    .toast-info .toast-icon {
      color: #3b82f6;
    }

    .toast-warning .toast-icon {
      color: #f59e0b;
    }

    .toast-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .toast-content p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: #374151;
      white-space: pre-wrap;
    }

    .toast-center .toast-content p {
      font-size: 15px;
      line-height: 1.6;
    }

    @media (max-width: 640px) {
      .toast-container {
        right: 10px;
        left: 10px;
        top: 10px;
      }

      .toast-container.center {
        top: 50%;
        left: 50%;
        right: auto;
        width: calc(100% - 20px);
      }

      .toast {
        min-width: unset;
        width: 100%;
      }

      .toast.toast-center {
        min-width: unset;
        max-width: unset;
      }
    }
  `]
})
export class ToastComponent {
  @Input() message: string = '';
  @Input() type: ToastType = 'info';
  @Input() position: 'top' | 'bottom' | 'center' = 'bottom';
  @Input() allowHtml: boolean = false;
  
  show: boolean = false;
}