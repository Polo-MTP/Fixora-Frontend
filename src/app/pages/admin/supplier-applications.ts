import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AdminShell } from '../../admin/admin-shell';
import {
    SupplierApplicationsApi,
    type ApplicationPagination,
    type SupplierApplicationState,
    type SupplierApplicationSummary,
} from '../../admin/supplier-applications-api';

@Component({
    imports: [AdminShell, DatePipe, FormsModule, RouterLink],
    templateUrl: './supplier-applications.html',
    styleUrl: './supplier-applications.css',
})
export class SupplierApplications implements OnInit {
    private readonly api = inject(SupplierApplicationsApi);

    readonly rows = signal<SupplierApplicationSummary[]>([]);
    readonly pagination = signal<ApplicationPagination | null>(null);
    readonly loading = signal(false);
    readonly errorMessage = signal('');

    readonly selectedState = signal<SupplierApplicationState | ''>('');
    readonly currentPage = signal(1);

    searchText = '';

    ngOnInit(): void {
        this.load();
    }

    load(page = this.currentPage()): void {
        this.loading.set(true);
        this.errorMessage.set('');
        this.currentPage.set(page);

        this.api
            .list({
                state: this.selectedState() || undefined,
                search: this.searchText.trim() || undefined,
                page,
                limit: 20,
            })
            .subscribe({
                next: (response) => {
                    this.rows.set(response.data);
                    this.pagination.set(response.pagination);
                    this.loading.set(false);
                },
                error: (error: unknown) => {
                    this.errorMessage.set(this.getErrorMessage(error));
                    this.loading.set(false);
                },
            });
    }

    changeState(value: SupplierApplicationState | ''): void {
        this.selectedState.set(value);
        this.load(1);
    }

    search(): void {
        this.load(1);
    }

    clearFilters(): void {
        this.searchText = '';
        this.selectedState.set('');
        this.load(1);
    }

    previousPage(): void {
        if (this.currentPage() > 1) {
            this.load(this.currentPage() - 1);
        }
    }

    nextPage(): void {
        const pageInfo = this.pagination();

        if (pageInfo && this.currentPage() < pageInfo.total_pages) {
            this.load(this.currentPage() + 1);
        }
    }

    statusLabel(status: SupplierApplicationState): string {
        const labels: Record<SupplierApplicationState, string> = {
            pendiente: 'Pendiente',
            aprobada: 'Aprobada',
            rechazada: 'Rechazada',
            documentacion_incompleta: 'Documentación incompleta',
        };

        return labels[status];
    }

    typeLabel(type: string): string {
        return type === 'empresa' ? 'Empresa' : 'Independiente';
    }

    statusClass(status: SupplierApplicationState): string {
        return `status--${status}`;
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof HttpErrorResponse) {
            const body = error.error as { message?: string } | null;
            return body?.message || 'No se pudieron cargar las solicitudes.';
        }

        return 'No se pudieron cargar las solicitudes.';
    }
}