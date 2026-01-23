import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';

interface Service {
  icon: string;
  title: string;
  subtitle: string;
  features: string[];
  buttonText: string;
  buttonClass: string;
  color: 'blue' | 'red' | 'black';
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent {
  services: Service[] = [
    {
      icon: 'package',
      title: 'Contado',
      subtitle: 'Pago inmediato, entrega garantizada',
      features: [
        'Tarifas preferenciales',
        'Descuentos por volumen',
        'Prioridad en entrega',
        'Seguro incluido'
      ],
      buttonText: 'Cotizar Ahora',
      buttonClass: 'btn-blue',
      color: 'blue'
    },
    {
      icon: 'check-circle',
      title: 'Contra Entrega',
      subtitle: 'El destinatario paga al recibir',
      features: [
        'Sin riesgo para el remitente',
        'Confirmación de pago',
        'Transferencia inmediata',
        'Ideal para e-commerce'
      ],
      buttonText: 'Solicitar Servicio',
      buttonClass: 'btn-red',
      color: 'red'
    },
    {
      icon: 'truck',
      title: 'Crédito',
      subtitle: 'Para empresas establecidas',
      features: [
        'Facturación mensual',
        'Términos flexibles',
        'Gestión corporativa',
        'Reportes detallados'
      ],
      buttonText: 'Contactar Ventas',
      buttonClass: 'btn-secondary',
      color: 'black'
    }
  ];
}