import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SessionService } from '../auth/session.service';

@Component({
  imports: [RouterLink],
  template: `
    <h1>Inicio</h1>
    <p>Sesión activa. Rol: {{ session.current()?.role }}</p>
    <p><a [routerLink]="'/' + session.current()?.role">Ir a mi área</a></p>
  `,
})
export class Home {
  readonly session = inject(SessionService);
}
