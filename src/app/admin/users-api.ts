import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, timeout } from 'rxjs';
export interface UserAccount {
  id: string;
  email: string;
  roleId: string;
  state: string;
}
interface ApiUser {
  UniqueID: string;
  email: string;
  role_id: string;
  state: string;
}
@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);
  list() {
    return this.http.get<{ data: ApiUser[] }>('/api/users').pipe(
      timeout(15000),
      map(({ data }) =>
        data.map((row) => ({
          id: String(row.UniqueID),
          email: row.email,
          roleId: String(row.role_id),
          state: row.state,
        })),
      ),
    );
  }
}
