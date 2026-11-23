import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { StaffApi } from '../../admin/staff-api';
import { StaffCreate } from './staff-create';

describe('Alta de personal', () => {
  const api = { create: vi.fn() };
  beforeEach(() => {
    api.create
      .mockReset()
      .mockReturnValue(of({ data: { email: 'soporte@example.com', role: 'soporte' } }));
    TestBed.configureTestingModule({
      imports: [StaffCreate],
      providers: [provideRouter([]), { provide: StaffApi, useValue: api }],
    });
  });
  function validPage() {
    const page = TestBed.createComponent(StaffCreate).componentInstance;
    page.draft = {
      name: 'Ana',
      lastname_p: 'López',
      email: ' Soporte@example.com ',
      password: 'contraseña-segura',
      role: 'soporte',
      phone: '',
    };
    page.confirmation = page.draft.password;
    return page;
  }
  it('normaliza datos, omite opcionales vacíos y borra la contraseña después del alta', () => {
    const page = validPage();
    page.submit();
    expect(api.create).toHaveBeenCalledWith({
      name: 'Ana',
      lastname_p: 'López',
      email: 'soporte@example.com',
      password: 'contraseña-segura',
      role: 'soporte',
    });
    expect(page.draft.password).toBe('');
    expect(page.confirmation).toBe('');
  });
  it('rechaza contraseñas de más de 72 bytes aunque tengan menos caracteres', () => {
    const page = validPage();
    page.draft.password = 'á'.repeat(40);
    page.confirmation = page.draft.password;
    page.submit();
    expect(api.create).not.toHaveBeenCalled();
    expect(page.error()).toContain('72 bytes');
  });
  it('bloquea el formulario si el servidor deniega el permiso de administrador principal', () => {
    const page = validPage();
    api.create.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403, error: { message: 'Sin permiso' } })),
    );
    page.submit();
    page.submit();
    expect(api.create).toHaveBeenCalledTimes(1);
    expect(page.forbidden()).toBe(true);
  });
});
