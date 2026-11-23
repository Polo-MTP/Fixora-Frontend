import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AdminShell } from '../../admin/admin-shell';
import {
    SupplierApplicationsApi,
    type ApplicationDocument,
    type ResolutionState,
    type SupplierApplicationDetail,
    type SupplierApplicationState,
} from '../../admin/supplier-applications-api';

@Component({
    imports: [AdminShell, CurrencyPipe, DatePipe, RouterLink],
    templateUrl: './supplier-application-detail.html',
    styleUrl: './supplier-application-detail.css',
})
export class SupplierApplicationDetailPage implements OnInit {
    private readonly api = inject(SupplierApplicationsApi);
    private readonly route = inject(ActivatedRoute);
    private readonly sanitizer = inject(DomSanitizer);

    readonly application = signal<SupplierApplicationDetail | null>(null);
    readonly selectedDocument = signal<ApplicationDocument | null>(null);
    readonly previewUrl = signal('');
    readonly loading = signal(false);
    readonly previewLoading = signal(false);
    readonly saving = signal(false);
    readonly errorMessage = signal('');
    readonly previewError = signal('');
    readonly actionMessage = signal('');
    readonly providerComment = signal('');

    private applicationId = '';

    ngOnInit(): void {
        this.applicationId = this.route.snapshot.paramMap.get('id') ?? '';

        if (!this.applicationId) {
            this.errorMessage.set('No se encontró el identificador de la solicitud.');
            return;
        }

        this.load();
    }

    load(selectedDocumentId?: string): void {
        this.loading.set(true);
        this.errorMessage.set('');

        this.api.getById(this.applicationId).subscribe({
            next: (application) => {
                this.application.set(application);
                this.loading.set(false);

                const selected =
                    application.documents.find((document) => document.id === selectedDocumentId) ??
                    application.documents[0] ??
                    null;

                this.selectDocument(selected);
            },
            error: (error: unknown) => {
                this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar la solicitud.'));
                this.loading.set(false);
            },
        });
    }

    selectDocument(document: ApplicationDocument | null): void {
        this.selectedDocument.set(document);
        this.previewUrl.set('');
        this.previewError.set('');

        if (!document) return;

        this.previewLoading.set(true);
        this.api.getSignedUrl(document.file_key).subscribe({
            next: (url) => {
                this.previewUrl.set(url);
                this.previewLoading.set(false);
            },
            error: (error: unknown) => {
                this.previewError.set(
                    this.getErrorMessage(error, 'No se pudo preparar la vista previa del documento.'),
                );
                this.previewLoading.set(false);
            },
        });
    }

    safePreviewUrl(): SafeResourceUrl {
        return this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl());
    }

    isPdf(fileKey: string): boolean {
        return fileKey.toLowerCase().endsWith('.pdf');
    }

    reviewDocument(result: 'aprobado' | 'rechazado'): void {
        const document = this.selectedDocument();
        const comment = this.providerComment().trim();

        if (!document || this.saving()) return;

        if (result === 'rechazado' && !comment) {
            this.errorMessage.set('Escribe una observación para rechazar el documento.');
            return;
        }

        this.saving.set(true);
        this.errorMessage.set('');
        this.actionMessage.set('');

        this.api
            .reviewDocument(document.id, {
                result,
                ...(comment ? { comment } : {}),
            })
            .subscribe({
                next: () => {
                    this.saving.set(false);
                    this.providerComment.set('');
                    this.actionMessage.set(
                        result === 'aprobado'
                            ? 'Documento aprobado.'
                            : 'Documento rechazado y observación registrada.',
                    );
                    this.load(document.id);
                },
                error: (error: unknown) => {
                    this.errorMessage.set(
                        this.getErrorMessage(error, 'No se pudo guardar la revisión del documento.'),
                    );
                    this.saving.set(false);
                },
            });
    }

    resolveApplication(state: ResolutionState): void {
        const comment = this.providerComment().trim();

        if (this.saving()) return;

        if (state !== 'aprobada' && !comment) {
            this.errorMessage.set('Escribe el motivo que se enviará al proveedor.');
            return;
        }

        this.saving.set(true);
        this.errorMessage.set('');
        this.actionMessage.set('');

        this.api
            .resolve(this.applicationId, {
                state,
                ...(comment ? { comments: comment } : {}),
            })
            .subscribe({
                next: (application) => {
                    this.application.set(application);
                    this.providerComment.set('');
                    this.actionMessage.set(`Solicitud actualizada: ${this.statusLabel(application.state)}.`);
                    this.saving.set(false);
                },
                error: (error: unknown) => {
                    this.errorMessage.set(
                        this.getErrorMessage(
                            error,
                            'No se pudo resolver la solicitud. Revisa que todos los documentos estén aprobados.',
                        ),
                    );
                    this.saving.set(false);
                },
            });
    }

    statusLabel(status: SupplierApplicationState): string {
        return {
            pendiente: 'En revisión',
            aprobada: 'Aprobada',
            rechazada: 'Rechazada',
            documentacion_incompleta: 'Correcciones solicitadas',
        }[status];
    }

    statusClass(status: SupplierApplicationState): string {
        return `status--${status}`;
    }

    typeLabel(type: string): string {
        return type === 'empresa' ? 'Empresa' : 'Independiente';
    }

    dayName(day: number): string {
        return (
            ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][day] ??
            'Día no válido'
        );
    }

    private getErrorMessage(error: unknown, fallback: string): string {
        if (error instanceof HttpErrorResponse) {
            const body = error.error as { message?: string } | null;
            return body?.message || fallback;
        }

        return fallback;
    }
}