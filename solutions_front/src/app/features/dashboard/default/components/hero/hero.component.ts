import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackingCardComponent } from '../tracking-card/tracking-card.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { ColombiaMapComponent } from '../colombia-map/colombia-map.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [
    CommonModule, 
    TrackingCardComponent,
    ColombiaMapComponent,
    IconComponent
  ],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss']
})
export class HeroComponent {
  @Input() mapType: 'static' | 'dynamic' = 'dynamic'; // Permite elegir el tipo de mapa
  @Output() trackingSubmit = new EventEmitter<string>();

  onTrackingSubmit(trackingNumber: string): void {
    this.trackingSubmit.emit(trackingNumber);
  }

  onCitySelected(city: any) {
    console.log('Ciudad seleccionada:', city);
    // Aquí puedes hacer lo que quieras con la ciudad
  }
}