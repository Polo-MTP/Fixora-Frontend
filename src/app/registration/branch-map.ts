import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { circleMarker, map, tileLayer, type LatLng } from 'leaflet';

export interface BranchLocation {
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-branch-map',
  template: `
    <p>Selecciona la entrada del local en el mapa.</p>

    <div #container class="map" role="region" aria-label="Mapa para ubicar el local"></div>

    <button class="map-center-button" type="button" (click)="confirmCenter()">
      Marcar el centro del mapa
    </button>
  `,
  styles: [
    `
      .map {
        height: 16rem;
        border-radius: 0.75rem;
        isolation: isolate;
      }

      .map-center-button {
        margin-block-start: 0.75rem;
        padding: 0.65rem 1rem;
        border: 1px solid #c8d6e5;
        border-radius: 0.625rem;
        background: #fff;
        color: #1d3b60;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 700;
        cursor: pointer;
      }

      .map-center-button:hover {
        border-color: #1d3b60;
        background: #f4f7fb;
      }

      .map-center-button:focus-visible {
        outline: 2px solid #1d3b60;
        outline-offset: 3px;
      }
    `,
  ],
})
export class BranchMap {
  readonly location = input<BranchLocation | null>(null);
  readonly locationChange = output<BranchLocation>();
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');
  private readonly destroyRef = inject(DestroyRef);
  private markCenter?: () => void;
  private readonly showLocation = signal<((point: BranchLocation) => void) | null>(null);

  constructor() {
    effect(() => {
      const point = this.location();
      const showLocation = this.showLocation();
      if (point && showLocation) showLocation(point);
    });

    afterNextRender(() => {
      const saved = this.location();
      const leafletMap = map(this.container().nativeElement).setView(
        saved ? [saved.latitude, saved.longitude] : [25.5428, -103.4068],
        saved ? 17 : 13,
      );
      tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(leafletMap);

      const marker = circleMarker([0, 0], {
        radius: 8,
        color: '#fff',
        fillColor: '#c2410c',
        fillOpacity: 1,
        weight: 2,
      });

      this.showLocation.set(({ latitude, longitude }) => {
        marker.setLatLng([latitude, longitude]).addTo(leafletMap);
        leafletMap.setView([latitude, longitude], Math.max(leafletMap.getZoom(), 17));
      });

      if (saved) marker.setLatLng([saved.latitude, saved.longitude]).addTo(leafletMap);

      const selectPoint = (point: LatLng) => {
        const wrapped = point.wrap();
        marker.setLatLng(wrapped).addTo(leafletMap);
        this.locationChange.emit({
          latitude: Number(wrapped.lat.toFixed(6)),
          longitude: Number(wrapped.lng.toFixed(6)),
        });
      };

      leafletMap.on('click', (event) => selectPoint(event.latlng));
      this.markCenter = () => selectPoint(leafletMap.getCenter());
      this.destroyRef.onDestroy(() => leafletMap.remove());
    });
  }

  confirmCenter(): void {
    this.markCenter?.();
  }
}

