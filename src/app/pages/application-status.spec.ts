import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApplicationStatus } from './application-status';
import { ApplicationStatusApi } from '../registration/application-status-api';
import { ProviderRegistrationApi } from '../registration/provider-registration-api';
import { SessionService } from '../auth/session.service';
import type { SupplierApplicationDetail } from '../admin/supplier-applications-api';

describe('Estado de solicitud del proveedor', () => {
  const types = ['1', '2', '3', '4', '5'].map((id) => ({
    id,
    name: 'Documento ' + id,
    description: '',
    mandatory: id !== '5',
    requires_expiration_date: id === '2',
    supplier_type: 'ambos' as const,
  }));
  const application = {
    id: '10',
    state: 'documentacion_incompleta',
    supplier_type: 'empresa',
    documents: [
      { id: '11', type_document_id: '1', validation: { result: 'aprobado' } },
      {
        id: '12',
        type_document_id: '2',
        validation: { result: 'rechazado', comment: 'No es legible' },
      },
      { id: '13', type_document_id: '3', validation: null },
    ],
  } as SupplierApplicationDetail;
  const api = { getMine: vi.fn(), replaceDocument: vi.fn() };
  beforeEach(() => {
    sessionStorage.clear();
    api.getMine.mockReset().mockReturnValue(of(application));
    api.replaceDocument
      .mockReset()
      .mockReturnValue(of({ application_state: 'pendiente', message: 'Documento recibido' }));
    TestBed.configureTestingModule({
      imports: [ApplicationStatus],
      providers: [
        provideRouter([]),
        { provide: ApplicationStatusApi, useValue: api },
        {
          provide: ProviderRegistrationApi,
          useValue: { getDocumentTypes: () => of({ data: types }) },
        },
      ],
    });
    TestBed.inject(SessionService).save({ accessToken: 'a', refreshToken: 'r', role: 'proveedor' });
  });

  it('ofrece corregir solo el rechazado y el obligatorio faltante', () => {
    const component = TestBed.createComponent(ApplicationStatus).componentInstance;
    component.ngOnInit();
    expect(component.corrections().map((item) => item.id)).toEqual(['2', '4']);
    expect(component.corrections()[0].comment).toBe('No es legible');
  });
  it('exige la vigencia y vuelve a consultar el estado después del reenvío', () => {
    const component = TestBed.createComponent(ApplicationStatus).componentInstance;
    component.ngOnInit();
    const item = component.corrections()[0];
    item.file = new File(['pdf'], 'ine.pdf', { type: 'application/pdf' });
    component.send(item);
    expect(api.replaceDocument).not.toHaveBeenCalled();
    item.dueDate = '2099-01-01';
    component.send(item);
    expect(api.replaceDocument).toHaveBeenCalledWith('2', item.file, '2099-01-01');
    expect(api.getMine).toHaveBeenCalledTimes(2);
  });
  it('conserva el documento y muestra el fallo si el servidor rechaza el reenvío', () => {
    const component = TestBed.createComponent(ApplicationStatus).componentInstance;
    component.ngOnInit();
    const item = component.corrections()[1];
    item.file = new File(['pdf'], 'rfc.pdf', { type: 'application/pdf' });
    api.replaceDocument.mockReturnValue(throwError(() => new Error('Sin conexión')));
    component.send(item);
    expect(item.file).toBeDefined();
    expect(item.error).toContain('No se pudo');
    expect(component.sending()).toBe('');
  });
});
