import { Component, ChangeDetectorRef, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { CommonModule } from "@angular/common";
import { IconComponent } from "@shared/components/icon/icon.component";
import { LoginFormComponent } from "./components/login-form/login-form.component";
import { RegisterFormComponent } from "./components/register-form/register-form.component";
import { ConfirmEmailFormComponent } from "./components/confirm-email-form/confirm-email-form.component";
import { ForgotPasswordFormComponent } from "./components/forgot-password-form/forgot-password-form.component";

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    standalone: true,
    styleUrls: ['./auth.component.scss'],
    imports: [
        CommonModule,
        IconComponent,
        LoginFormComponent,
        RegisterFormComponent,
        ConfirmEmailFormComponent,
        ForgotPasswordFormComponent
    ]
})
export class AuthComponent implements OnInit {
    authTab: 'login' | 'register' | 'confirm' | 'forgot' = 'login';
    emailForLogin = '';
    emailForConfirm = '';
    emailForForgot = '';

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['tab'] === 'register') {
                this.authTab = 'register';
                this.cdr.detectChanges();
            }
        });
    }

    get tabTitle(): string {
        switch (this.authTab) {
            case 'login': return 'Iniciar Sesión';
            case 'register': return 'Crear Cuenta';
            case 'forgot': return 'Recuperar Contraseña';
            case 'confirm': return 'Confirmar Correo';
        }
    }

    get tabSubtitle(): string {
        switch (this.authTab) {
            case 'login': return 'Accede para rastrear tus envíos y gestionar tus paquetes';
            case 'register': return 'Regístrate como cliente para comenzar a enviar paquetes';
            case 'forgot': return 'Sigue los pasos para recuperar el acceso a tu cuenta';
            case 'confirm': return 'Ingresa el código que enviamos a tu correo electrónico';
        }
    }

    onSwitchTab(tab: string): void {
        this.authTab = tab as 'login' | 'register' | 'confirm' | 'forgot';
        this.cdr.detectChanges();
    }

    onEmailForLogin(email: string): void {
        this.emailForLogin = email;
    }

    onEmailForConfirm(email: string): void {
        this.emailForConfirm = email;
    }

    onEmailForForgot(email: string): void {
        this.emailForForgot = email;
    }

    goHome(): void {
        this.router.navigate(['/']);
    }
}
