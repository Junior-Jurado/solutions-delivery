import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';
import { ColombiaMapComponent } from '../colombia-map/colombia-map.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [
    CommonModule,
    ColombiaMapComponent,
    IconComponent
  ],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss']
})
export class HeroComponent {
  @Input() mapType: 'static' | 'dynamic' = 'dynamic';

  onCitySelected(city: { name: string; packages?: number }) {
    console.log('Ciudad seleccionada:', city);
  }
}