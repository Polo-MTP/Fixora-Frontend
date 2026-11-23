import type { BranchLocation } from './branch-map';

export const ADDRESS_FIELDS = [
  { key: 'street', label: 'Calle' },
  { key: 'num_ext', label: 'Número exterior' },
  { key: 'colony', label: 'Colonia' },
  { key: 'municipality', label: 'Municipio' },
  { key: 'state', label: 'Estado' },
  { key: 'postal_code', label: 'Código postal' },
] as const;

type AddressField = (typeof ADDRESS_FIELDS)[number]['key'];

export interface BranchDraft {
  name: string;
  address: Record<AddressField, string>;
  location: BranchLocation | null;
  schedules: {
    day_of_week: number;
    label: string;
    enabled: boolean;
    open_time: string;
    close_time: string;
  }[];
  categories: { category_id: string; base_price: number | null }[];
}

export function createBranchDraft(): BranchDraft {
  return {
    name: '',
    address: { street: '', num_ext: '', colony: '', municipality: '', state: '', postal_code: '' },
    location: null,
    schedules: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(
      (label, day_of_week) => ({
        label,
        day_of_week,
        enabled: false,
        open_time: '09:00',
        close_time: '18:00',
      }),
    ),
    categories: [{ category_id: '', base_price: null }],
  };
}

export function validateBranch(branch: BranchDraft, availableIds: Set<string>): string[] {
  const errors: string[] = [];
  const point = branch.location;
  const schedules = branch.schedules.filter((schedule) => schedule.enabled);
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (!branch.name.trim()) errors.push('Escribe el nombre del local.');
  if (ADDRESS_FIELDS.some(({ key }) => !branch.address[key].trim())) {
    errors.push('Completa todos los campos de dirección.');
  }
  if (
    !point ||
    !Number.isFinite(point.latitude) ||
    !Number.isFinite(point.longitude) ||
    Math.abs(point.latitude) > 90 ||
    Math.abs(point.longitude) > 180
  ) {
    errors.push('Marca la ubicación del local en el mapa.');
  }
  if (
    !schedules.length ||
    schedules.some(({ open_time, close_time }) => !time.test(open_time) || !time.test(close_time) || open_time >= close_time)
  ) {
    errors.push('Agrega al menos un horario válido, con el cierre después de la apertura.');
  }

  const ids = branch.categories.map(({ category_id }) => category_id);
  if (!ids.length || ids.some((id) => !availableIds.has(id)) || new Set(ids).size !== ids.length) {
    errors.push('Selecciona categorías activas y evita repetirlas en el mismo local.');
  }
  if (
    branch.categories.some(({ base_price }) => base_price === null || !Number.isFinite(base_price) || base_price <= 0)
  ) {
    errors.push('Escribe un precio base mayor a cero para cada categoría.');
  }

  return errors;
}

export function toBranchInput(branch: BranchDraft) {
  return {
    name: branch.name.trim(),
    address: {
      street: branch.address.street.trim(),
      num_ext: branch.address.num_ext.trim(),
      colony: branch.address.colony.trim(),
      municipality: branch.address.municipality.trim(),
      state: branch.address.state.trim(),
      postal_code: branch.address.postal_code.trim(),
      country: 'México',
      ...branch.location,
    },
    schedules: branch.schedules
      .filter(({ enabled }) => enabled)
      .map(({ day_of_week, open_time, close_time }) => ({ day_of_week, open_time, close_time })),
    categories: branch.categories.map(({ category_id, base_price }) => ({
      category_id,
      base_price,
    })),
  };
}

