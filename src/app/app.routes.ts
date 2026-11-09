import { Routes } from '@angular/router';

import { authGuard, roleGuard } from './auth/session.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: 'login', loadComponent: () => import('./pages/login').then((m) => m.Login) },
  {
    path: 'inicio',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home').then((m) => m.Home),
  },
  ...(['cliente', 'proveedor', 'gerente', 'empleado', 'administrador', 'soporte'] as const).map(
    (role) => ({
      path: role,
      data: { roles: [role] },
      canActivate: [roleGuard],
      loadComponent: () => import('./pages/role-home').then((m) => m.RoleHome),
    }),
  ),
  {
    path: 'sin-permiso',
    loadComponent: () => import('./pages/message').then((m) => m.Message),
    data: { title: 'Sin permiso', message: 'Tu cuenta no tiene acceso a esta sección.' },
  },
  {
    path: 'error',
    loadComponent: () => import('./pages/message').then((m) => m.Message),
    data: {
      title: 'Servicio no disponible',
      message: 'No se pudo comprobar tu sesión. Intenta de nuevo.',
    },
  },
  {
    path: '**',
    loadComponent: () => import('./pages/message').then((m) => m.Message),
    data: { title: 'Página no encontrada', message: 'La ruta solicitada no existe.' },
  },
];
