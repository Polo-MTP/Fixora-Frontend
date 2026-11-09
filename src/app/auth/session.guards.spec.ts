import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Observable } from 'rxjs';

import { roleGuard } from './session.guards';
import { SessionService } from './session.service';

describe('roleGuard', () => {
  let http: HttpTestingController;
  let session: SessionService;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
  });

  afterEach(() => http.verify());

  function enter(role: string): { get: () => boolean | UrlTree | undefined } {
    let result: boolean | UrlTree | undefined;
    const route = { data: { roles: [role] } } as unknown as ActivatedRouteSnapshot;
    const state = { url: `/${role}` } as RouterStateSnapshot;
    const guard = TestBed.runInInjectionContext(() => roleGuard(route, state)) as Observable<
      boolean | UrlTree
    >;
    guard.subscribe((value) => {
      result = value;
    });
    return { get: () => result };
  }

  it('sends unauthenticated visitors to login with the destination', () => {
    const result = enter('administrador').get() as UrlTree;
    expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Fadministrador');
  });

  it('uses the current API role to allow or deny access', () => {
    session.save({ accessToken: 'access', refreshToken: 'refresh', role: 'administrador' });
    const denied = enter('administrador');
    http.expectOne('/api/me').flush({ data: { user: { role: 'cliente' } } });
    expect(router.serializeUrl(denied.get() as UrlTree)).toBe('/sin-permiso');
    expect(session.current()?.role).toBe('cliente');

    const allowed = enter('cliente');
    http.expectOne('/api/me').flush({ data: { user: { role: 'cliente' } } });
    expect(allowed.get()).toBe(true);
  });
});
