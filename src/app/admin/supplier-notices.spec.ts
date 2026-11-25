import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SupplierNotificationsApi, type SupplierNotice } from './supplier-notifications-api';
import { SupplierNotices } from './supplier-notices';

const unreadNotice: SupplierNotice = {
  id: '7',
  type: 'nueva_solicitud_proveedor',
  title: 'Nueva solicitud de proveedor',
  message: 'El negocio de prueba registró una solicitud.',
  entity_type: 'supplier_application',
  entity_id: '42',
  read_at: null,
  created_at: '2026-11-24T18:00:00.000Z',
};

describe('SupplierNotices', () => {
  let fixture: ComponentFixture<SupplierNotices>;
  let component: SupplierNotices;

  const api = {
    countUnread: vi.fn(),
    listRecent: vi.fn(),
    markAsRead: vi.fn(),
  };
  const router = { navigate: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    api.countUnread.mockReturnValue(of(1));
    api.listRecent.mockReturnValue(of([unreadNotice]));
    api.markAsRead.mockReturnValue(of({ success: true }));
    router.navigate.mockResolvedValue(true);

    TestBed.configureTestingModule({
      imports: [SupplierNotices],
      providers: [
        { provide: SupplierNotificationsApi, useValue: api },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(SupplierNotices);
    component = fixture.componentInstance;
  });

  it('abre el panel y muestra el contador y el aviso', () => {
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.bell').click();
    fixture.detectChanges();

    expect(component.open()).toBe(true);
    expect(fixture.nativeElement.querySelector('.badge')?.textContent?.trim()).toBe('1');
    expect(fixture.nativeElement.querySelector('.notice')?.textContent).toContain(
      unreadNotice.title,
    );
  });

  it('muestra el estado vacío cuando la cuenta no tiene avisos', () => {
    api.countUnread.mockReturnValue(of(0));
    api.listRecent.mockReturnValue(of([]));

    component.toggle();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.badge')).toBeNull();
    expect(fixture.nativeElement.querySelector('.panel')?.textContent).toContain(
      'Todavía no hay avisos de solicitudes nuevas.',
    );
  });

  it('marca el aviso como leído, actualiza el contador y abre el expediente', async () => {
    component.toggle();
    api.countUnread.mockReturnValue(of(0));

    component.openNotice(unreadNotice);

    expect(api.markAsRead).toHaveBeenCalledWith('7');
    expect(router.navigate).toHaveBeenCalledWith(['/administrador/verificaciones', '42']);
    expect(component.notices()[0]?.read_at).toBeTruthy();
    expect(component.unread()).toBe(0);

    await fixture.whenStable();
    expect(component.openingId()).toBeNull();
  });

  it('conserva el aviso sin leer y permite reintentar si falla el guardado', () => {
    component.toggle();
    api.markAsRead.mockReturnValue(throwError(() => new Error('Sin conexión')));

    component.openNotice(unreadNotice);

    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.notices()[0]?.read_at).toBeNull();
    expect(component.unread()).toBe(1);
    expect(component.openingId()).toBeNull();
    expect(component.actionError()).toContain('No pudimos marcar el aviso como leído');
  });
});

