import { provideHttpClient } from '@angular/common/http';
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthApi } from './auth-api';
import { SessionService } from './session.service';

describe('AuthApi.login', () => {
    let api: AuthApi;
    let http: HttpTestingController;
    let session: SessionService;

    beforeEach(() => {
        sessionStorage.clear();

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        });

        api = TestBed.inject(AuthApi);
        http = TestBed.inject(HttpTestingController);
        session = TestBed.inject(SessionService);
    });

    afterEach(() => {
        http.verify();
    });

    it('envía las credenciales y guarda la sesión de una cuenta activa', () => {
        api.login('admin@fixora.test', 'clave-valida').subscribe();

        const request = http.expectOne('/api/auth/login');

        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({
            email: 'admin@fixora.test',
            password: 'clave-valida',
        });

        request.flush({
            message: 'Inicio de sesión exitoso.',
            user: {
                id: '10',
                email: 'admin@fixora.test',
                role: 'administrador',
                status: 'activo',
            },
            tokens: {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            },
        });

        expect(session.current()).toEqual({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            role: 'administrador',
        });
    });

    it('no crea una sesión cuando la API pide el tercer factor', () => {
        let result: unknown;

        api.login('admin@fixora.test', 'clave-valida').subscribe((value) => {
            result = value;
        });

        http.expectOne('/api/auth/login').flush({
            nextStep: 'third-factor',
            challengeId: 'challenge-123',
        });

        expect(result).toEqual({
            nextStep: 'third-factor',
            challengeId: 'challenge-123',
        });
        expect(session.current()).toBeNull();
    });
});