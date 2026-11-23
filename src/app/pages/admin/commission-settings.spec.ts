import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CommissionSettingsPage } from './commission-settings';
import { CommissionApi } from '../../admin/commission-api';

describe('Configuración de comisiones', () => {
  const api = { get: vi.fn(), save: vi.fn() };
  beforeEach(() => {
    api.get
      .mockReset()
      .mockReturnValue(
        of({
          current: { percentage: '10.00', effective_from: null, is_default: true },
          history: [],
        }),
      );
    api.save
      .mockReset()
      .mockReturnValue(
        of({
          id: '1',
          percentage: '0.00',
          effective_from: '2026-11-23T18:00:00Z',
          created_by: '8',
        }),
      );
    TestBed.configureTestingModule({
      imports: [CommissionSettingsPage],
      providers: [provideRouter([]), { provide: CommissionApi, useValue: api }],
    });
  });
  it.each(['50.01', '-1', '1.001', '', '1e1'])('rechaza el valor inválido %s', (value) => {
    const page = TestBed.createComponent(CommissionSettingsPage).componentInstance;
    page.ngOnInit();
    page.percentage = value;
    page.prepare();
    page.save();
    expect(api.save).not.toHaveBeenCalled();
    expect(page.error()).toContain('0 a 50');
  });
  it('admite cero, exige confirmación y usa la vigencia devuelta por el servidor', () => {
    const page = TestBed.createComponent(CommissionSettingsPage).componentInstance;
    page.ngOnInit();
    page.percentage = '0';
    page.prepare();
    expect(api.save).not.toHaveBeenCalled();
    page.save();
    expect(api.save).toHaveBeenCalledWith('0.00');
    expect(page.settings()?.current.effective_from).toBe('2026-11-23T18:00:00Z');
  });
});
