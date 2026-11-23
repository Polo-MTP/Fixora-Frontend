import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, timeout } from 'rxjs';
export interface CommissionEntry {
  id: string;
  percentage: string;
  effective_from: string;
  created_by: string;
  created_at?: string;
}
export interface CommissionSettings {
  current: { percentage: string; effective_from: string | null; is_default: boolean };
  history: CommissionEntry[];
}
@Injectable({ providedIn: 'root' })
export class CommissionApi {
  private readonly http = inject(HttpClient);
  get() {
    return this.http.get<{ data: CommissionSettings }>('/api/admin/commission-settings').pipe(
      timeout(15000),
      map(({ data }) => data),
    );
  }
  save(percentage: string) {
    return this.http
      .put<{ data: CommissionEntry }>('/api/admin/commission-settings', { percentage })
      .pipe(
        timeout(30000),
        map(({ data }) => data),
      );
  }
}
