import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

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
            getCategories: () => of({ data: [{ id: '1', name: 'Plomería' }] }),
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

    // Un local incompleto impide avanzar.
    component.continue();
    expect(component.currentStep).toBe(4);
    expect(component.branchErrors[0].length).toBeGreaterThan(0);

    const branch = component.branches[0];
    branch.name = 'Local Centro';
    branch.address = {
      street: 'Calle de prueba',
      num_ext: '12-B',
      colony: 'Centro',
      municipality: 'Torreón',
      state: 'Coahuila',
      postal_code: '27000',
    };
    branch.location = { latitude: 25.5428, longitude: -103.4068 };
    branch.schedules[1].enabled = true;
    branch.categories = [{ category_id: '1', base_price: 350 }];

    component.continue();

    expect(component.currentStep).toBe(5);
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

  it('permite agregar y quitar locales sin mezclar los datos de una empresa', () => {
    component.business.supplierType = 'empresa';
    component.branches[0].name = 'Local Centro';

    component.addBranch();
    expect(component.branches).toHaveLength(2);

    component.branches[1].name = 'Local Norte';
    component.branches[1].location = { latitude: 25.6, longitude: -103.4 };

    expect(component.branches[0].name).toBe('Local Centro');
    expect(component.branches[0].location).toBeNull();

    component.removeBranch(1);
    expect(component.branches).toHaveLength(1);
    expect(component.branches[0].name).toBe('Local Centro');
  });

  it('mantiene un solo local para un proveedor independiente', () => {
    component.business.supplierType = 'independiente';

    component.addBranch();
    component.removeBranch(0);

    expect(component.branches).toHaveLength(1);
  });
});
