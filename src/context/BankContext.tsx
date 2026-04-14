import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { BankState, Account, Transaction, MonthlySummary } from '../types';
import { generateUUID } from '../utils/uuid';
import { isSameMonth } from '../utils/dateHelpers';
import { saveToStorage, loadFromStorage } from '../utils/storageSync';

const DAILY_WITHDRAW_LIMIT = 1000;
const COMMISSION_AMOUNT = 1;

type BankAction =
  | { type: 'CREATE_ACCOUNT'; payload: { nombreTitular: string; saldoInicial: number } }
  | { type: 'DEPOSIT'; payload: { monto: number; justificacion: string } }
  | { type: 'WITHDRAW'; payload: { monto: number } }
  | { type: 'ADD_INTEREST'; payload: { monto: number } }
  | { type: 'LOAD_STATE'; payload: BankState };

interface BankContextType {
  state: BankState;
  createAccount: (nombreTitular: string, saldoInicial: number) => { success: boolean; error?: string };
  deposit: (monto: number, justificacion: string) => { success: boolean; error?: string };
  withdraw: (monto: number) => { success: boolean; error?: string };
  addInterest: (monto: number) => { success: boolean; error?: string };
  getMonthlySummary: (mes: number, anio: number) => MonthlySummary;
  hasAccount: boolean;
  getDailyWithdrawUsed: () => number;
  getDailyWithdrawCount: () => number;
  getDailyCommission: () => number;
}

const BankContext = createContext<BankContextType | undefined>(undefined);

const initialState: BankState = {
  cuenta: null,
  transacciones: [],
};

function bankReducer(state: BankState, action: BankAction): BankState {
  switch (action.type) {
    case 'CREATE_ACCOUNT': {
      const nuevaCuenta: Account = {
        id: generateUUID(),
        nombreTitular: action.payload.nombreTitular,
        saldo: action.payload.saldoInicial,
        fechaCreacion: new Date(),
      };
      return {
        ...state,
        cuenta: nuevaCuenta,
      };
    }

    case 'DEPOSIT': {
      if (!state.cuenta) return state;
      const transactionId = `${state.cuenta.id}-${generateUUID()}`;
      const nuevaTransaccion: Transaction = {
        id: transactionId,
        tipo: 'deposito',
        fecha: new Date(),
        monto: action.payload.monto,
        justificacion: action.payload.justificacion,
        comision: 0,
        saldoResultado: state.cuenta.saldo + action.payload.monto,
      };
      return {
        ...state,
        cuenta: {
          ...state.cuenta,
          saldo: state.cuenta.saldo + action.payload.monto,
        },
        transacciones: [...state.transacciones, nuevaTransaccion],
      };
    }

    case 'WITHDRAW': {
      if (!state.cuenta) return state;
      const today = new Date();
      const todayWithdrawals = state.transacciones.filter(
        (t) =>
          t.tipo === 'retiro' &&
          isSameMonth(new Date(t.fecha), today.getMonth(), today.getFullYear()) &&
          t.fecha.getDate() === today.getDate()
      );
      const dailyAmount = todayWithdrawals.reduce((sum, t) => sum + t.monto, 0);
      const isFirstWithdrawal = dailyAmount === 0;
      const comision = isFirstWithdrawal ? 0 : COMMISSION_AMOUNT;
      const totalDeduct = action.payload.monto + comision;

      if (totalDeduct > state.cuenta.saldo) return state;
      if (dailyAmount + action.payload.monto > DAILY_WITHDRAW_LIMIT) return state;

      const transactionId = `${state.cuenta.id}-${generateUUID()}`;
      const nuevaTransaccion: Transaction = {
        id: transactionId,
        tipo: 'retiro',
        fecha: new Date(),
        monto: action.payload.monto,
        justificacion: '',
        comision: 0,
        saldoResultado: state.cuenta.saldo - totalDeduct,
      };

      let newState = {
        ...state,
        cuenta: {
          ...state.cuenta,
          saldo: state.cuenta.saldo - totalDeduct,
        },
        transacciones: [...state.transacciones, nuevaTransaccion],
      };

      if (comision > 0) {
        const commissionId = `${state.cuenta.id}-${generateUUID()}`;
        const commissionTransaction: Transaction = {
          id: commissionId,
          tipo: 'comision',
          fecha: new Date(),
          monto: comision,
          justificacion: 'Comisión por retiro adicional',
          comision: 0,
          saldoResultado: state.cuenta.saldo - totalDeduct,
        };
        newState.transacciones = [...newState.transacciones, commissionTransaction];
      }

      return newState;
    }

    case 'ADD_INTEREST': {
      if (!state.cuenta) return state;
      const transactionId = `${state.cuenta.id}-${generateUUID()}`;
      const nuevaTransaccion: Transaction = {
        id: transactionId,
        tipo: 'interes',
        fecha: new Date(),
        monto: action.payload.monto,
        justificacion: 'Interés generado',
        comision: 0,
        saldoResultado: state.cuenta.saldo + action.payload.monto,
      };
      return {
        ...state,
        cuenta: {
          ...state.cuenta,
          saldo: state.cuenta.saldo + action.payload.monto,
        },
        transacciones: [...state.transacciones, nuevaTransaccion],
      };
    }

    case 'LOAD_STATE':
      return action.payload;

    default:
      return state;
  }
}

