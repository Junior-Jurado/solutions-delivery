import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable } from 'rxjs';
import { debounceTime, map, startWith } from 'rxjs/operators';

export interface DeviceInfo {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    screenWidth: number;
    screenHeight: number;
}

@Injectable({ providedIn: 'root' })
export class DeviceDetectionService {
    private deviceInfo$ = new BehaviorSubject<DeviceInfo>(this.getDeviceInfo());

    constructor() {
        // Escuchar cambios de tamaño de ventana
        fromEvent(window, 'resize')
            .pipe(debounceTime(200))
            .subscribe(() => {
                this.deviceInfo$.next(this.getDeviceInfo());
            });
    }

    /**
     * Observable del estado del dispositivo
     */
    getDeviceInfo$(): Observable<DeviceInfo> {
        return this.deviceInfo$.asObservable();
    }

    /**
     * Obtiene información actual del dispositivo
     */
    getDeviceInfo(): DeviceInfo {
        const width = window.innerWidth;
        const height = window.innerHeight;

        return {
            isMobile: width < 768,
            isTablet: width >= 768 && width < 1024,
            isDesktop: width >= 1024,
            screenWidth: width,
            screenHeight: height
        };
    }

    /**
     * Verifica si es dispositivo móvil
     */
    isMobile(): boolean {
        return this.deviceInfo$.value.isMobile;
    }

    /**
     * Verifica si es tablet
     */
    isTablet(): boolean {
        return this.deviceInfo$.value.isTablet;
    }

    /**
     * Verifica si es desktop
     */
    isDesktop(): boolean {
        return this.deviceInfo$.value.isDesktop;
    }

    /**
     * Detecta si es touch device
     */
    isTouchDevice(): boolean {
        return 'ontouchstart' in window || 
               navigator.maxTouchPoints > 0 ||
               (navigator as any).msMaxTouchPoints > 0;
    }
}