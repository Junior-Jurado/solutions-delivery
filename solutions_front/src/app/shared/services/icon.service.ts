import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IconService {
  private iconCache = new Map<string, Observable<SafeHtml>>();
  private readonly basePath = '/assets/icons';

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  getIcon(category: string, name: string, preserveColors: boolean = false): Observable<SafeHtml> {
    const key = `${category}/${name}${preserveColors ? '-preserved' : ''}`;
    
    if (!this.iconCache.has(key)) {
      const url = `${this.basePath}/${category}/${name}.svg`;
      
      const icon$ = this.http.get(url, { responseType: 'text' }).pipe(
        map(svg => {
          // Si NO queremos preservar colores, los removemos para que use currentColor
          if (!preserveColors) {
            svg = this.removeHardcodedColors(svg);
          }
          return this.sanitizer.bypassSecurityTrustHtml(svg);
        }),
        shareReplay(1),
        catchError(error => {
          console.error(`Failed to load icon: ${category}/${name}`, error);
          const placeholder = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>`;
          return of(this.sanitizer.bypassSecurityTrustHtml(placeholder));
        })
      );
      
      this.iconCache.set(key, icon$);
    }
    
    return this.iconCache.get(key)!;
  }

  /**
   * Remueve colores hardcodeados del SVG para permitir control via CSS
   */
  private removeHardcodedColors(svg: string): string {
    return svg
      // Remover atributos fill con colores específicos (pero mantener fill="none")
      .replace(/fill="(?!none)[^"]*"/gi, 'fill="currentColor"')
      // Remover atributos stroke con colores específicos (pero mantener stroke="none")
      .replace(/stroke="(?!none)[^"]*"/gi, 'stroke="currentColor"')
      // Remover styles inline que definen colores
      .replace(/style="[^"]*fill:\s*[^;"]+"[^"]*/gi, '')
      .replace(/style="[^"]*stroke:\s*[^;"]+"[^"]*/gi, '');
  }

  clearCache(): void {
    this.iconCache.clear();
  }
}