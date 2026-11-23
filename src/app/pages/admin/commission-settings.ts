import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminShell } from '../../admin/admin-shell';
import { CommissionApi, type CommissionSettings } from '../../admin/commission-api';

@Component({
  imports: [AdminShell, DatePipe, FormsModule],
  templateUrl: './commission-settings.html',
  styleUrl: './admin-management.css',
})
export class CommissionSettingsPage implements OnInit {
  private readonly api = inject(CommissionApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly settings = signal<CommissionSettings | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly pendingPercentage = signal<string | null>(null);
  percentage = '';
  ngOnInit() {
    this.load();
  }
  load() {
    if (this.loading() || this.saving()) return;
    this.loading.set(true);
    this.error.set('');
    this.api
      .get()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (settings) => {
          this.settings.set(settings);
          this.percentage = settings.current.percentage;
        },
        error: (error) => this.fail(error),
      });
  }
  prepare() {
    if (this.loading() || this.saving() || !this.settings()) return;
    this.error.set('');
    this.message.set('');
    const value = this.percentage.trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(value) || Number(value) > 50) {
      this.error.set('Escribe un porcentaje de 0 a 50 con un máximo de dos decimales.');
      return;
    }
    this.pendingPercentage.set(Number(value).toFixed(2));
  }
  save() {
    const percentage = this.pendingPercentage();
    if (percentage === null || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.api
      .save(percentage)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (entry) => {
          this.settings.update((settings) => ({
            current: {
              percentage: entry.percentage,
              effective_from: entry.effective_from,
              is_default: false,
            },
            history: [entry, ...(settings?.history || [])].slice(0, 20),
          }));
          this.percentage = entry.percentage;
          this.pendingPercentage.set(null);
          this.message.set(
            'Porcentaje actualizado. Los ingresos anteriores conservan su comisión.',
          );
        },
        error: (error) => this.fail(error),
      });
  }
  private fail(error: unknown) {
    this.error.set(
      error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
        ? error.error.message
        : 'No se pudo completar la operación. Intenta nuevamente.',
    );
  }
}
