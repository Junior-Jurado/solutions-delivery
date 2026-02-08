import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';

interface Feature {
  icon: string;
  iconCategory: string;
  title: string;
  description: string;
  color: 'amarillo' | 'azul' | 'rojo' | 'verde';
}

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss']
})
export class FeaturesComponent {
  features: Feature[] = [
    {
      icon: 'shield',
      iconCategory: 'misc',
      title: 'Seguridad Garantizada',
      description: 'Seguros completos y rastreo GPS en tiempo real para todos tus envíos.',
      color: 'azul'
    },
    {
      icon: 'clock',
      iconCategory: 'delivery',
      title: 'Entrega Rápida',
      description: 'Entrega en 24-48 horas en principales ciudades. Express en el mismo día.',
      color: 'rojo'
    },
    {
      icon: 'star',
      iconCategory: 'misc',
      title: 'Excelencia',
      description: '98.5% de entregas exitosas. Soporte personalizado 24/7.',
      color: 'verde'
    }
  ];
}
