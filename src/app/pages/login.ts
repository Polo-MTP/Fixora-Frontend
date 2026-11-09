import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthApi } from '../auth/auth-api';

@Component({
  imports: [FormsModule],
  template: `
    <h1>Iniciar sesión</h1>
    <form (ngSubmit)="submit()">
      <p>
        <label
          >Correo<br /><input
            type="email"
            name="email"
            [(ngModel)]="email"
            required
            autocomplete="email"
        /></label>
      </p>
      <p>
        <label
          >Contraseña<br /><input
            type="password"
            name="password"
            [(ngModel)]="password"
            required
            autocomplete="current-password"
        /></label>
      </p>
      <button type="submit" [disabled]="loading">{{ loading ? 'Entrando…' : 'Entrar' }}</button>
    </form>
    @if (errorMessage) {
      <p role="alert">{{ errorMessage }}</p>
    }
  `,
})
export class Login {
  private readonly auth = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  submit(): void {
    if (this.loading || !this.email.trim() || !this.password) return;
    this.loading = true;
    this.errorMessage = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        const requested = this.route.snapshot.queryParamMap.get('returnUrl');
        const destination =
          requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/inicio';
        void this.router.navigateByUrl(destination);
      },
      error: (error: unknown) => {
        this.loading = false;
        const body =
          error instanceof HttpErrorResponse ? (error.error as { message?: string } | null) : null;
        this.errorMessage = body?.message || 'No se pudo iniciar sesión. Intenta de nuevo.';
      },
    });
  }
}
