import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';

import { SessionService } from './session.service';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginUser {
  id: string;
  email: string;
  role: string;
  status: string;
}

export type LoginResult =
  {
    user: LoginUser;
    tokens: Tokens;
  }
  | {
    nextStep: 'third-factor';
    challengeId: string;
  };

interface MeResponse {
  data: { user: { role: string } };
}

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private refreshRequest: Observable<Tokens> | null = null;

  login(email: string, password: string): Observable<LoginResult> {
    return this.http.post<LoginResult>('/api/auth/login', { email, password }).pipe(
      tap((result) => {
        // Un desafío adicional aún no es una sesión autenticada.
        if ('tokens' in result) {
          this.session.save({
            ...result.tokens,
            role: result.user.role,
          });
        }
      }),
    );
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>('/api/me').pipe(
      tap(({ data }) => {
        const current = this.session.current();
        if (current) this.session.save({ ...current, role: data.user.role });
      }),
    );
  }

  refresh(): Observable<Tokens> {
    if (this.refreshRequest) return this.refreshRequest;
    const refreshToken = this.session.current()?.refreshToken;
    if (!refreshToken) return throwError(() => new Error('No hay sesión para renovar.'));

    this.refreshRequest = this.http
      .post<{ tokens: Tokens }>('/api/auth/refresh', { refreshToken })
      .pipe(
        map(({ tokens }) => tokens),
        tap((tokens) => {
          const current = this.session.current();
          if (current) this.session.save({ ...current, ...tokens });
        }),
        // El API rota el refresh token: las solicitudes simultáneas comparten esta respuesta.
        finalize(() => {
          this.refreshRequest = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.refreshRequest;
  }

  logout(): Observable<unknown> {
    const refreshToken = this.session.current()?.refreshToken;
    if (!refreshToken) {
      this.session.clear();
      return of(null);
    }
    return this.http
      .post('/api/auth/logout', { refreshToken })
      .pipe(finalize(() => this.session.clear()));
  }
}
