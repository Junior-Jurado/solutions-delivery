import { Injectable, ApplicationRef, EnvironmentInjector, createComponent, ComponentRef } from '@angular/core';
import { ToastComponent } from '@shared/components/toast.component';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastConfig {
  message: string;
  type: ToastType;
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
  allowHtml?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastComponentRef: ComponentRef<ToastComponent> | null = null;

  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) {
    console.log('ToastService initialized');
  }

  /**
   * Muestra un toast de éxito
   */
  success(message: string, duration = 3000): void {
    console.log('Toast success:', message);
    this.show({
      message,
      type: 'success',
      duration,
      position: 'bottom'
    });
  }

  /**
   * Muestra un toast de error
   */
  error(message: string, duration = 4000): void {
    console.log('Toast error:', message);
    this.show({
      message,
      type: 'error',
      duration,
      position: 'bottom'
    });
  }

  /**
   * Muestra un toast informativo (centrado para mensajes largos)
   */
  info(message: string, duration = 5000): void {
    console.log('Toast info:', message);
    this.show({
      message,
      type: 'info',
      duration,
      position: 'center',
      allowHtml: true
    });
  }

  /**
   * Muestra un toast de advertencia
   */
  warning(message: string, duration = 3500): void {
    console.log('Toast warning:', message);
    this.show({
      message,
      type: 'warning',
      duration,
      position: 'bottom'
    });
  }

  /**
   * Muestra un toast con configuración personalizada
   */
  show(config: ToastConfig): void {
    console.log('Showing toast with config:', config);
    
    // Si ya existe un toast, lo removemos primero
    if (this.toastComponentRef) {
      console.log('Removing existing toast');
      this.hide();
      // Esperar un poco antes de mostrar el nuevo
      setTimeout(() => this.createToast(config), 100);
    } else {
      this.createToast(config);
    }
  }

  /**
   * Crea y muestra el componente toast
   */
  private createToast(config: ToastConfig): void {
    try {
      console.log('Creating toast component');
      
      // Crear el componente usando la API moderna
      this.toastComponentRef = createComponent(ToastComponent, {
        environmentInjector: this.injector
      });

      // Configurar el componente
      this.toastComponentRef.instance.message = config.message;
      this.toastComponentRef.instance.type = config.type;
      this.toastComponentRef.instance.position = config.position || 'bottom';
      this.toastComponentRef.instance.allowHtml = config.allowHtml || false;

      console.log('Toast component configured:', {
        message: this.toastComponentRef.instance.message,
        type: this.toastComponentRef.instance.type,
        position: this.toastComponentRef.instance.position
      });

      // Adjuntar al árbol de cambio de detección
      this.appRef.attachView(this.toastComponentRef.hostView);

      // Obtener el elemento DOM
      const domElem = this.toastComponentRef.location.nativeElement as HTMLElement;
      
      // Agregar al body
      document.body.appendChild(domElem);
      console.log('Toast added to DOM');

      // Trigger change detection
      this.toastComponentRef.changeDetectorRef.detectChanges();

      // Mostrar el toast con un pequeño delay para la animación
      requestAnimationFrame(() => {
        if (this.toastComponentRef) {
          this.toastComponentRef.instance.show = true;
          this.toastComponentRef.changeDetectorRef.detectChanges();
          console.log('Toast shown');
        }
      });

      // Auto-ocultar después de la duración especificada
      setTimeout(() => {
        console.log('Auto-hiding toast');
        this.hide();
      }, config.duration || 3000);

    } catch (error) {
      console.error('Error creating toast:', error);
    }
  }

  /**
   * Oculta el toast actual
   */
  private hide(): void {
    if (this.toastComponentRef) {
      console.log('Hiding toast');
      this.toastComponentRef.instance.show = false;
      this.toastComponentRef.changeDetectorRef.detectChanges();
      
      // Esperar a que termine la animación antes de destruir
      setTimeout(() => {
        if (this.toastComponentRef) {
          console.log('Destroying toast component');
          this.appRef.detachView(this.toastComponentRef.hostView);
          this.toastComponentRef.destroy();
          this.toastComponentRef = null;
        }
      }, 300);
    }
  }
}