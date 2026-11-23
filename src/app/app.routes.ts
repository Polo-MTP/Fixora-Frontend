import { Routes } from '@angular/router';

import { authGuard, roleGuard } from './auth/session.guards';


export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/landing').then((m) => m.Landing),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login').then((m) => m.Login),
  },
  {
    path: 'inicio',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home').then((m) => m.Home),
  },

  {
    path: 'administrador/verificaciones/:id',
    canActivate: [roleGuard],
    data: { roles: ['administrador'] },
    loadComponent: () =>
      import('./pages/admin/supplier-application-detail').then(
        (m) => m.SupplierApplicationDetailPage,
      ),
  },
  {
    path: 'administrador/verificaciones',
    canActivate: [roleGuard],
    data: { roles: ['administrador'] },
    loadComponent: () =>
      import('./pages/admin/supplier-applications').then((m) => m.SupplierApplications),
  },
  {
    path: 'administrador',
    pathMatch: 'full',
    canActivate: [roleGuard],
    data: { roles: ['administrador'] },
    loadComponent: () =>
      import('./pages/admin/admin-dashboard').then((m) => m.AdminDashboard),
  },

  {
    path: 'administrador/equipo',
    canActivate: [roleGuard],
    data: { roles: ['administrador'] },
    loadComponent: () => import('./pages/admin/staff-create').then(m => m.StaffCreate),
  },

  ...(['cliente', 'proveedor', 'gerente', 'empleado', 'soporte'] as const).map((role) => ({
    path: role,
    data: { roles: [role] },
    canActivate: [roleGuard],
    loadComponent: () => import('./pages/role-home').then((m) => m.RoleHome),
  })),

  {
    path: 'sin-permiso',
    loadComponent: () => import('./pages/message').then((m) => m.Message),
    data: {
      title: 'Sin permiso',
      message: 'Tu cuenta no tiene acceso a esta sección.',
    },
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
    path: 'registro-proveedor',
    loadComponent: () =>
      import('./pages/registro-proveedor').then((m) => m.ProviderRegistration),
  },
  {
    path: 'estado-solicitud',
    loadComponent: () =>
      import('./pages/application-status').then((m) => m.ApplicationStatus),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/message').then((m) => m.Message),
    data: {
      title: 'Página no encontrada',
      message: 'La ruta solicitada no existe.',
    },
  },
];
