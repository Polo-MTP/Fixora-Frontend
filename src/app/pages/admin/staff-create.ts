import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminShell } from '../../admin/admin-shell';
import { StaffApi, type StaffAccount, type StaffInput } from '../../admin/staff-api';

@Component({
  imports: [AdminShell, FormsModule],
  templateUrl: './staff-create.html',
  styleUrl: './admin-management.css',
})
export class StaffCreate {
  private readonly api = inject(StaffApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly saving = signal(false);
  readonly forbidden = signal(false);
  readonly error = signal('');
  readonly created = signal<StaffAccount | null>(null);
  readonly today = new Date().toISOString().slice(0, 10);
  draft: StaffInput = this.emptyDraft();
  confirmation = '';
  showPassword = false;

  submit(): void {
    if (this.saving() || this.forbidden()) return;
    this.error.set('');
    this.created.set(null);
    const value = this.draft;
    if (
      !value.name.trim() ||
      !value.lastname_p.trim() ||
      value.name.trim().length > 100 ||
      value.lastname_p.trim().length > 100 ||
      (value.lastname_m?.trim().length || 0) > 100
    ) {
      this.error.set('Escribe el nombre y apellido paterno (máximo 100 caracteres por campo).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim()) || value.email.trim().length > 255) {
      this.error.set('Escribe un correo válido.');
      return;
    }
    if (
      value.password.length < 8 ||
      new TextEncoder().encode(value.password).length > 72 ||
      value.password !== this.confirmation
    ) {
      this.error.set(
        'La contraseña debe coincidir, tener al menos 8 caracteres y no superar 72 bytes.',
      );
      return;
    }
    if (value.phone && !/^\d{10}$/.test(value.phone.trim())) {
      this.error.set('El teléfono debe tener 10 dígitos.');
      return;
    }
    if (
      value.birth_date &&
      (value.birth_date > this.today || !/^\d{4}-\d{2}-\d{2}$/.test(value.birth_date))
    ) {
      this.error.set('La fecha de nacimiento no puede ser futura.');
      return;
    }
    const input: StaffInput = {
      name: value.name.trim(),
      lastname_p: value.lastname_p.trim(),
      email: value.email.trim().toLowerCase(),
      password: value.password,
      role: value.role,
      ...(value.lastname_m?.trim() ? { lastname_m: value.lastname_m.trim() } : {}),
      ...(value.phone?.trim() ? { phone: value.phone.trim() } : {}),
      ...(value.birth_date ? { birth_date: value.birth_date } : {}),
    };
    this.saving.set(true);
    this.api
      .create(input)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: ({ data }) => {
          this.created.set(data);
          this.draft = this.emptyDraft();
          this.confirmation = '';
          this.showPassword = false;
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 403) this.forbidden.set(true);
          this.error.set(
            error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
              ? error.error.message
              : 'No se pudo crear la cuenta. Intenta nuevamente.',
          );
        },
      });
  }
  private emptyDraft(): StaffInput {
    return {
      name: '',
      lastname_p: '',
      lastname_m: '',
      email: '',
      password: '',
      role: 'soporte',
      phone: '',
      birth_date: '',
    };
  }
}
