import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  template: `<h1>{{ route.snapshot.data['title'] }}</h1>
    <p>{{ route.snapshot.data['message'] }}</p>
    <p><a routerLink="/inicio">Ir al inicio</a></p>`,
})
export class Message {
  readonly route = inject(ActivatedRoute);
}
