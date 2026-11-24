import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export type SupplierApplicationState =
    | 'pendiente'
    | 'aprobada'
    | 'rechazada'
    | 'documentacion_incompleta';

export type SupplierType = 'independiente' | 'empresa';
export type DocumentReviewResult = 'aprobado' | 'rechazado';
export type ResolutionState = Exclude<SupplierApplicationState, 'pendiente'>;

export interface ApplicationListQuery {
    state?: SupplierApplicationState;
    search?: string;
    page?: number;
    limit?: number;
}

export interface SupplierApplicationSummary {
    id: string;
    state: SupplierApplicationState;
    supplier_type: SupplierType;
    application_date: string;
    business_name: string;
    manager_name: string;
    email: string;
    documents_pending: number;
}

export interface ApplicationPagination {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
}

interface ApplicationListResponse {
    data: SupplierApplicationSummary[];
    pagination: ApplicationPagination;
}

export interface ApplicationAddress {
    street: string;
    num_ext: string;
    num_int: string | null;
    colony: string;
    municipality: string;
    state: string;
    postal_code: string;
    country?: string;
    latitude: number | null;
    longitude: number | null;
    reference?: string | null;
}

export interface ApplicationSchedule {
    day_of_week: number;
    open_time: string;
    close_time: string;
}

export interface ApplicationCategory {
    category_id: string;
    category_name: string;
    base_price: string | number;
    duration_minutes: number | null;
}

export interface ApplicationEmployee {
    id: string;
    user_id: string;
    branch_id: string;
    email: string;
    name: string | null;
    lastname_p: string | null;
    role: string;
    can_attend: boolean;
    active: boolean;
}

export interface ApplicationBranch {
    id: string;
    name: string;
    address: ApplicationAddress;
    schedules: ApplicationSchedule[];
    categories: ApplicationCategory[];
    employees?: ApplicationEmployee[];
}

export interface ApplicationDocument {
    id: string;
    type_document_id: string;
    type_name: string;
    file_key: string;
    upload_date: string;
    due_date: string | null;
    is_public: boolean;
    validation: {
        result: string;
        comment: string | null;
        reviewed_at: string;
    } | null;
}

export interface SupplierApplicationDetail {
    id: string;
    state: SupplierApplicationState;
    supplier_type: SupplierType;
    application_date: string;
    business_name: string;
    manager_name: string;
    email: string;
    documents_pending: number;
    comments: string | null;
    rfc: string | null;
    business: {
        name: string;
        tax_identification: string | null;
        email: string | null;
        phone: string | null;
    } | null;
    branches: ApplicationBranch[];
    documents: ApplicationDocument[];
}

interface Envelope<T> {
    data: T;
}

interface SignedUrlResponse {
    data: {
        signed_url: string;
        expires_at: string;
        expires_in_seconds: number;
    };
}

@Injectable({ providedIn: 'root' })
export class SupplierApplicationsApi {
    private readonly http = inject(HttpClient);

    list(query: ApplicationListQuery): Observable<ApplicationListResponse> {
        let params = new HttpParams()
            .set('page', String(query.page ?? 1))
            .set('limit', String(query.limit ?? 20));

        if (query.state) params = params.set('state', query.state);
        if (query.search?.trim()) params = params.set('search', query.search.trim());

        return this.http.get<ApplicationListResponse>('/api/admin/supplier-applications', { params });
    }

    getById(id: string): Observable<SupplierApplicationDetail> {
        return this.http
            .get<Envelope<SupplierApplicationDetail>>(
                `/api/admin/supplier-applications/${encodeURIComponent(id)}`,
            )
            .pipe(map((response) => response.data));
    }

    resolve(
        id: string,
        body: { state: ResolutionState; comments?: string },
    ): Observable<SupplierApplicationDetail> {
        return this.http
            .post<Envelope<SupplierApplicationDetail>>(
                `/api/admin/supplier-applications/${encodeURIComponent(id)}/resolution`,
                body,
            )
            .pipe(map((response) => response.data));
    }

    reviewDocument(
        documentId: string,
        body: { result: DocumentReviewResult; comment?: string },
    ): Observable<unknown> {
        return this.http.patch<Envelope<unknown>>(
            `/api/admin/supplier-documents/${encodeURIComponent(documentId)}`,
            body,
        );
    }

    getSignedUrl(fileKey: string): Observable<string> {
        return this.http
            .post<SignedUrlResponse>('/api/files/signed-url', {
                file_key: fileKey,
                expires_in_minutes: 30,
                disposition: 'inline',
            })
            .pipe(map((response) => response.data.signed_url));
    }
}