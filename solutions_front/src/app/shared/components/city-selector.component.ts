import { Component, Input, Output, EventEmitter, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { LocationService, Department, City, DepartmentWithCities } from '@core/services/location.service';

@Component({
    selector: 'app-city-selector',
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CitySelectorComponent),
            multi: true
        }
    ],
    template: `
        <div class="city-selector" [class.with-search]="enableSearch">
            <!-- Modo con búsqueda -->
            <div *ngIf="enableSearch" class="search-mode">
                <div class="search-input-wrapper">
                    <input
                        type="text"
                        class="search-input"
                        [placeholder]="placeholder"
                        [(ngModel)]="searchTerm"
                        (input)="onSearch()"
                        (focus)="showResults = true"
                        [disabled]="disabled"
                    />
                    <svg 
                        *ngIf="!isLoading" 
                        class="search-icon" 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="18" 
                        height="18" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <div *ngIf="isLoading" class="spinner-small"></div>
                </div>

                <!-- Resultados de búsqueda -->
                <div *ngIf="showResults && searchResults.length > 0" class="search-results">
                    <div 
                        *ngFor="let city of searchResults" 
                        class="search-result-item"
                        (click)="selectCity(city)">
                        <span class="city-name">{{ city.name }}</span>
                        <span class="department-name">{{ city.department_name }}</span>
                    </div>
                </div>

                <!-- Ciudad seleccionada -->
                <div *ngIf="selectedCity && !showResults" class="selected-city-badge">
                    <span>{{ selectedCity.name }}, {{ selectedCity.department_name }}</span>
                    <button 
                        type="button" 
                        class="clear-btn" 
                        (click)="clearSelection()"
                        [disabled]="disabled">
                        ×
                    </button>
                </div>
            </div>

            <!-- Modo con selects en cascada (Departamento -> Ciudad) -->
            <div *ngIf="!enableSearch && useCascadeSelects" class="cascade-mode">
                <select 
                    class="department-select"
                    [(ngModel)]="selectedDepartmentId"
                    (change)="onDepartmentChange()"
                    [disabled]="disabled">
                    <option value="">Seleccionar departamento</option>
                    <option *ngFor="let dept of departments" [value]="dept.id">
                        {{ dept.name }}
                    </option>
                </select>

                <select 
                    class="city-select"
                    [(ngModel)]="value"
                    (change)="onCityChange()"
                    [disabled]="disabled || !selectedDepartmentId">
                    <option value="">Seleccionar ciudad</option>
                    <option *ngFor="let city of filteredCities" [value]="city.id">
                        {{ city.name }}
                    </option>
                </select>

                <div *ngIf="isLoading" class="loading-indicator">
                    <div class="spinner-small"></div>
                    <span>Cargando ciudades...</span>
                </div>
            </div>

            <!-- Modo con select simple agrupado -->
            <div *ngIf="!enableSearch && !useCascadeSelects" class="simple-mode">
                <select 
                    class="city-select-grouped"
                    [(ngModel)]="value"
                    (change)="onCityChange()"
                    [disabled]="disabled">
                    <option value="">{{ placeholder }}</option>
                    <optgroup 
                        *ngFor="let group of groupedCities" 
                        [label]="group.department_name">
                        <option *ngFor="let city of group.cities" [value]="city.id">
                            {{ city.name }}
                        </option>
                    </optgroup>
                </select>

                <div *ngIf="isLoading" class="loading-indicator">
                    <div class="spinner-small"></div>
                    <span>Cargando...</span>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .city-selector {
            position: relative;
            width: 100%;
        }

        .search-input-wrapper {
            position: relative;
        }

        .search-input {
            width: 100%;
            padding: 0.625rem 2.5rem 0.625rem 0.625rem;
            border: 1px solid var(--border-color, #d1d5db);
            border-radius: 0.375rem;
            font-size: 0.875rem;
            background-color: var(--bg-primary, #ffffff);
            color: var(--text-primary, #111827);
            transition: all 0.2s ease;
        }

        .search-input:focus {
            outline: none;
            border-color: var(--color-azul, #0066cc);
            box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .search-input::placeholder {
            color: var(--text-muted, #9ca3af);
        }

        .search-icon,
        .spinner-small {
            position: absolute;
            right: 0.625rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted, #6b7280);
        }

        .spinner-small {
            width: 18px;
            height: 18px;
            border: 2px solid var(--border-color, #e5e7eb);
            border-top-color: var(--color-azul, #0066cc);
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
            to { transform: translateY(-50%) rotate(360deg); }
        }

        .search-results {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--card-bg, #ffffff);
            border: 1px solid var(--border-color, #d1d5db);
            border-radius: 0.375rem;
            margin-top: 0.25rem;
            max-height: 300px;
            overflow-y: auto;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
        }

        .search-result-item {
            padding: 0.75rem;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color, #f3f4f6);
            transition: background-color 0.15s ease;
        }

        .search-result-item:hover {
            background: var(--bg-secondary, #f9fafb);
        }

        .search-result-item:last-child {
            border-bottom: none;
        }

        .city-name {
            font-weight: 500;
            color: var(--text-primary, #111827);
        }

        .department-name {
            font-size: 0.75rem;
            color: var(--text-secondary, #6b7280);
        }

        .selected-city-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            background: rgba(0, 102, 204, 0.1);
            border: 1px solid var(--color-azul, #0066cc);
            border-radius: 0.375rem;
            margin-top: 0.5rem;
            color: var(--color-azul, #0066cc);
        }

        .clear-btn {
            background: none;
            border: none;
            font-size: 1.25rem;
            cursor: pointer;
            color: var(--text-muted, #6b7280);
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.15s ease;
        }

        .clear-btn:hover {
            color: var(--text-primary, #111827);
        }

        .cascade-mode {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        .department-select,
        .city-select,
        .city-select-grouped {
            width: 100%;
            padding: 0.625rem;
            border: 1px solid var(--border-color, #d1d5db);
            border-radius: 0.375rem;
            font-size: 0.875rem;
            cursor: pointer;
            background-color: var(--bg-primary, #ffffff);
            color: var(--text-primary, #111827);
            transition: all 0.2s ease;
        }

        .department-select:focus,
        .city-select:focus,
        .city-select-grouped:focus {
            outline: none;
            border-color: var(--color-azul, #0066cc);
            box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .loading-indicator {
            grid-column: 1 / -1;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: var(--text-muted, #6b7280);
        }

        select:disabled {
            background-color: var(--bg-secondary, #f3f4f6);
            cursor: not-allowed;
            opacity: 0.7;
        }

        @media (max-width: 640px) {
            .cascade-mode {
                grid-template-columns: 1fr;
            }
        }

        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
            .search-input:focus,
            .department-select:focus,
            .city-select:focus,
            .city-select-grouped:focus {
                box-shadow: 0 0 0 3px rgba(77, 154, 255, 0.15);
            }

            .search-results {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            }

            .selected-city-badge {
                background: rgba(77, 154, 255, 0.15);
                border-color: #4D9AFF;
                color: #4D9AFF;
            }

            .spinner-small {
                border-color: var(--border-color, #404040);
                border-top-color: #4D9AFF;
            }
        }
    `]
})
export class CitySelectorComponent implements OnInit, ControlValueAccessor {
    @Input() placeholder = 'Seleccionar ciudad';
    @Input() enableSearch = false; // Habilita búsqueda con autocomplete
    @Input() useCascadeSelects = true; // Usa selects en cascada (Depto -> Ciudad)
    @Input() disabled = false;
    
