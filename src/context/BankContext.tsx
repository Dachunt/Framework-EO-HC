import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
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
  | { type: 'SELECT_ACCOUNT'; payload: { accountId: string } }
  | { type: 'LOGOUT' }
  | { type: 'LOAD_STATE'; payload: BankState };

interface BankContextType {
  state: BankState;
  currentAccount: Account | null;
  accounts: Account[];
  createAccount: (nombreTitular: string, saldoInicial: number) => { success: boolean; error?: string };
  deposit: (monto: number, justificacion: string) => { success: boolean; error?: string };
  withdraw: (monto: number) => { success: boolean; error?: string };
  addInterest: (monto: number) => { success: boolean; error?: string };
  selectAccount: (accountId: string) => void;
  logout: () => void;
  getMonthlySummary: (mes: number, anio: number) => MonthlySummary;
  hasAccount: boolean;
  isLoggedIn: boolean;
  getDailyWithdrawUsed: () => number;
  getDailyWithdrawCount: () => number;
  getDailyCommission: () => number;
  getCurrentAccountTransactions: () => Transaction[];
}

const BankContext = createContext<BankContextType | undefined>(undefined);

const initialState: BankState = {
  cuentas: [],
  currentAccountId: null,
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
        cuentas: [...state.cuentas, nuevaCuenta],
        currentAccountId: nuevaCuenta.id,
      };
    }

    case 'DEPOSIT': {
      if (!state.currentAccountId) return state;
      const currentAccount = state.cuentas.find(c => c.id === state.currentAccountId);
      if (!currentAccount) return state;

      const transactionId = `${state.currentAccountId}-${generateUUID()}`;
      const nuevaTransaccion: Transaction = {
        id: transactionId,
        tipo: 'deposito',
        fecha: new Date(),
        monto: action.payload.monto,
        justificacion: action.payload.justificacion,
        comision: 0,
        saldoResultado: currentAccount.saldo + action.payload.monto,
      };
      return {
        ...state,
        cuentas: state.cuentas.map(c =>
          c.id === state.currentAccountId
            ? { ...c, saldo: c.saldo + action.payload.monto }
            : c
        ),
        transacciones: [...state.transacciones, nuevaTransaccion],
      };
    }

    case 'WITHDRAW': {
      if (!state.currentAccountId) return state;
      const currentAccount = state.cuentas.find(c => c.id === state.currentAccountId);
      if (!currentAccount) return state;

      const today = new Date();
      const todayWithdrawals = state.transacciones.filter(
        (t) =>
          t.id.startsWith(state.currentAccountId!) &&
          t.tipo === 'retiro' &&
          t.fecha.getDate() === today.getDate() &&
          t.fecha.getMonth() === today.getMonth() &&
          t.fecha.getFullYear() === today.getFullYear()
      );
      const dailyAmount = todayWithdrawals.reduce((sum, t) => sum + t.monto, 0);
      const isFirstWithdrawal = dailyAmount === 0;
      const comision = isFirstWithdrawal ? 0 : COMMISSION_AMOUNT;
      const totalDeduct = action.payload.monto + comision;

      if (totalDeduct > currentAccount.saldo) return state;
      if (dailyAmount + action.payload.monto > DAILY_WITHDRAW_LIMIT) return state;

      const transactionId = `${state.currentAccountId}-${generateUUID()}`;
      const nuevaTransaccion: Transaction = {
        id: transactionId,
        tipo: 'retiro',
        fecha: new Date(),
        monto: action.payload.monto,
        justificacion: '',
        comision: 0,
        saldoResultado: currentAccount.saldo - totalDeduct,
      };

      let newState = {
        ...state,
        cuentas: state.cuentas.map(c =>
          c.id === state.currentAccountId
            ? { ...c, saldo: c.saldo - totalDeduct }
            : c
        ),
        transacciones: [...state.transacciones, nuevaTransaccion],
      };

      if (comision > 0) {
        const commissionId = `${state.currentAccountId}-${generateUUID()}`;
        const commissionTransaction: Transaction = {
          id: commissionId,
          tipo: 'comision',
          fecha: new Date(),
          monto: comision,
          justificacion: 'Comisión por retiro adicional',
          comision: 0,
          saldoResultado: currentAccount.saldo - totalDeduct,
        };
        newState.transacciones = [...newState.transacciones, commissionTransaction];
      }

      return newState;
    }

    case 'ADD_INTEREST': {
      if (!state.currentAccountId) return state;
      const currentAccount = state.cuentas.find(c => c.id === state.currentAccountId);
      if (!currentAccount) return state;

      const transactionId = `${state.currentAccountId}-${generateUUID()}`;
      const nuevaTransaccion: Transaction = {
        id: transactionId,
        tipo: 'interes',
        fecha: new Date(),
        monto: action.payload.monto,
        justificacion: 'Interés generado',
        comision: 0,
        saldoResultado: currentAccount.saldo + action.payload.monto,
      };
      return {
        ...state,
        cuentas: state.cuentas.map(c =>
          c.id === state.currentAccountId
            ? { ...c, saldo: c.saldo + action.payload.monto }
            : c
        ),
        transacciones: [...state.transacciones, nuevaTransaccion],
      };
    }

    case 'SELECT_ACCOUNT': {
      const accountExists = state.cuentas.some(c => c.id === action.payload.accountId);
      if (!accountExists) return state;
      return {
        ...state,
        currentAccountId: action.payload.accountId,
      };
    }

    case 'LOGOUT':
      return {
        ...state,
        currentAccountId: null,
      };

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
    if (state.cuentas.length > 0 || state.transacciones.length > 0) {
      saveToStorage(state);
    }
  }, [state]);

  const currentAccount = useMemo(() => {
    return state.cuentas.find(c => c.id === state.currentAccountId) || null;
  }, [state.cuentas, state.currentAccountId]);

  const currentAccountTransactions = useMemo(() => {
    if (!state.currentAccountId) return [];
    return state.transacciones.filter(t => t.id.startsWith(state.currentAccountId!));
  }, [state.transacciones, state.currentAccountId]);

  const createAccount = useCallback((nombreTitular: string, saldoInicial: number) => {
    const nombreExistente = state.cuentas.find(
      c => c.nombreTitular.toLowerCase() === nombreTitular.toLowerCase()
    );
    if (nombreExistente) {
      return { success: false, error: 'Ya existe una cuenta con este nombre' };
    }
    dispatch({ type: 'CREATE_ACCOUNT', payload: { nombreTitular, saldoInicial } });
    return { success: true };
  }, [state.cuentas]);

  const deposit = useCallback((monto: number, justificacion: string) => {
    if (!state.currentAccountId) {
      return { success: false, error: 'No hay cuenta seleccionada' };
    }
    if (monto <= 0) {
      return { success: false, error: 'El monto no puede ser negativo o cero' };
    }
    if (monto >= 1000 && (!justificacion || justificacion.trim() === '')) {
      return { success: false, error: 'Los depósitos mayores o iguales a $1000 requieren justificación' };
    }
    dispatch({ type: 'DEPOSIT', payload: { monto, justificacion } });
    return { success: true };
  }, [state.currentAccountId]);

  const withdraw = useCallback((monto: number) => {
    if (!state.currentAccountId) {
      return { success: false, error: 'No hay cuenta seleccionada' };
    }
    if (monto <= 0) {
      return { success: false, error: 'El monto no puede ser negativo o cero' };
    }

    const account = state.cuentas.find(c => c.id === state.currentAccountId);
    if (!account) {
      return { success: false, error: 'Cuenta no encontrada' };
    }
    if (monto > account.saldo) {
      return { success: false, error: 'No puede retirar más del saldo disponible' };
    }

    const today = new Date();
    const todayWithdrawals = state.transacciones.filter(
      (t) =>
        t.id.startsWith(state.currentAccountId!) &&
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
    if (totalDeduct > account.saldo) {
      return { success: false, error: 'Saldo insuficiente incluyendo comisión' };
    }

    dispatch({ type: 'WITHDRAW', payload: { monto } });
    return { success: true };
  }, [state.currentAccountId, state.transacciones, state.cuentas]);

  const addInterest = useCallback((monto: number) => {
    if (!state.currentAccountId) {
      return { success: false, error: 'No hay cuenta seleccionada' };
    }
    if (monto <= 0) {
      return { success: false, error: 'El monto no puede ser negativo o cero' };
    }
    dispatch({ type: 'ADD_INTEREST', payload: { monto } });
    return { success: true };
  }, [state.currentAccountId]);

  const selectAccount = useCallback((accountId: string) => {
    dispatch({ type: 'SELECT_ACCOUNT', payload: { accountId } });
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const getMonthlySummary = useCallback((mes: number, anio: number): MonthlySummary => {
    const transaccionesDelMes = currentAccountTransactions.filter((t) =>
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
      : (currentAccount?.saldo || 0);
    const saldoFinal = sortedTransactions.length > 0
      ? sortedTransactions[sortedTransactions.length - 1].saldoResultado
      : (currentAccount?.saldo || 0);

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
  }, [currentAccountTransactions, currentAccount]);

  const getDailyWithdrawUsed = useCallback((): number => {
    if (!state.currentAccountId) return 0;
    const today = new Date();
    return state.transacciones
      .filter(
        (t) =>
          t.id.startsWith(state.currentAccountId!) &&
          t.tipo === 'retiro' &&
          t.fecha.getDate() === today.getDate() &&
          t.fecha.getMonth() === today.getMonth() &&
          t.fecha.getFullYear() === today.getFullYear()
      )
      .reduce((sum, t) => sum + t.monto, 0);
  }, [state.transacciones, state.currentAccountId]);

  const getDailyWithdrawCount = useCallback((): number => {
    if (!state.currentAccountId) return 0;
    const today = new Date();
    return state.transacciones.filter(
      (t) =>
        t.id.startsWith(state.currentAccountId!) &&
        t.tipo === 'retiro' &&
        t.fecha.getDate() === today.getDate() &&
        t.fecha.getMonth() === today.getMonth() &&
        t.fecha.getFullYear() === today.getFullYear()
    ).length;
  }, [state.transacciones, state.currentAccountId]);

  const getDailyCommission = useCallback((): number => {
    if (!state.currentAccountId) return 0;
    const today = new Date();
    return state.transacciones
      .filter(
        (t) =>
          t.id.startsWith(state.currentAccountId!) &&
          t.tipo === 'comision' &&
          t.fecha.getDate() === today.getDate() &&
          t.fecha.getMonth() === today.getMonth() &&
          t.fecha.getFullYear() === today.getFullYear()
      )
      .reduce((sum, t) => sum + t.monto, 0);
  }, [state.transacciones, state.currentAccountId]);

  const value: BankContextType = {
    state,
    currentAccount,
    accounts: state.cuentas,
    createAccount,
    deposit,
    withdraw,
    addInterest,
    selectAccount,
    logout,
    getMonthlySummary,
    hasAccount: state.currentAccountId !== null,
    isLoggedIn: state.currentAccountId !== null,
    getDailyWithdrawUsed,
    getDailyWithdrawCount,
    getDailyCommission,
    getCurrentAccountTransactions: () => currentAccountTransactions,
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
