import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  template: `<h1>Área de {{ role }}</h1>
    <p>Ruta protegida para este rol.</p>`,
})
export class RoleHome {
  readonly role = inject(ActivatedRoute).snapshot.routeConfig?.path;
}
