import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@shared/components/icon/icon.component';
import { TranslationService } from '@shared/services/translation.service';

export interface QuoteData {
  serviceType: string;
  weight: number;
  declaredValue: number;
  pieces: number;
  dimensions: string;
  insurance: string;
  content: string;
  observations: string;
}

@Component({
  selector: 'app-quote',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quote.component.html',
  styleUrls: ['./quote.component.scss']
})
export class QuoteComponent {
  @Input() quoteData: QuoteData = {
    serviceType: '',
    weight: 0,
    declaredValue: 0,
    pieces: 1,
    dimensions: '20x15x10',
    insurance: 'no',
    content: '',
    observations: ''
  };
  @Input() result: number | null = null;
  
  @Output() calculate = new EventEmitter<QuoteData>();
  @Output() reset = new EventEmitter<void>();
  @Output() proceedToCreate = new EventEmitter<void>();

  constructor(public translationService: TranslationService) {}

  onCalculate(): void {
    this.calculate.emit(this.quoteData);
  }

  onReset(): void {
    this.reset.emit();
  }

  onProceedToCreate(): void {
    this.proceedToCreate.emit();
  }

  formatPrice(price: number): string {
    return this.translationService.formatCurrency(price);
  }
}