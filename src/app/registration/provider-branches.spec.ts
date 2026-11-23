import { describe, expect, it } from 'vitest';

import { createBranchDraft, toBranchInput, validateBranch } from './provider-branches';

const availableIds = new Set(['1', '2']);

function validBranch() {
  const branch = createBranchDraft();

  branch.name = 'Local Centro';
  branch.address = {
    street: 'Calle de prueba',
    num_ext: '12-B',
    colony: 'Centro',
    municipality: 'Torreón',
    state: 'Coahuila',
    postal_code: '27000',
  };
  branch.location = { latitude: 25.5428, longitude: -103.4068 };
  branch.schedules[1].enabled = true;
  branch.schedules[1].open_time = '09:00';
  branch.schedules[1].close_time = '18:00';
  branch.categories = [{ category_id: '1', base_price: 350 }];

  return branch;
}

describe('Locales del registro de proveedor', () => {
  it('acepta un local con dirección, ubicación, horario y categoría válidos', () => {
    expect(validateBranch(validBranch(), availableIds)).toEqual([]);
  });

  it('requiere dirección y un punto en el mapa', () => {
    const branch = validBranch();
    branch.address.street = '';
    branch.location = null;

    const errors = validateBranch(branch, availableIds).join(' ');

    expect(errors).toMatch(/dirección/i);
    expect(errors).toMatch(/mapa/i);
  });

  it('rechaza un horario que cierra antes de abrir', () => {
    const branch = validBranch();
    branch.schedules[1].close_time = '08:00';

    expect(validateBranch(branch, availableIds).join(' ')).toMatch(/horario/i);
  });

  it('rechaza categorías repetidas y precios base de cero', () => {
    const branch = validBranch();
    branch.categories.push({ category_id: '1', base_price: 0 });

    const errors = validateBranch(branch, availableIds).join(' ');

    expect(errors).toMatch(/repetir/i);
    expect(errors).toMatch(/precio base/i);
  });

  it('rechaza una categoría que no está en el catálogo activo', () => {
    const branch = validBranch();
    branch.categories[0].category_id = '99';

    expect(validateBranch(branch, availableIds).join(' ')).toMatch(/categorías activas/i);
  });

  it('prepara las coordenadas, los horarios habilitados y los precios para la API', () => {
    expect(toBranchInput(validBranch())).toEqual({
      name: 'Local Centro',
      address: {
        street: 'Calle de prueba',
        num_ext: '12-B',
        colony: 'Centro',
        municipality: 'Torreón',
        state: 'Coahuila',
        postal_code: '27000',
        country: 'México',
        latitude: 25.5428,
        longitude: -103.4068,
      },
      schedules: [{ day_of_week: 1, open_time: '09:00', close_time: '18:00' }],
      categories: [{ category_id: '1', base_price: 350 }],
    });
  });
});

