import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';

import { ProviderRegistrationApi } from '../registration/provider-registration-api';
import { ProviderRegistration } from './registro-proveedor';

const documentTypes = [
  {
    id: '1',
    name: 'Identificación oficial',
    description: 'Documento vigente.',
    requires_expiration_date: true,
    supplier_type: 'ambos' as const,
    mandatory: true,
  },
];

describe('ProviderRegistration', () => {
  let fixture: ComponentFixture<ProviderRegistration>;
  let component: ProviderRegistration;

  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ProviderRegistration],
      providers: [
        provideRouter([]),
        {
          provide: ProviderRegistrationApi,
          useValue: {
            getDocumentTypes: () => of({ data: documentTypes }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderRegistration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('moves through the wizard when manager and business data are valid', () => {
    component.startRegistration();
    component.manager = {
      name: 'María',
      lastnameP: 'López',
      lastnameM: '',
      phone: '5512345678',
      email: 'maria@example.com',
      password: 'clave-segura',
      passwordConfirmation: 'clave-segura',
    };

    component.continue();

    expect(component.currentStep).toBe(3);

    component.business = {
      name: 'Plomería López',
      phone: '5512345678',
      email: 'contacto@plomerialopez.com',
      supplierType: 'empresa',
    };
    component.continue();

    expect(component.currentStep).toBe(4);
    expect(component.documents).toHaveLength(1);
  });

  it('marks a valid document as ready for submission', () => {
    component.business.supplierType = 'independiente';
    component.retryDocumentTypes();
    const document = component.documents[0];
    const file = new File(['documento'], 'identificacion.pdf', { type: 'application/pdf' });
    const input = { files: { item: () => file }, value: '' } as unknown as HTMLInputElement;

    component.onDocumentSelected(document, { target: input } as unknown as Event);

    expect(document.status).toBe('ready');
    expect(document.fileName).toBe('identificacion.pdf');
  });

  it('renders documents after an asynchronous response without manual change detection', async () => {
    const response = new Subject<{ data: typeof documentTypes }>();
    const api = TestBed.inject(ProviderRegistrationApi);
    vi.spyOn(api, 'getDocumentTypes').mockReturnValue(response);
    component.business.supplierType = 'independiente';
    component.currentStep = 4;
    component.retryDocumentTypes();
    fixture.detectChanges();

    response.next({ data: documentTypes });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Identificación oficial');
    expect(fixture.nativeElement.textContent).not.toContain('Cargando documentos');
  });

  it('renders an asynchronous error and allows retrying', async () => {
    const response = new Subject<{ data: typeof documentTypes }>();
    const api = TestBed.inject(ProviderRegistrationApi);
    const request = vi.spyOn(api, 'getDocumentTypes').mockReturnValue(response);
    component.business.supplierType = 'empresa';
    component.currentStep = 4;
    component.retryDocumentTypes();
    fixture.detectChanges();
    response.error(new Error('Sin conexión'));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Reintentar');
    expect(component.documentsLoading).toBe(false);
    request.mockReturnValue(of({ data: documentTypes }));
    component.retryDocumentTypes();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Identificación oficial');
  });

  it('rejects a file that is not an allowed document format', () => {
    component.business.supplierType = 'empresa';
    component.retryDocumentTypes();
    const document = component.documents[0];
    const file = new File(['texto'], 'notas.txt', { type: 'text/plain' });
    const input = { files: { item: () => file }, value: '' } as unknown as HTMLInputElement;

    component.onDocumentSelected(document, { target: input } as unknown as Event);

    expect(document.status).toBe('error');
    expect(document.error).toContain('PDF');
  });

  it('shows errors and stays on the manager step when data is incomplete', () => {
    component.startRegistration();
    component.continue();

    expect(component.currentStep).toBe(2);
    expect(component.errors['managerEmail']).toContain('correo electrónico');
    expect(component.errors['managerPassword']).toContain('8 caracteres');
  });

  it('persists non-sensitive fields but never stores the password', () => {
    component.startRegistration();
    component.manager = {
      name: 'María',
      lastnameP: 'López',
      lastnameM: '',
      phone: '5512345678',
      email: 'maria@example.com',
      password: 'clave-segura',
      passwordConfirmation: 'clave-segura',
    };
    component.saveDraft();

    const saved = JSON.parse(
      sessionStorage.getItem('fixora-provider-registration-draft-v1') ?? '{}',
    ) as { manager?: { password?: string; passwordConfirmation?: string; email?: string } };

    expect(saved.manager?.email).toBe('maria@example.com');
    expect(saved.manager?.password).toBeUndefined();
    expect(saved.manager?.passwordConfirmation).toBeUndefined();
  });
});
