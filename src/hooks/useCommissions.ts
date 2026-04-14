import { useMemo } from 'react';
import type { Transaction } from '../types';
import { isSameDay } from '../utils/dateHelpers';

export const COMMISSION_AMOUNT = 1;

export function useCommissions(transacciones: Transaction[], accountId: string | null): number {
  return useMemo(() => {
    if (!accountId) return 0;

    const hoy = new Date();
    const comisionesDelDia = transacciones.filter(
      (t) =>
        t.tipo === 'comision' &&
        t.id.startsWith(accountId) &&
        isSameDay(new Date(t.fecha), hoy)
    );

    return comisionesDelDia.reduce((sum, t) => sum + t.monto, 0);
  }, [transacciones, accountId]);
}
