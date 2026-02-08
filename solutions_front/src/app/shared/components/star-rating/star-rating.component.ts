import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss'],
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StarRatingComponent {
  @Input() rating = 0;
  @Input() maxStars = 5;
  @Input() readonly = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  @Output() ratingChange = new EventEmitter<number>();

  hoverRating = 0;

  get stars(): number[] {
    return Array(this.maxStars).fill(0).map((_, i) => i + 1);
  }

  onStarClick(star: number): void {
    if (this.readonly) return;
    this.rating = star;
    this.ratingChange.emit(star);
  }

  onStarHover(star: number): void {
    if (this.readonly) return;
    this.hoverRating = star;
  }

  onStarLeave(): void {
    this.hoverRating = 0;
  }

  getStarClass(star: number): string {
    const activeRating = this.hoverRating || this.rating;
    if (star <= activeRating) {
      return 'star filled';
    }
    return 'star';
  }

  isStarFilled(star: number): boolean {
    const activeRating = this.hoverRating || this.rating;
    return star <= activeRating;
  }

  getIconSize(): string {
    switch (this.size) {
      case 'small': return '16px';
      case 'large': return '32px';
      default: return '24px';
    }
  }
}
