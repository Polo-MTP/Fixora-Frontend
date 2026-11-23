import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CommissionApi } from './commission-api';
describe('CommissionApi', () => {
  it('envía solo percentage porque el backend rechaza campos adicionales', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(CommissionApi).save('12.50').subscribe();
    const request = http.expectOne('/api/admin/commission-settings');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ percentage: '12.50' });
    request.flush({ data: { percentage: '12.50' } });
    http.verify();
  });
});
