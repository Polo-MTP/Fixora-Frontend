import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    SupplierApplicationsApi,
    type ApplicationDocument,
    type SupplierApplicationDetail,
} from '../../admin/supplier-applications-api';
import { SupplierApplicationDetailPage } from './supplier-application-detail';

function makeDocument(id: string): ApplicationDocument {
    return {
        id,
        type_document_id: id,
        type_name: 'Identificación oficial',
        file_key: `verification/${id}.pdf`,
        upload_date: '2026-11-17',
        due_date: null,
        is_public: false,
        validation: null,
    };
}

function makeApplication(documentsPending = 1): SupplierApplicationDetail {
    return {
        id: '42',
        state: 'pendiente',
        supplier_type: 'empresa',
        application_date: '2026-11-17',
        business_name: 'Negocio de prueba',
        manager_name: 'María López',
        email: 'proveedor@example.test',
        documents_pending: documentsPending,
        comments: null,
        rfc: null,
        business: null,
        branches: [],
        documents: [makeDocument('7')],
    };
}

describe('SupplierApplicationDetailPage', () => {
    let component: SupplierApplicationDetailPage;

    const api = {
        getById: vi.fn(),
        getSignedUrl: vi.fn(),
        reviewDocument: vi.fn(),
        resolve: vi.fn(),
    };

    beforeEach(() => {
        vi.resetAllMocks();
        api.getById.mockReturnValue(of(makeApplication()));
        api.getSignedUrl.mockReturnValue(of('https://example.test/documento.pdf'));
        api.reviewDocument.mockReturnValue(of(null));

        TestBed.configureTestingModule({
            providers: [
                { provide: SupplierApplicationsApi, useValue: api },
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: convertToParamMap({ id: '42' }) } },
                },
            ],
        });

        // Probamos la lógica del componente sin renderizar el panel ni el visor.
        component = TestBed.createComponent(SupplierApplicationDetailPage).componentInstance;
        component.ngOnInit();
    });

    it('carga la solicitud y pide el enlace del primer documento', () => {
        expect(api.getById).toHaveBeenCalledWith('42');
        expect(component.selectedDocument()?.id).toBe('7');
        expect(api.getSignedUrl).toHaveBeenCalledWith('verification/7.pdf');
        expect(component.previewUrl()).toBe('https://example.test/documento.pdf');
    });

    it('bloquea la aprobación y el rechazo final si faltan documentos por aprobar', () => {
        component.providerComment.set('Motivo de prueba');

        component.resolveApplication('aprobada');
        component.resolveApplication('rechazada');

        expect(component.canFinalizeApplication()).toBe(false);
        expect(api.resolve).not.toHaveBeenCalled();
        expect(component.errorMessage()).toMatch(/aprobados todos los documentos/i);
    });

    it('permite aprobar cuando el contador de documentos pendientes llega a cero', () => {
        component.application.set(makeApplication(0));
        api.resolve.mockReturnValue(of({ ...makeApplication(0), state: 'aprobada' }));

        expect(component.canFinalizeApplication()).toBe(true);

        component.resolveApplication('aprobada');

        expect(api.resolve).toHaveBeenCalledWith('42', { state: 'aprobada' });
        expect(component.application()?.state).toBe('aprobada');
        expect(component.canFinalizeApplication()).toBe(false);
    });

    it('exige un motivo para pedir corrección aunque la solicitud siga pendiente', () => {
        component.providerComment.set('   ');

        component.resolveApplication('documentacion_incompleta');

        expect(api.resolve).not.toHaveBeenCalled();
        expect(component.errorMessage()).toMatch(/motivo/i);
    });

    it('permite pedir corrección con documentos pendientes y envía la nota de resolución', () => {
        component.providerComment.set('  Adjunta un comprobante legible.  ');
        component.documentComment.set('Comentario de un archivo');
        api.resolve.mockReturnValue(
            of({ ...makeApplication(), state: 'documentacion_incompleta' }),
        );

        component.resolveApplication('documentacion_incompleta');

        expect(api.resolve).toHaveBeenCalledWith('42', {
            state: 'documentacion_incompleta',
            comments: 'Adjunta un comprobante legible.',
        });
    });

    it('guarda el comentario del documento por separado y recarga el desglose', () => {
        component.providerComment.set('Nota de resolución');
        component.documentComment.set('  Documento legible.  ');

        component.reviewDocument('aprobado');

        expect(api.reviewDocument).toHaveBeenCalledWith('7', {
            result: 'aprobado',
            comment: 'Documento legible.',
        });
        expect(api.getById).toHaveBeenCalledTimes(2);
        expect(component.documentComment()).toBe('');
        expect(component.providerComment()).toBe('Nota de resolución');
    });

    it('reinicia la comparación manual al seleccionar otro documento', () => {
        component.setComparisonResult('name', 'positive');
        expect(component.comparisonResults().name).toBe('positive');

        component.selectDocument(makeDocument('8'));

        expect(component.comparisonResults()).toEqual({});
    });
});

