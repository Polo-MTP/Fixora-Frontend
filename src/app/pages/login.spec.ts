import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthApi } from '../auth/auth-api';
import { Login } from './login';

describe('Login', () => {
    const authMock = {
        login: vi.fn(),
    };

    let component: Login;
    let fixture: ComponentFixture<Login>;
    let router: Router;
    let returnUrl: string | null;

    beforeEach(async () => {
        authMock.login.mockReset();
        returnUrl = null;

        await TestBed.configureTestingModule({
            imports: [Login],
            providers: [
                provideRouter([]),
                { provide: AuthApi, useValue: authMock },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            queryParamMap: {
                                get: (key: string) => (key === 'returnUrl' ? returnUrl : null),
                            },
                        },
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(Login);
        component = fixture.componentInstance;
        fixture.detectChanges();

        router = TestBed.inject(Router);
        vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    });

    it('redirige al panel de administración después de iniciar sesión', () => {
        authMock.login.mockReturnValue(
            of({
                user: {
                    id: '10',
                    email: 'admin@fixora.test',
                    role: 'administrador',
                    status: 'ACTIVO',
                },
                tokens: {
                    accessToken: 'access-token',
                    refreshToken: 'refresh-token',
                },
            }),
        );

        component.email = 'admin@fixora.test';
        component.password = 'clave-valida';
        component.submit();

        expect(router.navigateByUrl).toHaveBeenCalledWith('/administrador');
    });

    it('redirige al dashboard de administración si returnUrl es /inicio', () => {
        returnUrl = '/inicio';

        authMock.login.mockReturnValue(
            of({
                user: {
                    id: '10',
                    email: 'admin@fixora.test',
                    role: 'administrador',
                    status: 'ACTIVO',
                },
                tokens: {
                    accessToken: 'access-token',
                    refreshToken: 'refresh-token',
                },
            }),
        );

        component.email = 'admin@fixora.test';
        component.password = 'clave-valida';
        component.submit();

        expect(router.navigateByUrl).toHaveBeenCalledWith('/administrador');
    });

    it('redirige a soporte después de iniciar sesión', () => {
        authMock.login.mockReturnValue(
            of({
                user: {
                    id: '11',
                    email: 'soporte@fixora.test',
                    role: 'soporte',
                    status: 'ACTIVO',
                },
                tokens: {
                    accessToken: 'support-access',
                    refreshToken: 'support-refresh',
                },
            }),
        );

        component.email = 'soporte@fixora.test';
        component.password = 'clave-valida';
        component.submit();

        expect(router.navigateByUrl).toHaveBeenCalledWith('/soporte');
    });

    it('conserva un returnUrl que corresponde al rol autenticado', () => {
        returnUrl = '/soporte';

        authMock.login.mockReturnValue(
            of({
                user: {
                    id: '11',
                    email: 'soporte@fixora.test',
                    role: 'soporte',
                    status: 'ACTIVO',
                },
                tokens: {
                    accessToken: 'support-access',
                    refreshToken: 'support-refresh',
                },
            }),
        );

        component.email = 'soporte@fixora.test';
        component.password = 'clave-valida';
        component.submit();

        expect(router.navigateByUrl).toHaveBeenCalledWith('/soporte');
    });

    it('conserva la sesión y envía al estado provisional a un proveedor pendiente', () => {
        authMock.login.mockReturnValue(
            of({
                user: {
                    id: '12',
                    email: 'proveedor@fixora.test',
                    role: 'proveedor',
                    status: 'POR_APROBAR',
                },
                tokens: {
                    accessToken: 'supplier-limited-access',
                    refreshToken: 'supplier-limited-refresh',
                },
            }),
        );

        component.email = 'proveedor@fixora.test';
        component.password = 'clave-valida';
        component.submit();

        expect(router.navigateByUrl).toHaveBeenCalledWith('/estado-solicitud');
        expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    });

    it('redirige a la ruta de proveedor para una cuenta activa', () => {
        authMock.login.mockReturnValue(
            of({
                user: {
                    id: '13',
                    email: 'proveedor.activo@fixora.test',
                    role: 'proveedor',
                    status: 'ACTIVO',
                },
                tokens: {
                    accessToken: 'active-supplier-access',
                    refreshToken: 'active-supplier-refresh',
                },
            }),
        );

        component.email = 'proveedor.activo@fixora.test';
        component.password = 'clave-valida';
        component.submit();

        expect(router.navigateByUrl).toHaveBeenCalledWith('/proveedor');
    });

    it('guarda el challengeId del tercer factor y no redirige', () => {
        authMock.login.mockReturnValue(
            of({
                nextStep: 'third-factor',
                challengeId: 'challenge-123',
            }),
        );

        component.email = 'admin@fixora.test';
        component.password = 'clave-valida';
        component.submit();

        expect(component.thirdFactorPending()).toBe(true);
        expect(component.thirdFactorChallengeId()).toBe('challenge-123');
        expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('muestra el error devuelto por la API en la vista', async () => {
        authMock.login.mockReturnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 401,
                        statusText: 'Unauthorized',
                        error: {
                            error: 'INVALID_CREDENTIALS',
                            message: 'Correo o contraseña incorrectos.',
                        },
                    }),
            ),
        );

        component.email = 'persona@fixora.test';
        component.password = 'incorrecta';
        component.submit();

        await fixture.whenStable();

        const alert = fixture.nativeElement.querySelector('[role="alert"]');

        expect(alert?.textContent).toContain('Correo o contraseña incorrectos.');
        expect(component.errorMessage()).toBe('Correo o contraseña incorrectos.');
        expect(component.loading()).toBe(false);
    });
});