import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../app.routes';
import { sessionInterceptor } from './session.interceptor';
import { SessionService } from './session.service';

describe('sessionInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let session: SessionService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([sessionInterceptor])),
        provideHttpClientTesting(),
        provideRouter(routes),
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
    session.save({ accessToken: 'old-access', refreshToken: 'old-refresh', role: 'cliente' });
  });

  afterEach(() => http.verify());

  it('only sends Bearer to protected API requests', () => {
    client.get('/api/me').subscribe();
    const protectedRequest = http.expectOne('/api/me');
    expect(protectedRequest.request.headers.get('Authorization')).toBe('Bearer old-access');
    protectedRequest.flush({});
    client.post('/api/auth/login', {}).subscribe();
    const login = http.expectOne('/api/auth/login');
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush({});
    client.get('https://example.org/data').subscribe();
    const external = http.expectOne('https://example.org/data');
    expect(external.request.headers.has('Authorization')).toBe(false);
    external.flush({});
  });

  it('shares one token rotation across simultaneous 401 responses and retries both requests', () => {
    const results: unknown[] = [];
    client.get('/api/me').subscribe((value) => results.push(value));
    client.get('/api/users').subscribe((value) => results.push(value));
    const original = http.match((request) => ['/api/me', '/api/users'].includes(request.url));
    expect(original.length).toBe(2);
    for (const request of original) request.flush({}, { status: 401, statusText: 'Unauthorized' });

    const refresh = http.expectOne('/api/auth/refresh');
    expect(refresh.request.body).toEqual({ refreshToken: 'old-refresh' });
    refresh.flush({ tokens: { accessToken: 'new-access', refreshToken: 'new-refresh' } });

    const retried = http.match((request) => ['/api/me', '/api/users'].includes(request.url));
    expect(retried.length).toBe(2);
    for (const request of retried) {
      expect(request.request.headers.get('Authorization')).toBe('Bearer new-access');
      request.flush({ ok: true });
    }
    expect(results).toHaveLength(2);
    expect(session.current()?.refreshToken).toBe('new-refresh');
  });

  it('does not refresh on 403', () => {
    client.get('/api/me').subscribe({ error: () => undefined });
    http.expectOne('/api/me').flush({}, { status: 403, statusText: 'Forbidden' });
    http.expectNone('/api/auth/refresh');
    expect(session.current()?.accessToken).toBe('old-access');
  });

  it('clears the session when the refresh token is rejected', () => {
    client.get('/api/me').subscribe({ error: () => undefined });
    http.expectOne('/api/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('/api/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.current()).toBeNull();
  });
});
