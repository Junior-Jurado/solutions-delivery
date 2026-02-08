import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';

// Services
import { City } from '@core/services/location.service';
import { CreateGuideResponse, GuideFormValue } from '@core/services/guide.service';
import { AuthService } from '@core/services/auth.service';
import { ClientService, ClientProfile } from '@core/services/client.service';
import {
    FrequentPartyService,
    FrequentPartyUnique,
    FrequentParty,
    CreateFrequentPartyRequest
} from '@core/services/frequent-party.service';

// Components
import { CitySelectorComponent } from '@shared/components/city-selector.component';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
    selector: 'app-guide-form',
    standalone: true,
    templateUrl: './guide-form.component.html',
    styleUrls: ['./guide-form.component.scss'],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        CitySelectorComponent,
        IconComponent
    ]
})
export class GuideFormComponent implements OnInit, OnDestroy {
    @Input() currentUserId = '';
    @Output() guideCreated = new EventEmitter<CreateGuideResponse>();
    @Output() formSubmit = new EventEmitter<GuideFormValue>();

    guideForm: FormGroup;
    isSubmitting = false;

    // ==========================================
    // CONTROL DE ACCESO POR ROL
    // ==========================================
    userRole = '';
    enableAutocomplete = false; // Solo ADMIN y SECRETARY
    enableAddressHistory = false;      // TODOS pueden ver direcciones (propias o de clientes)


    // ==========================================
    // AUTOCARGA DE DATOS PARA CLIENT
    // ==========================================
    isLoadingClientData = false;
    clientDataLoaded = false;
    clientDocumentNumber = '';          // Número de documento del CLIENT para buscar sus direcciones
    isClientReadonly = false;

    // ==========================================
    // AUTOCOMPLETADO DE REMITENTE
    // ==========================================
    senderSearchControl = new FormControl('');
    senderClientSuggestions: FrequentPartyUnique[] = [];
    selectedSenderClient: FrequentPartyUnique | null = null;
    selectedSenderCity: City | null = null;
    senderAddresses: FrequentParty[] = [];
    showSenderSuggestions = false;
    isLoadingSenderSuggestions = false;
    isLoadingSenderAddresses = false;

    // ==========================================
    // AUTOCOMPLETADO DE DESTINATARIO
    // ==========================================
    receiverSearchControl = new FormControl('');
    receiverClientSuggestions: FrequentPartyUnique[] = [];
    selectedReceiverClient: FrequentPartyUnique | null = null;
    selectedReceiverCity: City | null = null;
    receiverAddresses: FrequentParty[] = [];
    showReceiverSuggestions = false;
    isLoadingReceiverSuggestions = false;
    isLoadingReceiverAddresses = false;

