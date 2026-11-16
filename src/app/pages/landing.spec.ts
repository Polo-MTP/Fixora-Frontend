import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Landing } from './landing';

describe('Landing', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Landing],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    it('muestra el contenido principal de la landing', () => {
        const fixture = TestBed.createComponent(Landing);
        fixture.detectChanges();

        const page = fixture.nativeElement as HTMLElement;

        expect(page.querySelector('h1')?.textContent).toContain('Ayuda de confianza');
        expect(page.querySelector('#servicios')).toBeTruthy();
        expect(page.querySelector('#como-funciona')).toBeTruthy();
        expect(page.querySelectorAll('.service-card')).toHaveLength(4);
        expect(page.querySelectorAll('.step-card')).toHaveLength(3);
    });

    it('dirige los botones para proveedores al registro', () => {
        const fixture = TestBed.createComponent(Landing);
        fixture.detectChanges();

        const page = fixture.nativeElement as HTMLElement;
        const providerLinks = Array.from(page.querySelectorAll('a')).filter(
            (link) => link.getAttribute('href') === '/registro-proveedor',
        );

        expect(providerLinks).toHaveLength(2);
        expect(providerLinks.every((link) => link.textContent?.includes('Quiero ser proveedor')))
            .toBe(true);
    });
});