import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-application-status',
    imports: [RouterLink],
    template: `
    <main class="application-status" aria-labelledby="status-title">
      <p class="application-status__eyebrow">Registro de proveedor</p>
      <h1 id="status-title">Tu solicitud está en revisión</h1>
      <p>
        Recibimos tu solicitud. Te avisaremos cuando termine la revisión de tu cuenta.
      </p>
      <a routerLink="/login">Volver al inicio de sesión</a>
    </main>
  `,
    styles: `
    :host { display: block; }
    .application-status {
      box-sizing: border-box;
      width: min(100% - 2rem, 42rem);
      margin: 5rem auto;
      padding: clamp(1.5rem, 5vw, 3rem);
      border: 1px solid #e5eaf0;
      border-radius: 1rem;
      background: #fff;
      box-shadow: 0 1rem 3rem rgb(20 45 75 / 9%);
    }
    .application-status__eyebrow {
      color: #e94c25;
      font-size: 0.78rem;
      font-weight: 750;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .application-status h1 { color: #1d3b60; }
    .application-status p { line-height: 1.6; }
    .application-status a { color: #1d3b60; font-weight: 700; }
  `,
})
export class ApplicationStatus { }