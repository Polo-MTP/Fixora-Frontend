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

    // El paso de empleados es opcional.
    component.continue();

    expect(component.currentStep).toBe(6);
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
    component.currentStep = 6;
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
    component.currentStep = 6;
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

  it('mantiene los empleados y su rol separados por sucursal', () => {
    component.business.supplierType = 'empresa';
    component.addBranch();

    const [firstBranch, secondBranch] = component.branches;

    component.addEmployee(firstBranch);
    component.addEmployee(secondBranch);

    const [firstEmployee] = component.staffFor(firstBranch).employees;
    const [secondEmployee] = component.staffFor(secondBranch).employees;

    firstEmployee.email = 'gerencia@example.test';
    firstEmployee.role = 'gerente';

    secondEmployee.email = 'empleado@example.test';
    secondEmployee.role = 'empleado';

    expect(component.staffFor(firstBranch).employees).toEqual([firstEmployee]);
    expect(component.staffFor(secondBranch).employees).toEqual([secondEmployee]);

    component.removeEmployee(firstBranch, 0);

    expect(component.staffFor(firstBranch).employees).toHaveLength(0);
    expect(component.staffFor(secondBranch).employees[0]).toBe(secondEmployee);
  });

  it('impide avanzar si dos empleados usan el mismo correo', () => {
    component.currentStep = 5;
    component.business.supplierType = 'empresa';
    component.manager.email = 'proveedor@example.test';
    component.addBranch();

    const [firstBranch, secondBranch] = component.branches;

    component.addEmployee(firstBranch);
    component.addEmployee(secondBranch);

    Object.assign(component.staffFor(firstBranch).employees[0], {
      name: 'Ana',
      lastname_p: 'López',
      email: 'personal@example.test',
      password: 'ClaveDePrueba1!',
      role: 'gerente',
    });

    Object.assign(component.staffFor(secondBranch).employees[0], {
      name: 'Luis',
      lastname_p: 'García',
      email: ' PERSONAL@example.test ',
      password: 'ClaveDePrueba2!',
      role: 'empleado',
    });

    component.continue();

    expect(component.currentStep).toBe(5);
    expect(component.employeeErrors.join(' ')).toMatch(/correo distinto/i);
  });

  it('mantiene deshabilitada la autoasignación del proveedor como gerente', async () => {
    component.currentStep = 5;
    fixture.detectChanges();
    await fixture.whenStable();

    const checkbox = fixture.nativeElement.querySelector(
      'input[name="owner-manager-0"]',
    ) as HTMLInputElement | null;

    expect(checkbox?.disabled).toBe(true);
  });
});
