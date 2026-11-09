import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthApi } from './auth/auth-api';
import { SessionService } from './auth/session.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly session = inject(SessionService);
  private readonly auth = inject(AuthApi);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe({
      complete: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }
}
