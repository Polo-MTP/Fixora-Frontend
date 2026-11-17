import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ProviderRegistration } from './registro-proveedor';

describe('ProviderRegistration', () => {
  let fixture: ComponentFixture<ProviderRegistration>;
  let component: ProviderRegistration;

  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ProviderRegistration],
      providers: [provideRouter([])],
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

    expect(component.completed).toBe(true);
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
