import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

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
  readonly isAdminPage = signal(false);

  private readonly auth = inject(AuthApi);
  private readonly router = inject(Router);

  constructor() {
    this.updateAdminLayout(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.updateAdminLayout(event.urlAfterRedirects));
  }

  logout(): void {
    this.auth.logout().subscribe({
      complete: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }

  private updateAdminLayout(url: string): void {
    this.isAdminPage.set(url.startsWith('/administrador'));
  }
}