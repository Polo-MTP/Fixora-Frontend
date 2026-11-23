import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type SupplierType = 'independiente' | 'empresa';

export interface ProviderDocumentType {
  id: string;
  name: string;
  description: string | null;
  requires_expiration_date: boolean;
  supplier_type: SupplierType | 'ambos';
  mandatory: boolean;
}

interface DocumentTypesResponse {
  data: ProviderDocumentType[];
}

@Injectable({ providedIn: 'root' })
export class ProviderRegistrationApi {
  private readonly http = inject(HttpClient);

  getDocumentTypes(supplierType: SupplierType): Observable<DocumentTypesResponse> {
    const params = new HttpParams().set('supplier_type', supplierType);

    return this.http.get<DocumentTypesResponse>('/api/document-types', { params });
  }
}