    // Opciones de formulario
    serviceTypes: string[] = ['Contado', 'Contra Entrega', 'Crédito'];
    priorities: string[] = ['Normal', 'Express', 'Urgente'];
    insuranceOptions: string[] = ['No', 'Básico', 'Completo'];
    documentTypes: string[] = ['CC', 'CE', 'NIT', 'TI', 'PAS'];

    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private clientService: ClientService,
        private frequentPartyService: FrequentPartyService
    ) {
        this.guideForm = this.initializeForm();
    }

    ngOnInit(): void {
        this.detectUserRole();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ==========================================
    // DETECCIÓN DE ROL Y CARGA INICIAL
    // ==========================================
    private detectUserRole(): void {
        this.authService.getUserRole$().subscribe({
            next: async (role: string) => {
                this.userRole = role;
                
                // ADMIN y SECRETARY: Pueden buscar clientes Y ver direcciones de cualquier cliente
                this.enableAutocomplete = (role === 'ADMIN' || role === 'SECRETARY');
                
                // TODOS los roles pueden ver historial de direcciones
                this.enableAddressHistory = true; // Habilitado para todos

                this.isClientReadonly = (role === 'CLIENT');
                
                console.log(`[GuideForm] Rol: ${role}`);
                console.log(`[GuideForm] Autocompletado de clientes: ${this.enableAutocomplete ? 'Sí' : 'No'}`);
                console.log(`[GuideForm] Historial de direcciones: ${this.enableAddressHistory ? 'Sí' : 'No'}`);
                console.log(`[GuideForm] Campos readonly: ${this.isClientReadonly ? 'Sí' : 'No'}`);

                // Configurar autocompletado si tiene permiso
                if (this.enableAutocomplete) {
                    this.setupSenderAutocomplete();
                    this.setupReceiverAutocomplete();
                }

                // Si es CLIENT, autocargar sus datos como remitente
                if (role === 'CLIENT') {
                    await this.loadClientDataAsSender();
                }
            },
            error: (error: Error) => {
                console.error('[GuideForm] Error al obtener rol:', error);
                this.enableAutocomplete = false;
                this.enableAddressHistory = false;
                this.isClientReadonly = false;
            }
        });
    }

   
    // ==========================================
    // AUTOCARGA DE DATOS PARA CLIENT
    // ==========================================
   private async loadClientDataAsSender(): Promise<void> {
        if (this.clientDataLoaded) return;

        this.isLoadingClientData = true;
        console.log('[GuideForm] Cargando datos del cliente...');

        try {
            const profile: ClientProfile = await this.clientService.getProfile();

            console.log('[GuideForm] Datos del cliente obtenidos:', profile);

            // Corregir encoding UTF-8 del nombre
            const fullName = this.fixUtf8Encoding(profile.full_name);

            // Guardar el número de documento para buscar direcciones
            this.clientDocumentNumber = profile.document_number || '';

            // Crear un objeto "selectedSenderClient" virtual para el CLIENT
            // Esto permite que funcione el flujo de carga de direcciones
            this.selectedSenderClient = {
                full_name: fullName,
                document_type: profile.document_type || 'CC',
                document_number: profile.document_number || '',
                phone: profile.phone || '',
                email: profile.email || '',
                total_cities: 0, // No importa para CLIENT
                total_usage: 0   // No importa para CLIENT
            };

            // Autocompletar campos del remitente con datos del cliente
            this.guideForm.patchValue({
                senderName: fullName,
                senderDocType: profile.document_type || 'CC',
                senderDoc: profile.document_number || '',
                senderPhone: profile.phone || '',
                senderEmail: profile.email || ''
            });

            this.guideForm.get('senderName')?.disable();
            this.guideForm.get('senderDocType')?.disable();
            this.guideForm.get('senderDoc')?.disable();
            this.guideForm.get('senderPhone')?.disable();
            this.guideForm.get('senderEmail')?.disable();

            this.clientDataLoaded = true;

            console.log('[GuideForm] Datos del cliente autocargados como remitente');
            console.log('[GuideForm] Document number guardado para historial:', this.clientDocumentNumber);

        } catch (error) {
            console.error('[GuideForm] Error al cargar datos del cliente:', error);
        } finally {
            this.isLoadingClientData = false;
        }
    }

    // ==========================================
    // FORM INITIALIZATION
    // ==========================================
    private initializeForm(): FormGroup {
        return this.fb.group({
            // Remitente
            senderName: ['', Validators.required],
            senderDocType: ['CC', Validators.required],
            senderDoc: ['', Validators.required],
            senderPhone: ['', Validators.required],
            senderEmail: ['', Validators.email],
            senderAddress: ['', Validators.required],
            senderCity: ['', Validators.required],
            senderCityName: [''],

            // Destinatario
            receiverName: ['', Validators.required],
            receiverDocType: ['CC', Validators.required],
            receiverDoc: ['', Validators.required],
            receiverPhone: ['', Validators.required],
            receiverEmail: ['', Validators.email],
            receiverAddress: ['', Validators.required],
            receiverCity: ['', Validators.required],
            receiverCityName: [''],

            // Paquete
            serviceType: ['Contado', Validators.required],
            weight: ['', [Validators.required, Validators.min(0.1)]],
            declaredValue: ['', [Validators.required, Validators.min(0)]],
            pieces: [1, [Validators.required, Validators.min(1)]],
            dimensions: ['20x15x10'],
            priority: ['normal'],
            insurance: ['no'],
            content: [''],
            observations: ['']
        });
    }

    // ==========================================
    // AUTOCOMPLETADO REMITENTE
    // ==========================================
    private setupSenderAutocomplete(): void {
        if (!this.enableAutocomplete) return;

        this.senderSearchControl.valueChanges
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                switchMap(term => {
                    if (!term || term.length < 2) {
                        this.senderClientSuggestions = [];
                        return [];
                    }
                    this.isLoadingSenderSuggestions = true;
                    return this.frequentPartyService.searchByName(term, 'SENDER');
                }),
                takeUntil(this.destroy$)
            )
            .subscribe(clients => {
                this.isLoadingSenderSuggestions = false;
                this.senderClientSuggestions = clients;
                this.showSenderSuggestions = clients.length > 0;
            });
    }

    onSenderCitySelected(city: City): void {
        console.log('[GuideForm] Ciudad remitente seleccionada:', city);
        console.log('[GuideForm] Debug Estado:');
        console.log('  - userRole:', this.userRole);
        console.log('  - enableAddressHistory:', this.enableAddressHistory);
        console.log('  - selectedSenderClient:', this.selectedSenderClient);
        
        this.selectedSenderCity = city;
        this.guideForm.patchValue({
            senderCity: city.id,
            senderCityName: city.name
        });

        if (this.enableAddressHistory && this.selectedSenderClient) {
            console.log('[GuideForm] Cargando direcciones del remitente...');
            this.loadSenderAddresses(this.selectedSenderClient.document_number, city.id);
        } else {
            console.log('[GuideForm] ℹNo cargando direcciones. Razones:', {
                enableAddressHistory: this.enableAddressHistory,
                hasSelectedClient: !!this.selectedSenderClient
            });
        }
    }


    private loadSenderAddresses(documentNumber: string, cityId: number): void {
        if (!this.enableAddressHistory) {
            console.log('[GuideForm] Historial de direcciones deshabilitado');
            return;
        }

        console.log('[GuideForm] loadSenderAddresses iniciado');
        console.log('  - userRole:', this.userRole);
        console.log('  - documentNumber:', documentNumber);
        console.log('  - cityId:', cityId);

        this.isLoadingSenderAddresses = true;
        
        this.frequentPartyService.getByDocumentAndCity(documentNumber, cityId, 'SENDER')
            .subscribe({
                next: (addresses) => {
                    this.senderAddresses = addresses;
                    this.isLoadingSenderAddresses = false;

                    console.log(`[GuideForm] Direcciones de remitente cargadas: ${addresses.length}`);

                    if (addresses.length > 0) {
                        console.log('[GuideForm] Direcciones encontradas:', addresses);
                        console.log('[GuideForm] Auto-seleccionando primera dirección (más usada)');
                        this.selectSenderAddress(addresses[0]);
                    } else {
                        console.log('[GuideForm] No hay direcciones guardadas en esta ciudad');
                    }
                },
                error: (error) => {
                    console.error('[GuideForm] Error al cargar direcciones:', error);
                    this.isLoadingSenderAddresses = false;
                    this.senderAddresses = [];
                }
            });
    }

    onSenderFocus(): void {
        if (this.enableAutocomplete && this.senderClientSuggestions.length > 0) {
            this.showSenderSuggestions = true;
        }
    }

    onSenderBlur(): void {
        setTimeout(() => {
            this.showSenderSuggestions = false;
        }, 200);
    }

    // ==========================================
    // AUTOCOMPLETADO DESTINATARIO
    // ==========================================
    private setupReceiverAutocomplete(): void {
        if (!this.enableAutocomplete) return;

        this.receiverSearchControl.valueChanges
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                switchMap(term => {
                    if (!term || term.length < 2) {
                        this.receiverClientSuggestions = [];
                        return [];
                    }
                    this.isLoadingReceiverSuggestions = true;
                    return this.frequentPartyService.searchByName(term, 'RECEIVER');
                }),
                takeUntil(this.destroy$)
            )
            .subscribe(clients => {
                this.isLoadingReceiverSuggestions = false;
                this.receiverClientSuggestions = clients;
                this.showReceiverSuggestions = clients.length > 0;
            });
    }

    onReceiverClientSelected(client: FrequentPartyUnique): void {
        if (!this.enableAutocomplete) return;

        console.log('[GuideForm] Cliente destinatario seleccionado:', client);
        
        this.selectedReceiverClient = client;
        this.receiverSearchControl.setValue(client.full_name, { emitEvent: false });
        this.showReceiverSuggestions = false;

        this.guideForm.patchValue({
            receiverName: client.full_name,
            receiverDocType: client.document_type || 'CC',
            receiverDoc: client.document_number || '',
            receiverPhone: client.phone || '',
            receiverEmail: client.email || ''
        });

        this.receiverAddresses = [];
        this.guideForm.patchValue({ receiverAddress: '' });

        if (this.selectedReceiverCity) {
            this.loadReceiverAddresses(client.document_number, this.selectedReceiverCity.id);
        }
    }


    selectSenderAddress(address: FrequentParty): void {
        if (!this.enableAddressHistory) return;
        
        console.log('[GuideForm] Dirección seleccionada:', address.address);
        this.guideForm.patchValue({ senderAddress: address.address });
    }

    onReceiverFocus(): void {
        if (this.enableAutocomplete && this.receiverClientSuggestions.length > 0) {
            this.showReceiverSuggestions = true;
        }
    }

    onReceiverBlur(): void {
        setTimeout(() => {
            this.showReceiverSuggestions = false;
        }, 200);
    }

    onReceiverCitySelected(city: City): void {
        console.log('[GuideForm] Ciudad destinatario seleccionada:', city);
        
        this.selectedReceiverCity = city;
        this.guideForm.patchValue({
            receiverCity: city.id,
            receiverCityName: city.name
        });

        if (this.enableAddressHistory && this.selectedReceiverClient) {
            this.loadReceiverAddresses(this.selectedReceiverClient.document_number, city.id);
        }
    }

    private loadReceiverAddresses(documentNumber: string, cityId: number): void {
        
        if (!this.enableAddressHistory) return;

        this.isLoadingReceiverAddresses = true;
        
        this.frequentPartyService.getByDocumentAndCity(documentNumber, cityId, 'RECEIVER')
            .subscribe({
                next: (addresses) => {
                    this.receiverAddresses = addresses;
                    this.isLoadingReceiverAddresses = false;

                    console.log(`[GuideForm] Direcciones de destinatario cargadas: ${addresses.length}`);

                    if (addresses.length > 0) {
                        this.selectReceiverAddress(addresses[0]);
                    }
                },
                error: (error) => {
                    console.error('[GuideForm] Error al cargar direcciones:', error);
                    this.isLoadingReceiverAddresses = false;
                    this.receiverAddresses = [];
                }
            });
    }

    selectReceiverAddress(address: FrequentParty): void {
        // CAMBIO: Verificar enableAddressHistory
        if (!this.enableAddressHistory) return;
        this.guideForm.patchValue({ receiverAddress: address.address });
    }
    
    onSenderClientSelected(client: FrequentPartyUnique): void {
        if (!this.enableAutocomplete) return;

        console.log('[GuideForm] Cliente remitente seleccionado:', client);
        console.log('[GuideForm] document_number:', client.document_number);
        
        this.selectedSenderClient = client;
        this.senderSearchControl.setValue(client.full_name, { emitEvent: false });
        this.showSenderSuggestions = false;

        // Autocompletar campos del formulario
        this.guideForm.patchValue({
            senderName: client.full_name,
            senderDocType: client.document_type || 'CC',
            senderDoc: client.document_number || '',
            senderPhone: client.phone || '',
            senderEmail: client.email || ''
        });

        // Limpiar direcciones previas
        this.senderAddresses = [];
        this.guideForm.patchValue({ senderAddress: '' });

        // Si ya hay ciudad seleccionada, cargar direcciones inmediatamente
        if (this.selectedSenderCity) {
            console.log('[GuideForm] Ciudad ya seleccionada, cargando direcciones...');
            this.loadSenderAddresses(client.document_number, this.selectedSenderCity.id);
        } else {
            console.log('[GuideForm] Esperando selección de ciudad...');
        }
    }


    // ==========================================
    // FORM SUBMISSION
    // ==========================================
    onSubmit(): void {
        if (!this.guideForm.valid) {
            this.markFormGroupTouched(this.guideForm);
            return;
        }

        this.registerFrequentParties();

        // Para CLIENT: incluir campos disabled en el valor del formulario
        // getRawValue() obtiene todos los valores incluyendo campos disabled
        const formValue = this.isClientReadonly
            ? this.guideForm.getRawValue()
            : this.guideForm.value;

        this.formSubmit.emit(formValue);
    }

    private registerFrequentParties(): void {
        // getRawValue() para incluir campos disabled de CLIENT
        const formValue = this.isClientReadonly 
            ? this.guideForm.getRawValue()
            : this.guideForm.value;

        // Registrar remitente
        const senderRequest: CreateFrequentPartyRequest = {
            party_type: 'SENDER',
            full_name: formValue.senderName,
            document_type: formValue.senderDocType,
            document_number: formValue.senderDoc,
            phone: formValue.senderPhone,
            email: formValue.senderEmail || '',
            city_id: formValue.senderCity,
            address: formValue.senderAddress
        };

        this.frequentPartyService.upsertFrequentParty(senderRequest).subscribe({
            next: () => console.log('[GuideForm] Remitente registrado en frequent_parties'),
            error: (err) => console.warn('[GuideForm] Error registrando remitente:', err)
        });

        // Registrar destinatario
        const receiverRequest: CreateFrequentPartyRequest = {
            party_type: 'RECEIVER',
            full_name: formValue.receiverName,
            document_type: formValue.receiverDocType,
            document_number: formValue.receiverDoc,
            phone: formValue.receiverPhone,
            email: formValue.receiverEmail || '',
            city_id: formValue.receiverCity,
            address: formValue.receiverAddress
        };

        this.frequentPartyService.upsertFrequentParty(receiverRequest).subscribe({
            next: () => console.log('[GuideForm] Destinatario registrado en frequent_parties'),
            error: (err) => console.warn('[GuideForm] Error registrando destinatario:', err)
        });
    }

    // ==========================================
    // HELPERS
    // ==========================================
    resetForm(): void {
        this.guideForm.reset(this.getDefaultFormValues());
        this.selectedSenderClient = null;
        this.selectedReceiverClient = null;
        this.selectedSenderCity = null;
        this.selectedReceiverCity = null;
        this.senderAddresses = [];
        this.receiverAddresses = [];
        this.senderSearchControl.setValue('', { emitEvent: false });
        this.receiverSearchControl.setValue('', { emitEvent: false });
        this.clientDataLoaded = false;

        // Recargar datos del cliente si es CLIENT
        if (this.userRole === 'CLIENT') {
            this.loadClientDataAsSender();
        }
    }

    hasError(fieldName: string): boolean {
        const field = this.guideForm.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    getErrorMessage(fieldName: string): string {
        const field = this.guideForm.get(fieldName);

        if (field?.hasError('required')) return 'Este campo es requerido';
        if (field?.hasError('email')) return 'Ingrese un email válido';
        if (field?.hasError('min')) return 'El valor debe ser mayor a 0';

        return '';
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();

            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }

    private getDefaultFormValues(): Partial<Record<string, string | number>> {
        return {
            senderDocType: 'CC',
            receiverDocType: 'CC',
            serviceType: 'Contado',
            pieces: 1,
            dimensions: '20x15x10',
            priority: 'normal',
            insurance: 'no',
            senderCityName: '',
            receiverCityName: ''
        };
    }

    setSubmitting(value: boolean): void {
        this.isSubmitting = value;
    }

    formatClientDisplay(client: FrequentPartyUnique): string {
        return this.frequentPartyService.formatClientDisplay(client);
    }

    formatAddressDisplay(address: FrequentParty): string {
        return this.frequentPartyService.formatAddressDisplay(address);
    }

    /**
     * Corrige problemas de doble codificación UTF-8
     * Ejemplo: "GermÃ¡n" -> "Germán"
     */
    private fixUtf8Encoding(text: string): string {
        if (!text) return text;
        try {
            // Detectar si tiene caracteres de doble encoding (ej: Ã¡, Ã©, Ã­, Ã³, Ãº, Ã±)
            if (/Ã[\x80-\xBF]/.test(text)) {
                // Convertir string a bytes Latin-1 y luego interpretar como UTF-8
                const bytes = new Uint8Array([...text].map(c => c.charCodeAt(0)));
                return new TextDecoder('utf-8').decode(bytes);
            }
            return text;
        } catch {
            return text;
        }
    }
}