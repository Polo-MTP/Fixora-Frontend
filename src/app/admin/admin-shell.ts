import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthApi } from '../auth/auth-api';
import { SessionService } from '../auth/session.service';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="admin-shell">
      <aside class="sidebar">
        <a class="brand" routerLink="/administrador" aria-label="Fixora, dashboard">
          Fix<span>o</span>ra
        </a>

        <span class="role-badge">ADMINISTRADOR</span>

        <nav aria-label="Menú de administración">
          <a
            routerLink="/administrador"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            <span aria-hidden="true">▦</span> Dashboard
          </a>

          <a
            routerLink="/administrador/verificaciones"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: false }"
          >
            <span aria-hidden="true">⛨</span> Verificaciones
          </a>

          <span class="nav-disabled"><span aria-hidden="true">♙</span> Proveedores</span>
          <span class="nav-disabled"><span aria-hidden="true">♧</span> Clientes</span>
          <span class="nav-disabled"><span aria-hidden="true">$</span> Pagos y comisiones</span>
          <span class="nav-disabled"><span aria-hidden="true">◇</span> Adeudos</span>
          <span class="nav-disabled"><span aria-hidden="true">⌑</span> Categorías</span>
          <span class="nav-disabled"><span aria-hidden="true">◉</span> Patrocinados</span>
          <a routerLink="/administrador/equipo" routerLinkActive="active"><span aria-hidden="true">♙</span> Equipo</a>
          <span class="nav-disabled"><span aria-hidden="true">⚙</span> Configuración</span>
          <span class="nav-disabled"><span aria-hidden="true">◷</span> Bitácora</span>
        </nav>

        <div class="sidebar-footer">
          <div class="avatar" aria-hidden="true">AD</div>
          <div class="identity">
            <strong>Administración</strong>
            <span>{{ session.current()?.role || 'Administrador' }}</span>
          </div>
          <button type="button" class="logout" (click)="logout()" aria-label="Cerrar sesión">
            ↪
          </button>
        </div>
      </aside>

      <main class="admin-main">
        <ng-content />
      </main>
    </div>
  `,
  styles: `
    :host { display: block; }

    .admin-shell {
      display: grid;
      grid-template-columns: 14rem minmax(0, 1fr);
      min-height: 100vh;
      color: #14233a;
      background: #f4f7fb;
      font-family: Inter, "Segoe UI", sans-serif;
    }

    .sidebar {
      position: sticky;
      top: 0;
      display: flex;
      height: 100vh;
      flex-direction: column;
      gap: 1rem;
      padding: 1.1rem 0.8rem 0.7rem;
      color: #d5deeb;
      background: #172a43;
    }

    .brand {
      color: #fff;
      font-size: 1.45rem;
      font-weight: 850;
      letter-spacing: -0.06em;
      text-decoration: none;
    }

    .brand span { color: #ff5c2f; }

    .role-badge {
      width: fit-content;
      padding: 0.28rem 0.55rem;
      border-radius: 999px;
      color: #ffc3af;
      background: rgb(255 92 47 / 17%);
      font-size: 0.62rem;
      font-weight: 800;
      letter-spacing: 0.05em;
    }

    nav {
      display: grid;
      gap: 0.24rem;
      margin-top: 0.25rem;
    }

    nav a, .nav-disabled {
      display: flex;
      min-height: 2.25rem;
      align-items: center;
      gap: 0.65rem;
      padding: 0 0.6rem;
      border-radius: 0.5rem;
      color: #bdc9d8;
      font-size: 0.75rem;
      text-decoration: none;
    }

    nav a:hover, nav a.active {
      color: #fff;
      background: #2b405b;
    }

    .nav-disabled { opacity: 0.65; }

    .sidebar-footer {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      margin-top: auto;
      padding-top: 0.8rem;
      border-top: 1px solid rgb(255 255 255 / 13%);
    }

    .avatar {
      display: grid;
      width: 1.8rem;
      height: 1.8rem;
      flex: 0 0 auto;
      place-items: center;
      border-radius: 50%;
      color: #fff;
      background: #344a65;
      font-size: 0.65rem;
      font-weight: 800;
    }

    .identity { display: grid; min-width: 0; font-size: 0.65rem; }
    .identity strong { color: #fff; }
    .identity span { color: #aab8c9; text-transform: capitalize; }

    .logout {
      margin-left: auto;
      border: 0;
      color: #cad4e1;
      background: transparent;
      font-size: 1rem;
      cursor: pointer;
    }

    .admin-main {
      min-width: 0;
      padding: clamp(1rem, 2.2vw, 2rem);
    }

    @media (max-width: 700px) {
      .admin-shell { grid-template-columns: 1fr; }
      .sidebar {
        position: static;
        height: auto;
        gap: 0.65rem;
        padding: 0.7rem;
      }
      nav { display: flex; overflow-x: auto; }
      nav a, .nav-disabled { flex: 0 0 auto; }
      .nav-disabled { display: none; }
      .sidebar-footer { display: none; }
      .admin-main { padding: 1rem 0.7rem; }
    }
  `,
})
export class AdminShell {
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
