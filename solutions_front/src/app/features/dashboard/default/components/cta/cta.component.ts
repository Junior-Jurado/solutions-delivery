import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cta.component.html',
  styleUrls: ['./cta.component.scss']
})
export class CtaComponent {
  @Output() createAccountClick = new EventEmitter<void>();
  @Output() contactSalesClick = new EventEmitter<void>();

  onCreateAccountClick(): void {
    this.createAccountClick.emit();
  }

  onContactSalesClick(): void {
    this.contactSalesClick.emit();
  }
}