import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-provider-registration',
    imports: [RouterLink],
    template: `
    <main>
      <p>Registro de proveedores</p>
      <h1>Registra tu negocio en Fixora</h1>
      <p>El formulario de registro se agregará en su tarea correspondiente.</p>
      <a routerLink="/">Volver al inicio</a>
    </main>
  `,
})
export class ProviderRegistration { }