export function BankProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(bankReducer, initialState);

  useEffect(() => {
    const savedState = loadFromStorage();
    if (savedState) {
      dispatch({ type: 'LOAD_STATE', payload: savedState });
    }
  }, []);

  useEffect(() => {
    if (state.cuenta || state.transacciones.length > 0) {
      saveToStorage(state);
    }
  }, [state]);

  const createAccount = useCallback((nombreTitular: string, saldoInicial: number) => {
    if (state.cuenta) {
      return { success: false, error: 'Ya existe una cuenta creada' };
    }
    dispatch({ type: 'CREATE_ACCOUNT', payload: { nombreTitular, saldoInicial } });
    return { success: true };
  }, [state.cuenta]);

  const deposit = useCallback((monto: number, justificacion: string) => {
    if (!state.cuenta) {
      return { success: false, error: 'No hay cuenta creada' };
    }
    if (monto <= 0) {
      return { success: false, error: 'El monto no puede ser negativo o cero' };
    }
    if (monto >= 1000 && (!justificacion || justificacion.trim() === '')) {
      return { success: false, error: 'Los depósitos mayores o iguales a $1000 requieren justificación' };
    }
    dispatch({ type: 'DEPOSIT', payload: { monto, justificacion } });
    return { success: true };
  }, [state.cuenta]);

  const withdraw = useCallback((monto: number) => {
    if (!state.cuenta) {
      return { success: false, error: 'No hay cuenta creada' };
    }
    if (monto <= 0) {
      return { success: false, error: 'El monto no puede ser negativo o cero' };
    }
    if (monto > state.cuenta.saldo) {
      return { success: false, error: 'No puede retirar más del saldo disponible' };
    }

    const today = new Date();
    const todayWithdrawals = state.transacciones.filter(
      (t) =>
        t.tipo === 'retiro' &&
        t.fecha.getDate() === today.getDate() &&
        t.fecha.getMonth() === today.getMonth() &&
        t.fecha.getFullYear() === today.getFullYear()
    );
    const dailyAmount = todayWithdrawals.reduce((sum, t) => sum + t.monto, 0);
    if (dailyAmount + monto > DAILY_WITHDRAW_LIMIT) {
      return { success: false, error: `Límite diario de retiro excedido. Disponible hoy: $${(DAILY_WITHDRAW_LIMIT - dailyAmount).toFixed(2)}` };
    }

    const isFirstWithdrawal = dailyAmount === 0;
    const comision = isFirstWithdrawal ? 0 : COMMISSION_AMOUNT;
    const totalDeduct = monto + comision;
    if (totalDeduct > state.cuenta.saldo) {
      return { success: false, error: 'Saldo insuficiente incluyendo comisión' };
    }

    dispatch({ type: 'WITHDRAW', payload: { monto } });
    return { success: true };
  }, [state.cuenta, state.transacciones]);

  const addInterest = useCallback((monto: number) => {
    if (!state.cuenta) {
      return { success: false, error: 'No hay cuenta creada' };
    }
    if (monto <= 0) {
      return { success: false, error: 'El monto no puede ser negativo o cero' };
    }
    dispatch({ type: 'ADD_INTEREST', payload: { monto } });
    return { success: true };
  }, [state.cuenta]);

  const getMonthlySummary = useCallback((mes: number, anio: number): MonthlySummary => {
    const transaccionesDelMes = state.transacciones.filter((t) =>
      isSameMonth(new Date(t.fecha), mes, anio)
    );

    const totalDepositos = transaccionesDelMes
      .filter((t) => t.tipo === 'deposito')
      .reduce((sum, t) => sum + t.monto, 0);

    const totalRetiros = transaccionesDelMes
      .filter((t) => t.tipo === 'retiro')
      .reduce((sum, t) => sum + t.monto, 0);

    const totalComisiones = transaccionesDelMes
      .filter((t) => t.tipo === 'comision')
      .reduce((sum, t) => sum + t.monto, 0);

    const totalIntereses = transaccionesDelMes
      .filter((t) => t.tipo === 'interes')
      .reduce((sum, t) => sum + t.monto, 0);

    const sortedTransactions = [...transaccionesDelMes].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
    const saldoInicial = sortedTransactions.length > 0
      ? sortedTransactions[0].saldoResultado - sortedTransactions[0].monto
      : (state.cuenta?.saldo || 0);
    const saldoFinal = sortedTransactions.length > 0
      ? sortedTransactions[sortedTransactions.length - 1].saldoResultado
      : (state.cuenta?.saldo || 0);

    return {
      mes,
      anio,
      totalDepositos,
      totalRetiros,
      totalComisiones,
      totalIntereses,
      saldoInicial,
      saldoFinal,
      transacciones: sortedTransactions,
    };
  }, [state.transacciones, state.cuenta]);

  const getDailyWithdrawUsed = useCallback((): number => {
    if (!state.cuenta) return 0;
    const today = new Date();
    return state.transacciones
      .filter(
        (t) =>
          t.tipo === 'retiro' &&
          t.fecha.getDate() === today.getDate() &&
          t.fecha.getMonth() === today.getMonth() &&
          t.fecha.getFullYear() === today.getFullYear()
      )
      .reduce((sum, t) => sum + t.monto, 0);
  }, [state.transacciones, state.cuenta]);

  const getDailyWithdrawCount = useCallback((): number => {
    if (!state.cuenta) return 0;
    const today = new Date();
    return state.transacciones.filter(
      (t) =>
        t.tipo === 'retiro' &&
        t.fecha.getDate() === today.getDate() &&
        t.fecha.getMonth() === today.getMonth() &&
        t.fecha.getFullYear() === today.getFullYear()
    ).length;
  }, [state.transacciones, state.cuenta]);

  const getDailyCommission = useCallback((): number => {
    if (!state.cuenta) return 0;
    const today = new Date();
    return state.transacciones
      .filter(
        (t) =>
          t.tipo === 'comision' &&
          t.fecha.getDate() === today.getDate() &&
          t.fecha.getMonth() === today.getMonth() &&
          t.fecha.getFullYear() === today.getFullYear()
      )
      .reduce((sum, t) => sum + t.monto, 0);
  }, [state.transacciones, state.cuenta]);

  const value: BankContextType = {
    state,
    createAccount,
    deposit,
    withdraw,
    addInterest,
    getMonthlySummary,
    hasAccount: state.cuenta !== null,
    getDailyWithdrawUsed,
    getDailyWithdrawCount,
    getDailyCommission,
  };

  return <BankContext.Provider value={value}>{children}</BankContext.Provider>;
}

export function useBank(): BankContextType {
  const context = useContext(BankContext);
  if (context === undefined) {
    throw new Error('useBank must be used within a BankProvider');
  }
  return context;
}
