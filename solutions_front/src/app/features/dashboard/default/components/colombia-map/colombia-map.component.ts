import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface City {
  name: string;
  lat: number;
  lon: number;
  x: number;
  y: number;
  size: number;
  isCapital?: boolean;
  packages?: number;
}

interface AnimatedPackage {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

@Component({
  selector: 'app-colombia-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './colombia-map.component.html',
  styleUrls: ['./colombia-map.component.scss']
})
export class ColombiaMapComponent implements OnInit, OnDestroy {
  Math = Math;

  @Input() showAnimations = true;
  @Output() citySelected = new EventEmitter<City>();

  // ✅ COORDENADAS PRE-CALCULADAS MANUALMENTE
  // Estas posiciones fueron medidas directamente del mapa SVG
  cities: City[] = [
    { name: 'Bogotá', lat: 4.7110, lon: -74.0721, x: 403, y: 520, size: 10, isCapital: true, packages: 1250 },
    { name: 'Medellín', lat: 6.2442, lon: -75.5812, x: 358, y: 440, size: 8, packages: 890 },
    { name: 'Cali', lat: 3.4516, lon: -76.5320, x: 320, y: 570, size: 8, packages: 750 },
    { name: 'Barranquilla', lat: 10.9639, lon: -74.7964, x: 385, y: 180, size: 8, packages: 620 },
    { name: 'Cartagena', lat: 10.3910, lon: -75.4794, x: 345, y: 200, size: 7, packages: 480 },
    { name: 'Bucaramanga', lat: 7.1254, lon: -73.1198, x: 480, y: 400, size: 7, packages: 520 },
    { name: 'Cúcuta', lat: 7.8939, lon: -72.5078, x: 535, y: 365, size: 6, packages: 350 },
    { name: 'Pereira', lat: 4.8133, lon: -75.6961, x: 345, y: 505, size: 6, packages: 320 },
    { name: 'Santa Marta', lat: 11.2408, lon: -74.2099, x: 400, y: 165, size: 6, packages: 280 },
    { name: 'Ibagué', lat: 4.4389, lon: -75.2322, x: 370, y: 535, size: 5, packages: 310 },
    { name: 'Pasto', lat: 1.2136, lon: -77.2811, x: 270, y: 680, size: 5, packages: 240 },
    { name: 'Manizales', lat: 5.0689, lon: -75.5174, x: 352, y: 490, size: 5, packages: 290 },
    { name: 'Villavicencio', lat: 4.1420, lon: -73.6266, x: 465, y: 555, size: 5, packages: 270 },
    { name: 'Neiva', lat: 2.9273, lon: -75.2819, x: 370, y: 605, size: 5, packages: 260 },
    { name: 'Armenia', lat: 4.5339, lon: -75.6811, x: 348, y: 530, size: 5, packages: 250 }
  ];

  selectedCity: City | null = null;
  animatedPackages: AnimatedPackage[] = [];
  private animationInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    // Ya no necesitamos calcular nada - las coordenadas están hardcodeadas
    console.log('✅ Mapa de Colombia cargado con', this.cities.length, 'ciudades');
    
    if (this.showAnimations) {
      this.startPackageAnimation();
    }
  }

  ngOnDestroy() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
  }

  onCityClick(city: City): void {
    this.selectedCity = city;
    this.citySelected.emit(city);
    console.log('🏙️ Ciudad seleccionada:', city.name);
  }

  closeTooltip(): void {
    this.selectedCity = null;
  }

  private startPackageAnimation(): void {
    this.animationInterval = setInterval(() => {
      if (this.cities.length > 1) {
        const fromCity = this.cities[Math.floor(Math.random() * this.cities.length)];
        const toCity = this.cities[Math.floor(Math.random() * this.cities.length)];
        
        if (fromCity !== toCity) {
          const newPackage: AnimatedPackage = {
            id: Date.now() + Math.random(),
            x: fromCity.x,
            y: fromCity.y,
            targetX: toCity.x,
            targetY: toCity.y
          };

          this.animatedPackages.push(newPackage);

          setTimeout(() => {
            const index = this.animatedPackages.findIndex(p => p.id === newPackage.id);
            if (index > -1) {
              this.animatedPackages.splice(index, 1);
            }
          }, 2000);
        }
      }
    }, 3000);
  }

  getCoverageGridArray(): number[] {
    return Array.from({ length: 20 }, (_, i) => i);
  }
}