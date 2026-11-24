import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AdminShell } from '../../admin/admin-shell';
import {
    SupplierApplicationsApi,
    type ApplicationDocument,
    type ResolutionState,
    type SupplierApplicationDetail,
    type SupplierApplicationState,
} from '../../admin/supplier-applications-api';

type ComparisonField = 'name' | 'address' | 'age' | 'legibility';
type ComparisonResult = 'positive' | 'negative';

@Component({
    imports: [AdminShell, CurrencyPipe, DatePipe, RouterLink, TitleCasePipe],
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
    readonly canReviewApplication = computed(
        () => this.application()?.state === 'pendiente' && !this.loading() && !this.saving(),
    );
    readonly canFinalizeApplication = computed(
        () => this.canReviewApplication() && this.application()?.documents_pending === 0,
    );
    readonly errorMessage = signal('');
    readonly previewError = signal('');
    readonly actionMessage = signal('');
    readonly providerComment = signal('');
    readonly documentComment = signal('');

    readonly comparisonFields: ReadonlyArray<{
        key: ComparisonField;
        label: string;
        positive: string;
        negative: string;
    }> = [
        { key: 'name', label: 'Nombre', positive: 'Coincide', negative: 'No coincide' },
        { key: 'address', label: 'Dirección', positive: 'Coincide', negative: 'No coincide' },
        { key: 'age', label: 'Antigüedad', positive: 'Vigente', negative: 'Fuera de vigencia' },
        { key: 'legibility', label: 'Legibilidad', positive: 'Bien', negative: 'Ilegible' },
    ];

    readonly comparisonResults = signal<Partial<Record<ComparisonField, ComparisonResult>>>({});

    setComparisonResult(field: ComparisonField, value: string): void {
        this.comparisonResults.update((current) => {
            const next = { ...current };

            if (value === 'positive' || value === 'negative') {
                next[field] = value;
            } else {
                delete next[field];
            }

            return next;
        });
    }

    comparisonValue(item: SupplierApplicationDetail, field: ComparisonField): string {
        switch (field) {
            case 'name':
                return item.manager_name || 'Nombre no registrado';

            case 'address': {
                const addresses = item.branches.map(({ address }) =>
                    [
                        [address.street, address.num_ext].filter(Boolean).join(' '),
                        address.colony,
                        address.municipality,
                        address.state,
                        address.postal_code,
                    ].filter(Boolean).join(', '),
                );

                return addresses.filter(Boolean).join(' · ') || 'Dirección no registrada';
            }

            case 'age': {
                const dueDate = this.selectedDocument()?.due_date;
                return dueDate ? `Vencimiento registrado: ${dueDate}` : 'Por comprobar en el archivo';
            }

            case 'legibility':
                return 'Por comprobar en la vista previa';
        }
    }

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
        if (this.selectedDocument()?.id !== document?.id) {
            this.comparisonResults.set({});
        }

        this.selectedDocument.set(document);
        this.previewUrl.set('');
        this.previewError.set('');
        this.documentComment.set('');

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
        const comment = this.documentComment().trim();

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
                    this.documentComment.set('');
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

        if (!this.canReviewApplication()) return;

        if (
            (state === 'aprobada' || state === 'rechazada') &&
            !this.canFinalizeApplication()
        ) {
            this.errorMessage.set('Primero deben estar aprobados todos los documentos.');
            return;
        }

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