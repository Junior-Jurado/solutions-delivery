import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';

interface Service {
  icon: string;
  iconCategory: string;
  title: string;
  subtitle: string;
  features: string[];
  buttonText: string;
  buttonClass: string;
  color: 'blue' | 'red' | 'green' | 'yellow';
  borderColor: string;
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
      iconCategory: 'delivery',
      title: 'Contado',
      subtitle: 'Pago inmediato, entrega garantizada',
      features: [
        'Tarifas preferenciales',
        'Descuentos por volumen',
        'Prioridad en entrega',
        'Seguro incluido'
      ],
      buttonText: 'Cotizar Ahora',
      buttonClass: 'btn-azul',
      color: 'blue',
      borderColor: 'card-border-azul'
    },
    {
      icon: 'check-circle',
      iconCategory: 'status',
      title: 'Contra Entrega',
      subtitle: 'El destinatario paga al recibir',
      features: [
        'Sin riesgo para el remitente',
        'Confirmacion de pago',
        'Transferencia inmediata',
        'Ideal para e-commerce'
      ],
      buttonText: 'Solicitar Servicio',
      buttonClass: 'btn-rojo',
      color: 'red',
      borderColor: 'card-border-rojo'
    },
    {
      icon: 'truck',
      iconCategory: 'delivery',
      title: 'Credito',
      subtitle: 'Para empresas establecidas',
      features: [
        'Facturacion mensual',
        'Terminos flexibles',
        'Gestion corporativa',
        'Reportes detallados'
      ],
      buttonText: 'Contactar Ventas',
      buttonClass: 'btn-verde',
      color: 'green',
      borderColor: 'card-border-verde'
    }
  ];
}
