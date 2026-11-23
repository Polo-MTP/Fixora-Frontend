import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthApi } from './auth-api';
import { SessionService } from './session.service';

export const sessionInterceptor: HttpInterceptorFn = (request, next) => {
  // Las credenciales solo se envían a nuestra API; login, refresh y logout son públicos.
  if (!request.url.startsWith('/api/') || request.url.startsWith('/api/auth/'))
    return next(request);

  const session = inject(SessionService);
  const auth = inject(AuthApi);
  const router = inject(Router);
  const token = session.current()?.accessToken;
  if (!token) return next(request);

  const withToken = (accessToken: string) =>
    request.clone({
      setHeaders: { Authorization: `Bearer ${accessToken}` },
    });
  const expire = () => {
    session.clear();
    void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
  };

  return next(withToken(token)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        catchError((refreshError: unknown) => {
          if (
            refreshError instanceof HttpErrorResponse &&
            [400, 401, 403].includes(refreshError.status)
          ) {
            expire();
          }
          return throwError(() => refreshError);
        }),
        switchMap(({ accessToken }) =>
          next(withToken(accessToken)).pipe(
            catchError((retryError: unknown) => {
              if (retryError instanceof HttpErrorResponse && retryError.status === 401) expire();
              return throwError(() => retryError);
            }),
          ),
        ),
      );
    }),
  );
};
