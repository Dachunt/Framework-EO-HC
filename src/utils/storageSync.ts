import type { BankState } from '../types';

const STORAGE_KEY = 'bank_management_state';

export function saveToStorage(state: BankState): void {
  try {
    const serializedState = JSON.stringify(state, (key, value) => {
      if (key === 'fecha' || key === 'fechaCreacion') {
        return value instanceof Date ? value.toISOString() : value;
      }
      return value;
    });
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function loadFromStorage(): BankState | null {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return null;
    }
    const parsed = JSON.parse(serializedState);
    return {
      ...parsed,
      transacciones: parsed.transacciones.map((t: Record<string, unknown>) => ({
        ...t,
        fecha: new Date(t.fecha as string),
      })),
      cuenta: parsed.cuenta
        ? {
            ...parsed.cuenta,
            fechaCreacion: new Date(parsed.cuenta.fechaCreacion as string),
          }
        : null,
    };
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
}

export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}
