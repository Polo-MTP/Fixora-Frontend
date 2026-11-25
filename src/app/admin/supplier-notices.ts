import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EMPTY, Subject, catchError, exhaustMap, finalize, merge, tap, timer } from 'rxjs';

import {
  SupplierNotificationsApi,
  type SupplierNotice,
} from './supplier-notifications-api';

@Component({
  selector: 'app-supplier-notices',
  imports: [DatePipe],
  templateUrl: './supplier-notices.html',
  styleUrl: './supplier-notices.css',
})
export class SupplierNotices {
  private readonly api = inject(SupplierNotificationsApi);
  private readonly router = inject(Router);
  private readonly refreshCount = new Subject<void>();
  private readonly refreshList = new Subject<void>();

  readonly open = signal(false);
  readonly notices = signal<SupplierNotice[]>([]);
  readonly unread = signal(0);
  readonly loading = signal(false);
  readonly countError = signal(false);
  readonly listError = signal('');
  readonly actionError = signal('');
  readonly openingId = signal<string | null>(null);

  readonly bellLabel = computed(() => {
    if (this.countError()) return 'Avisos de proveedores';

    const count = this.unread();
    return `Avisos de proveedores, ${count} sin leer`;
  });

  constructor() {
    const periodicRefresh = timer(0, 30_000);

    merge(periodicRefresh, this.refreshCount)
      .pipe(
        exhaustMap(() =>
          this.api.countUnread().pipe(
            tap((count) => {
              this.unread.set(count);
              this.countError.set(false);
            }),
            catchError(() => {
              this.countError.set(true);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();

    merge(timer(30_000, 30_000), this.refreshList)
      .pipe(
        exhaustMap(() => {
          if (!this.open()) return EMPTY;

          this.loading.set(true);
          this.listError.set('');

          return this.api.listRecent().pipe(
            tap((notices) => this.notices.set(notices)),
            catchError(() => {
              this.listError.set('No pudimos actualizar los avisos.');
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  toggle(): void {
    this.open.update((open) => !open);

    if (this.open()) this.refresh();
  }

  close(bell: HTMLButtonElement): void {
    if (!this.open()) return;

    this.open.set(false);
    bell.focus();
  }

  refresh(): void {
    this.actionError.set('');
    this.refreshCount.next();
    this.refreshList.next();
  }

  applicationId(notice: SupplierNotice): string | null {
    const id = notice.entity_id;

    return notice.entity_type === 'supplier_application' && id && /^[1-9]\d*$/.test(id)
      ? id
      : null;
  }

  openNotice(notice: SupplierNotice): void {
    const id = this.applicationId(notice);
    if (!id || this.openingId()) return;

    this.actionError.set('');
    this.openingId.set(notice.id);

    if (notice.read_at) {
      void this.goToApplication(id);
      return;
    }

    this.api.markAsRead(notice.id).subscribe({
      next: () => {
        this.notices.update((items) =>
          items.map((item) =>
            item.id === notice.id ? { ...item, read_at: new Date().toISOString() } : item,
          ),
        );
        this.unread.update((count) => Math.max(0, count - 1));
        this.refreshCount.next();
        void this.goToApplication(id);
      },
      error: () => {
        this.openingId.set(null);
        this.actionError.set('No pudimos marcar el aviso como leído. Intenta abrirlo de nuevo.');
      },
    });
  }

  private async goToApplication(id: string): Promise<void> {
    try {
      const navigated = await this.router.navigate(['/administrador/verificaciones', id]);

      if (navigated) {
        this.open.set(false);
      } else {
        this.actionError.set('No pudimos abrir el desglose de la solicitud.');
      }
    } catch {
      this.actionError.set('No pudimos abrir el desglose de la solicitud.');
    } finally {
      this.openingId.set(null);
    }
  }
}

