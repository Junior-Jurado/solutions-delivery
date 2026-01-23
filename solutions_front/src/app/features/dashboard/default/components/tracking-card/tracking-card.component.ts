import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-tracking-card',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './tracking-card.component.html',
  styleUrls: ['./tracking-card.component.scss']
})
export class TrackingCardComponent {
  trackingNumber: string = '';
  
  @Output() trackingSubmit = new EventEmitter<string>();

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.trackingNumber.trim()) {
      this.trackingSubmit.emit(this.trackingNumber);
    }
  }
}