import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApplicationStatusApi } from './application-status-api';

describe('ApplicationStatusApi', () => {
  it('reenvía solo el archivo y la vigencia al endpoint de la solicitud propia', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const file = new File(['pdf'], 'documento.pdf', { type: 'application/pdf' });
    TestBed.inject(ApplicationStatusApi).replaceDocument('12', file, '2099-01-01').subscribe();
    const request = http.expectOne('/api/supplier-applications/me/documents/12');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.get('file')).toBe(file);
    expect(request.request.body.get('due_date')).toBe('2099-01-01');
    request.flush({ application_state: 'pendiente', message: 'Recibido' });
    http.verify();
  });
});
