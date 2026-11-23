import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CategoriesApi, type Category } from './categories-api';

describe('CategoriesApi', () => {
  let api: CategoriesApi;
  let http: HttpTestingController;
  const row: Category = {
    id: '7',
    name: 'Plomería',
    slug: 'plomeria',
    icon_key: 'icons/plomeria.svg',
    sort_order: 2,
    active: true,
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(CategoriesApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('consulta el catálogo administrativo para incluir inactivos', () => {
    api.list().subscribe((rows) => expect(rows).toEqual([row]));
    http.expectOne('/api/categories/admin/all').flush({ data: [row] });
  });
  it('actualiza nombre, orden e ícono sin crear otra categoría', () => {
    const { id, ...input } = row;
    api.save(input, id).subscribe();
    const request = http.expectOne('/api/categories/7');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(input);
    request.flush({ data: row });
  });
  it('desactiva con DELETE y reactiva con PATCH, respetando el contrato', () => {
    api.setActive(row).subscribe();
    const remove = http.expectOne('/api/categories/7');
    expect(remove.request.method).toBe('DELETE');
    remove.flush({ data: { ...row, active: false } });
    api.setActive({ ...row, active: false }).subscribe();
    const activate = http.expectOne('/api/categories/7');
    expect(activate.request.method).toBe('PATCH');
    expect(activate.request.body).toEqual({ active: true });
    activate.flush({ data: row });
  });
});
