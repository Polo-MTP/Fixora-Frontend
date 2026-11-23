import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, timeout } from 'rxjs';
import type { SupplierApplicationDetail } from '../admin/supplier-applications-api';

@Injectable({ providedIn: 'root' })
export class ApplicationStatusApi {
  private readonly http = inject(HttpClient);
  getMine() {
    return this.http.get<{ data: SupplierApplicationDetail }>('/api/supplier-applications/me').pipe(
      timeout(15000),
      map(({ data }) => data),
    );
  }
  replaceDocument(typeId: string, file: File, dueDate?: string) {
    const body = new FormData();
    body.append('file', file);
    if (dueDate) body.append('due_date', dueDate);
    return this.http
      .put<{ application_state: string; message: string }>(
        `/api/supplier-applications/me/documents/${encodeURIComponent(typeId)}`,
        body,
      )
      .pipe(timeout(60000));
  }
}