    @Output() citySelected = new EventEmitter<City>();

    departments: Department[] = [];
    filteredCities: City[] = [];
    groupedCities: DepartmentWithCities[] = [];
    searchResults: City[] = [];
    selectedCity: City | null = null;
    
    selectedDepartmentId: number | string = '';
    searchTerm = '';
    showResults = false;
    isLoading = false;

    value: any;
    onChange: any = () => {};
    onTouch: any = () => {};

    private searchTimeout: any;

    constructor(private locationService: LocationService) {}

    ngOnInit(): void {
        this.loadInitialData();
    }

    private async loadInitialData(): Promise<void> {
        this.isLoading = true;

        if (this.useCascadeSelects || this.enableSearch) {
            // Cargar solo departamentos
            this.locationService.getDepartments().subscribe(departments => {
                this.departments = departments;
                this.isLoading = false;
            });
        } else {
            // Cargar todas las ciudades agrupadas
            this.locationService.getCities().subscribe(cities => {
                this.groupedCities = this.locationService.groupCitiesByDepartment(cities);
                this.isLoading = false;
            });
        }
    }

    onDepartmentChange(): void {
        if (!this.selectedDepartmentId) {
            this.filteredCities = [];
            this.value = '';
            return;
        }

        this.isLoading = true;
        const deptId = typeof this.selectedDepartmentId === 'string' 
            ? parseInt(this.selectedDepartmentId) 
            : this.selectedDepartmentId;

        this.locationService.getCities(deptId).subscribe(cities => {
            this.filteredCities = cities;
            this.isLoading = false;
        });
    }

    onCityChange(): void {
        this.onChange(this.value);
        this.onTouch();
        
        const cityId = typeof this.value === 'string' ? parseInt(this.value) : this.value;
        
        // Buscar la ciudad en las listas disponibles
        let city: City | undefined;
        if (this.filteredCities.length > 0) {
            city = this.filteredCities.find(c => c.id === cityId);
        } else if (this.groupedCities.length > 0) {
            for (const group of this.groupedCities) {
                city = group.cities.find(c => c.id === cityId);
                if (city) break;
            }
        }

        if (city) {
            this.citySelected.emit(city);
        }
    }

    onSearch(): void {
        clearTimeout(this.searchTimeout);

        if (this.searchTerm.length < 2) {
            this.searchResults = [];
            this.showResults = false;
            return;
        }

        this.searchTimeout = setTimeout(() => {
            this.isLoading = true;
            this.locationService.searchCities(this.searchTerm).subscribe(cities => {
                this.searchResults = cities;
                this.showResults = true;
                this.isLoading = false;
            });
        }, 300);
    }

    selectCity(city: City): void {
        this.selectedCity = city;
        this.value = city.id;
        this.searchTerm = city.name;
        this.showResults = false;
        
        this.onChange(this.value);
        this.onTouch();
        this.citySelected.emit(city);
    }

    clearSelection(): void {
        this.selectedCity = null;
        this.value = '';
        this.searchTerm = '';
        this.onChange(this.value);
    }

    // ControlValueAccessor implementation
    writeValue(value: any): void {
        this.value = value;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouch = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
}