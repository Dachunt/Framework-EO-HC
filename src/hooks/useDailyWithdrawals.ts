import { useMemo } from 'react';
import type { Transaction } from '../types';
import { isSameDay } from '../utils/dateHelpers';

interface DailyWithdrawalInfo {
  totalRetirado: number;
  cantidadRetiros: number;
  esPrimerRetiro: boolean;
}

export function useDailyWithdrawals(transacciones: Transaction[], accountId: string | null): DailyWithdrawalInfo {
  return useMemo(() => {
    if (!accountId) {
      return { totalRetirado: 0, cantidadRetiros: 0, esPrimerRetiro: true };
    }

    const hoy = new Date();
    const retirosDelDia = transacciones.filter(
      (t) =>
        t.tipo === 'retiro' &&
        t.id.startsWith(accountId) &&
        isSameDay(new Date(t.fecha), hoy)
    );

    const totalRetirado = retirosDelDia.reduce((sum, t) => sum + t.monto, 0);
    const cantidadRetiros = retirosDelDia.length;

    return {
      totalRetirado,
      cantidadRetiros,
      esPrimerRetiro: cantidadRetiros === 0,
    };
  }, [transacciones, accountId]);
}
