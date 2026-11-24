import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SupplierNotificationsApi, type SupplierNotice } from './supplier-notifications-api';

const url = '/api/me/notifications';

function notice(id: string, type = 'nueva_solicitud_proveedor'): SupplierNotice {
  return {
    id,
    type,
    title: 'Nueva solicitud de proveedor',
    message: 'Solicitud recibida.',
    entity_type: 'supplier_application',
    entity_id: '42',
    read_at: null,
    created_at: '2026-11-24T18:00:00.000Z',
  };
}

describe('SupplierNotificationsApi', () => {
  let api: SupplierNotificationsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    api = TestBed.inject(SupplierNotificationsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function expectPage(page: number, unread: boolean) {
    return http.expectOne(
      (request) =>
        request.method === 'GET' &&
        request.url === url &&
        request.params.get('page') === String(page) &&
        request.params.get('limit') === '100' &&
        request.params.get('unread') === String(unread),
    );
  }

  it('cuenta avisos de proveedor sin leer en todas las páginas y evita duplicados', () => {
    const result = vi.fn();
    api.countUnread().subscribe(result);

    expectPage(1, true).flush({
      data: [notice('3'), notice('2', 'nuevo_reporte')],
      unread_count: 10,
      pagination: { page: 1, total_pages: 2 },
    });

    expect(result).not.toHaveBeenCalled();

    expectPage(2, true).flush({
      data: [notice('3'), notice('1')],
      unread_count: 10,
      pagination: { page: 2, total_pages: 2 },
    });

    expect(result).toHaveBeenCalledExactlyOnceWith(2);
  });

  it('lista avisos recientes de proveedor e incluye los leídos', () => {
    const result = vi.fn();
    const read = { ...notice('1'), read_at: '2026-11-24T19:00:00.000Z' };

    api.listRecent().subscribe(result);

    expectPage(1, false).flush({
      data: [notice('3'), notice('2', 'nuevo_reporte'), read],
      pagination: { page: 1, total_pages: 1 },
    });

    expect(result).toHaveBeenCalledExactlyOnceWith([notice('3'), read]);
  });

  it('marca como leído únicamente el aviso seleccionado', () => {
    api.markAsRead('7').subscribe();

    const request = http.expectOne(`${url}/7/read`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});

    request.flush({ success: true });
  });
});

