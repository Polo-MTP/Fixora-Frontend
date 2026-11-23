import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { timeout } from 'rxjs';
export interface StaffInput {
  name: string;
  lastname_p: string;
  lastname_m?: string;
  email: string;
  password: string;
  role: 'administrador' | 'soporte';
  phone?: string;
  birth_date?: string;
}
export interface StaffAccount {
  id: string;
  email: string;
  role: string;
  state: string;
}
@Injectable({ providedIn: 'root' })
export class StaffApi {
  private readonly http = inject(HttpClient);
  create(input: StaffInput) {
    return this.http.post<{ data: StaffAccount }>('/api/admin/staff', input).pipe(timeout(30000));
  }
}
