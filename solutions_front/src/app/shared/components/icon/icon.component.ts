import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconService } from '@shared/services/icon.service';
import { SafeHtml } from '@angular/platform-browser';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      class="icon-wrapper" 
      [class]="customClass"
      [style.width]="size"
      [style.height]="size"
      [style.color]="color"
      [innerHTML]="icon$ | async">
    </span>
  `,
  styles: [`
    .icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      :deep(svg) {
        width: 100%;
        height: 100%;
        display: block;
      }
    }
  `]
})
export class IconComponent implements OnInit {
  @Input() category: string = 'common';
  @Input() name!: string;
  @Input() size: string = '20px';
  @Input() color?: string;
  @Input() customClass?: string;

  icon$!: Observable<SafeHtml>;

  constructor(private iconService: IconService) {}

  ngOnInit(): void {
    if (!this.name) {
      console.error('Icon name is required');
      return;
    }

    this.icon$ = this.iconService.getIcon(this.category, this.name);
  }
}