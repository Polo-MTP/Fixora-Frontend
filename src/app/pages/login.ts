import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthApi, type LoginResult } from '../auth/auth-api';

@Component({
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly changeDetector = inject(ChangeDetectorRef);

  email = '';
  password = '';

  loading = signal(false);
  errorMessage = signal('');

  showPassword = false;
  thirdFactorPending = signal(false);
  thirdFactorChallengeId = signal<string | null>(null);

  submit(): void {
    if (this.loading() || !this.email.trim() || !this.password) return;

    this.loading.set(true);
    this.errorMessage.set('');
    this.thirdFactorPending.set(false);
    this.thirdFactorChallengeId.set(null);

    this.auth.login(this.email, this.password).subscribe({
      next: (result: LoginResult) => {
        this.loading.set(false);

        // Punto de extensión para el futuro desafío del tercer factor.
        if (!('user' in result)) {
          this.thirdFactorChallengeId.set(result.challengeId);
          this.thirdFactorPending.set(true);
          this.changeDetector.markForCheck();
          return;
        }

        // La API permite una sesión de alcance limitado para proveedores
        // cuya solicitud todavía está pendiente de revisión.
        const isPendingProvider =
          result.user.role.trim().toLowerCase() === 'proveedor' &&
          result.user.status.trim().toUpperCase() === 'POR_APROBAR';

        if (isPendingProvider) {
          void this.router.navigateByUrl('/estado-solicitud');
          return;
        }

        const requested = this.route.snapshot.queryParamMap.get('returnUrl');
        const destination = this.destinationForRole(result.user.role, requested);

        void this.router.navigateByUrl(destination);
      },
      error: (error: unknown) => {
        this.loading.set(false);

        const body =
          error instanceof HttpErrorResponse
            ? (error.error as { message?: string } | null)
            : null;

        this.errorMessage.set(
          body?.message || 'No se pudo iniciar sesión. Intenta de nuevo.',
        );
        this.changeDetector.markForCheck();
      },
    });
  }

  private destinationForRole(role: string, returnUrl: string | null): string {
    const roleHomes: Record<string, string> = {
      administrador: '/administrador',
      soporte: '/soporte',
      proveedor: '/proveedor',
      cliente: '/cliente',
      gerente: '/gerente',
      empleado: '/empleado',
    };

    const defaultRoute = roleHomes[role] ?? '/inicio';

    if (!returnUrl?.startsWith('/') || returnUrl.startsWith('//')) {
      return defaultRoute;
    }

    const returnPath = returnUrl.split(/[?#]/, 1)[0];
    const requestedRole = returnPath.slice(1).split('/')[0];

    // Conserva returnUrl solo si corresponde al rol o es la ruta general /inicio.
    return returnPath === '/inicio' || requestedRole === role
      ? returnUrl
      : defaultRoute;
  }
}