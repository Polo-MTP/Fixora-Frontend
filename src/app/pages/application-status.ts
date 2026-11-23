import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, map, of, switchMap, timeout } from 'rxjs';
import type { SupplierApplicationDetail } from '../admin/supplier-applications-api';
import { SessionService } from '../auth/session.service';
import { ApplicationStatusApi } from '../registration/application-status-api';
import {
  ProviderRegistrationApi,
  type ProviderDocumentType,
} from '../registration/provider-registration-api';

interface Correction extends ProviderDocumentType {
  comment: string;
  file?: File;
  preview?: string;
  dueDate: string;
  error: string;
}
@Component({
  selector: 'app-application-status',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './application-status.html',
  styleUrl: './application-status.css',
})
export class ApplicationStatus implements OnInit {
  readonly session = inject(SessionService);
  private readonly api = inject(ApplicationStatusApi);
  private readonly catalog = inject(ProviderRegistrationApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly application = signal<SupplierApplicationDetail | null>(null);
  readonly corrections = signal<Correction[]>([]);
  readonly loading = signal(false);
  readonly sending = signal('');
  readonly error = signal('');
  readonly message = signal('');
  readonly today = new Date().toISOString().slice(0, 10);
  constructor() {
    this.destroyRef.onDestroy(() => this.releasePreviews());
  }
  ngOnInit() {
    if (this.session.current()?.role === 'proveedor') this.load();
  }

  load(): void {
    if (this.loading() || this.sending()) return;
    this.loading.set(true);
    this.error.set('');
    this.api
      .getMine()
      .pipe(
        switchMap((application) =>
          application.state === 'documentacion_incompleta'
            ? this.catalog
                .getDocumentTypes(application.supplier_type)
                .pipe(map(({ data }) => ({ application, types: data })))
            : of({ application, types: [] as ProviderDocumentType[] }),
        ),
        timeout(15000),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ application, types }) => {
          this.releasePreviews();
          this.application.set(application);
          this.corrections.set(
            types.flatMap((type) => {
              const document = application.documents.find(
                (doc) => doc.type_document_id === type.id,
              );
              if (document?.validation?.result !== 'rechazado' && (document || !type.mandatory))
                return [];
              return [
                {
                  ...type,
                  comment: document?.validation?.comment || 'Documento obligatorio faltante.',
                  dueDate: '',
                  error: '',
                },
              ];
            }),
          );
        },
        error: (error) =>
          this.error.set(
            this.errorText(error, 'No se pudo consultar tu solicitud. Intenta nuevamente.'),
          ),
      });
  }
  selectFile(item: Correction, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (!file) return;
    if (item.preview) URL.revokeObjectURL(item.preview);
    item.preview = undefined;
    item.file = undefined;
    item.error = '';
    if (
      !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      !file.size ||
      file.size > 15 * 1024 * 1024
    ) {
      item.error = 'Selecciona PDF, JPG, PNG o WEBP de hasta 15 MB, con contenido.';
      input.value = '';
      return;
    }
    item.file = file;
    item.preview = URL.createObjectURL(file);
  }
  send(item: Correction): void {
    if (
      this.sending() ||
      this.loading() ||
      this.application()?.state !== 'documentacion_incompleta'
    )
      return;
    item.error = '';
    if (!item.file) {
      item.error = 'Selecciona la evidencia que deseas reenviar.';
      return;
    }
    if (item.requires_expiration_date && (!item.dueDate || item.dueDate <= this.today)) {
      item.error = 'Indica una fecha de vencimiento posterior a hoy.';
      return;
    }
    this.sending.set(item.id);
    this.message.set('');
    this.api
      .replaceDocument(item.id, item.file, item.dueDate || undefined)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.sending.set('')),
      )
      .subscribe({
        next: (response) => {
          this.sending.set('');
          this.message.set(response.message);
          this.load();
        },
        error: (error) => {
          item.error = this.errorText(
            error,
            'No se pudo reenviar el documento. Intenta nuevamente.',
          );
        },
      });
  }
  statusLabel(state: string): string {
    return (
      (
        {
          pendiente: 'En revisión',
          aprobada: 'Solicitud aprobada',
          rechazada: 'Solicitud rechazada',
          documentacion_incompleta: 'Documentación incompleta',
        } as Record<string, string>
      )[state] || state
    );
  }
  private releasePreviews() {
    this.corrections().forEach((item) => {
      if (item.preview) URL.revokeObjectURL(item.preview);
    });
  }
  private errorText(error: unknown, fallback: string): string {
    return error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
      ? error.error.message
      : fallback;
  }
}
