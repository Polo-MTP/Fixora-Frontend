import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, timeout } from 'rxjs';
export interface CategoryInput {
  name: string;
  slug?: string;
  icon_key: string | null;
  sort_order: number;
  active: boolean;
}
export interface Category extends CategoryInput {
  id: string;
  slug: string;
}
@Injectable({ providedIn: 'root' })
export class CategoriesApi {
  private readonly http = inject(HttpClient);
  list() {
    return this.http.get<{ data: Category[] }>('/api/categories/admin/all').pipe(
      timeout(15000),
      map(({ data }) => data),
    );
  }
  save(input: CategoryInput, id?: string) {
    const request = id
      ? this.http.patch<{ data: Category }>(`/api/categories/${encodeURIComponent(id)}`, input)
      : this.http.post<{ data: Category }>('/api/categories', input);
    return request.pipe(
      timeout(30000),
      map(({ data }) => data),
    );
  }
  setActive(category: Category) {
    const url = `/api/categories/${encodeURIComponent(category.id)}`;
    const request = category.active
      ? this.http.delete<{ data: Category }>(url)
      : this.http.patch<{ data: Category }>(url, { active: true });
    return request.pipe(
      timeout(30000),
      map(({ data }) => data),
    );
  }
}
