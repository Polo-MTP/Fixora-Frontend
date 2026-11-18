import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminShell } from '../../admin/admin-shell';

@Component({
    imports: [AdminShell, RouterLink],
    template: `
    <app-admin-shell>
      <section class="dashboard">
        <header class="heading">
          <div>
            <p class="eyebrow">Panel de administración · datos ilustrativos</p>
            <h1>Buenos días, Administrador</h1>
            <p class="muted">Resumen visual de Fixora</p>
          </div>
          <div class="heading-actions">
            <span class="search-display">⌕　Buscar proveedor, cliente o folio</span>
            <button class="bell" type="button" aria-label="Notificaciones">♧</button>
          </div>
        </header>

        <section class="metrics" aria-label="Métricas ilustrativas">
          <article class="metric">
            <span>Servicios hoy</span><strong>148</strong><small>+9% vs. lunes pasado</small>
          </article>
          <article class="metric">
            <span>Técnicos en línea</span><strong>63</strong><small>de 211 aprobados</small>
          </article>
          <article class="metric">
            <span>Cobrado hoy</span><strong>$41,280</strong><small>62% con tarjeta</small>
          </article>
          <article class="metric metric--dark">
            <span>Comisión Fixora</span><strong>$4,128</strong><small>10% de lo cobrado</small>
          </article>
        </section>

        <section class="overview">
          <article class="panel chart-panel">
            <div class="panel-heading"><h2>Servicios por día</h2><span>■ Normales　<span class="orange">■</span> Emergencias</span></div>
            <div class="chart">
              @for (bar of bars; track bar.day) {
                <div class="bar-column">
                  <div class="bar" [style.height.%]="bar.height">
                    <span [style.height.%]="bar.emergency"></span>
                  </div>
                  <small>{{ bar.day }}</small>
                </div>
              }
            </div>
          </article>

          <article class="panel branches">
            <div class="panel-heading"><h2>Por ramo</h2></div>
            @for (branch of categories; track branch.name) {
              <div class="branch-row">
                <div><strong>{{ branch.name }}</strong><span>{{ branch.value }}%</span></div>
                <div class="track"><i [style.width.%]="branch.value"></i></div>
              </div>
            }
          </article>

          <article class="panel pending-panel">
            <div class="panel-heading">
              <h2>Verificaciones pendientes</h2>
              <a routerLink="/administrador/verificaciones">Ver solicitudes →</a>
            </div>
            <div class="sample-note">Ejemplos visuales; consulta la bandeja para ver solicitudes reales.</div>
            <div class="sample-row">
              <span class="initials">JH</span><div><strong>Juan Hernández</strong><small>Plomería Hernández</small></div>
              <span>Plomería</span><span>4 de 4</span>
              <a routerLink="/administrador/verificaciones">Revisar</a>
            </div>
            <div class="sample-row">
              <span class="initials">RS</span><div><strong>Rosa Saucedo</strong><small>Taller Saucedo</small></div>
              <span>Mecánica</span><span>3 de 4</span>
              <a routerLink="/administrador/verificaciones">Revisar</a>
            </div>
            <div class="sample-row">
              <span class="initials">AL</span><div><strong>Arturo López</strong><small>Cerrajería López</small></div>
              <span>Cerrajería</span><span>4 de 4</span>
              <a routerLink="/administrador/verificaciones">Revisar</a>
            </div>
          </article>

          <article class="panel cases">
            <div class="panel-heading"><h2>Casos de soporte abiertos</h2><span class="count">5</span></div>
            <div class="case"><strong>Llegada en disputa</strong><small>C-4817 · Prioridad alta</small></div>
            <div class="case"><strong>Cancelación con evidencia</strong><small>C-4812 · Prioridad media</small></div>
            <div class="case"><strong>Mal uso de emergencia</strong><small>C-4809 · Prioridad media</small></div>
          </article>
        </section>
      </section>
    </app-admin-shell>
  `,
    styles: `
    :host { display: block; }
    * { box-sizing: border-box; }
    .dashboard { max-width: 1500px; margin: 0 auto; }
    .heading, .heading-actions, .panel-heading, .branch-row > div, .sample-row {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    }
    .heading { margin-bottom: 1.1rem; }
    h1 { margin: 0 0 .2rem; font-size: clamp(1.3rem, 2vw, 1.8rem); letter-spacing: -.04em; }
    h2 { margin: 0; font-size: .9rem; }
    p { margin: 0; }
    .eyebrow { margin-bottom: .35rem; color: #f15a35; font-size: .65rem; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; }
    .muted, small { color: #77869a; font-size: .68rem; }
    .heading-actions { color: #8290a2; }
    .search-display, .bell { padding: .65rem .8rem; border: 1px solid #e8edf3; border-radius: .65rem; background: #fff; font-size: .7rem; }
    .bell { color: #172a43; cursor: pointer; }
    .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .7rem; margin-bottom: .8rem; }
    .metric, .panel { border: 1px solid #e8edf3; border-radius: .9rem; background: #fff; box-shadow: 0 5px 18px rgb(20 40 65 / 4%); }
    .metric { display: grid; gap: .3rem; padding: .9rem; }
    .metric span { color: #516178; font-size: .68rem; font-weight: 700; }
    .metric strong { font-size: 1.45rem; letter-spacing: -.04em; }
    .metric small { font-size: .62rem; }
    .metric--dark { color: #fff; background: #172a43; }
    .metric--dark span, .metric--dark small { color: #c4d0df; }
    .overview { display: grid; grid-template-columns: 1.55fr 1fr; gap: .8rem; }
    .panel { min-width: 0; padding: .9rem; }
    .panel-heading { margin-bottom: .8rem; }
    .panel-heading > span { color: #718197; font-size: .62rem; }
    .orange { color: #ff5c2f; }
    .chart-panel { min-height: 10rem; }
    .chart { display: flex; height: 8rem; align-items: end; justify-content: space-around; padding: .4rem .5rem 0; border-bottom: 1px solid #e7edf4; background: repeating-linear-gradient(to bottom, transparent 0, transparent 30px, #edf1f6 31px); }
    .bar-column { display: grid; height: 100%; justify-items: center; align-content: end; gap: .25rem; }
    .bar { display: flex; width: clamp(1rem, 2vw, 1.5rem); flex-direction: column; justify-content: start; overflow: hidden; border-radius: .35rem .35rem .15rem .15rem; background: #172a43; }
    .bar span { display: block; width: 100%; background: #ff5c2f; }
    .bar-column small { font-size: .58rem; }
    .branches { grid-row: span 1; }
    .branch-row { margin: .8rem 0; }
    .branch-row > div:first-child { font-size: .67rem; }
    .branch-row strong { font-size: .67rem; }
    .track { height: .28rem; margin-top: .35rem; overflow: hidden; border-radius: 1rem; background: #edf1f5; }
    .track i { display: block; height: 100%; border-radius: inherit; background: #172a43; }
    .branch-row:first-of-type .track i { background: #ff5c2f; }
    .pending-panel { min-height: 14rem; }
    .panel-heading a, .sample-row a { color: #e94c25; font-size: .65rem; font-weight: 750; text-decoration: none; white-space: nowrap; }
    .sample-note { margin: -.35rem 0 .45rem; color: #8793a2; font-size: .6rem; }
    .sample-row { justify-content: flex-start; padding: .7rem 0; border-top: 1px solid #edf1f5; font-size: .65rem; }
    .sample-row > div { display: grid; min-width: 8rem; margin-right: auto; gap: .18rem; }
    .sample-row > span:not(.initials) { min-width: 4.5rem; color: #55667b; }
    .sample-row a { padding: .3rem .5rem; border: 1px solid #e6ebf1; border-radius: .45rem; color: #172a43; }
    .initials { display: grid; width: 1.65rem; height: 1.65rem; place-items: center; border-radius: 50%; background: #edf2f7; font-size: .58rem; font-weight: 800; }
    .cases { display: grid; align-content: start; gap: .55rem; }
    .count { display: grid; width: 1.35rem; height: 1.35rem; place-items: center; border-radius: 50%; color: #e94c25; background: #fff0eb; font-size: .63rem; }
    .case { display: grid; gap: .25rem; padding: .65rem; border: 1px solid #edf1f5; border-radius: .6rem; font-size: .68rem; }
    @media (max-width: 900px) { .metrics { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 650px) {
      .heading { align-items: flex-start; flex-direction: column; }
      .overview { grid-template-columns: 1fr; }
      .sample-row { flex-wrap: wrap; }
      .sample-row > div { min-width: calc(100% - 3rem); }
    }
  `,
})
export class AdminDashboard {
    readonly bars = [
        { day: 'L', height: 57, emergency: 18 },
        { day: 'M', height: 70, emergency: 20 },
        { day: 'M', height: 52, emergency: 15 },
        { day: 'J', height: 78, emergency: 23 },
        { day: 'V', height: 86, emergency: 24 },
        { day: 'S', height: 100, emergency: 22 },
        { day: 'D', height: 44, emergency: 17 },
    ];

    readonly categories = [
        { name: 'Plomería', value: 38 },
        { name: 'Electricidad', value: 24 },
        { name: 'Cerrajería', value: 18 },
        { name: 'Mecánica', value: 12 },
        { name: 'Otros', value: 8 },
    ];
}