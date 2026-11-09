import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthApi } from './auth-api';
import { SessionService } from './session.service';

function checkSession(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
  const session = inject(SessionService);
  const router = inject(Router);
  const auth = inject(AuthApi);
  const login = () => router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });

  if (!session.current()?.refreshToken) return of(login());

  return auth.me().pipe(
    map(({ data }) => {
      const role = data.user.role;
      const allowedRoles = route.data['roles'] as readonly string[] | undefined;
      return !allowedRoles || allowedRoles.includes(role)
        ? true
        : router.createUrlTree(['/sin-permiso']);
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        session.clear();
        return of(login());
      }
      return of(router.createUrlTree(['/error']));
    }),
  );
}

export const authGuard: CanActivateFn = (route, state) => checkSession(route, state);
export const roleGuard: CanActivateFn = (route, state) => checkSession(route, state);
