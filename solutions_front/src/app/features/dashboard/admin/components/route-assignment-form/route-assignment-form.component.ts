import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface DeliveryPerson {
  id: string;
  name: string;
}

export interface PackageItem {
  id: string;
  address: string;
  selected: boolean;
}

export interface RouteAssignment {
  deliveryPersonId: string;
  packageIds: string[];
  priority: string;
}

@Component({
  selector: 'app-route-assignment-form',
  standalone: true,
  templateUrl: './route-assignment-form.component.html',
  styleUrls: ['./route-assignment-form.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class RouteAssignmentFormComponent {
  @Input() deliveryPersons: DeliveryPerson[] = [];
  @Input() availablePackages: PackageItem[] = [];
  @Output() assignRoute = new EventEmitter<RouteAssignment>();

  selectedDeliveryPerson: string = '';
  selectedPriority: string = '';

  priorities = [
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Media' },
    { value: 'low', label: 'Baja' }
  ];

  onSubmit(): void {
    const selectedPackages = this.availablePackages
      .filter(p => p.selected)
      .map(p => p.id);

    if (this.selectedDeliveryPerson && selectedPackages.length > 0) {
      this.assignRoute.emit({
        deliveryPersonId: this.selectedDeliveryPerson,
        packageIds: selectedPackages,
        priority: this.selectedPriority
      });

      // Reset form
      this.selectedDeliveryPerson = '';
      this.selectedPriority = '';
      this.availablePackages.forEach(p => p.selected = false);
    }
  }

  togglePackage(pkg: PackageItem): void {
    pkg.selected = !pkg.selected;
  }
}
