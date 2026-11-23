import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsersApi } from './users-api';
describe('UsersApi', () => {
  it('conserva IDs grandes como cadenas y no supone nombres de roles', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(UsersApi)
      .list()
      .subscribe((rows) =>
        expect(rows).toEqual([
          {
            id: '9007199254740993',
            email: 'cuenta@example.com',
            roleId: '27',
            state: 'suspendido',
          },
        ]),
      );
    const request = http.expectOne('/api/users');
    expect(request.request.method).toBe('GET');
    request.flush({
      data: [
        {
          UniqueID: '9007199254740993',
          email: 'cuenta@example.com',
          role_id: '27',
          state: 'suspendido',
        },
      ],
    });
    http.verify();
  });
});
