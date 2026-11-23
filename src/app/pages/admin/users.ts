import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminShell } from '../../admin/admin-shell';
import { UsersApi, type UserAccount } from '../../admin/users-api';
@Component({
  imports: [AdminShell, FormsModule],
  templateUrl: './users.html',
  styleUrl: './admin-management.css',
})
export class Users implements OnInit {
  private readonly api = inject(UsersApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly rows = signal<UserAccount[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly search = signal('');
  readonly role = signal('');
  readonly state = signal('');
  readonly page = signal(1);
  readonly roleIds = computed(() =>
    [...new Set(this.rows().map((row) => row.roleId))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    ),
  );
  readonly states = computed(() => [...new Set(this.rows().map((row) => row.state))].sort());
  readonly filtered = computed(() =>
    this.rows().filter(
      (row) =>
        (!this.role() || row.roleId === this.role()) &&
        (!this.state() || row.state === this.state()) &&
        (row.email + ' ' + row.id)
          .toLocaleLowerCase()
          .includes(this.search().trim().toLocaleLowerCase()),
    ),
  );
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / 20)));
  readonly visible = computed(() =>
    this.filtered().slice((this.page() - 1) * 20, this.page() * 20),
  );
  ngOnInit() {
    this.load();
  }
  load() {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.api
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (rows) => {
          this.rows.set(rows);
          this.page.set(1);
        },
        error: (error) =>
          this.error.set(
            error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
              ? error.error.message
              : 'No se pudieron cargar las cuentas. Intenta nuevamente.',
          ),
      });
  }
  reset() {
    this.search.set('');
    this.role.set('');
    this.state.set('');
    this.page.set(1);
  }
}
