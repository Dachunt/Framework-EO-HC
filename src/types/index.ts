export type TransactionType = 'deposito' | 'retiro' | 'interes' | 'comision';

export interface Transaction {
  id: string;
  tipo: TransactionType;
  fecha: Date;
  monto: number;
  justificacion: string;
  comision: number;
  saldoResultado: number;
}

export interface Account {
  id: string;
  nombreTitular: string;
  saldo: number;
  fechaCreacion: Date;
}

export interface BankState {
  cuenta: Account | null;
  transacciones: Transaction[];
}

export interface MonthlySummary {
  mes: number;
  anio: number;
  totalDepositos: number;
  totalRetiros: number;
  totalComisiones: number;
  totalIntereses: number;
  saldoInicial: number;
  saldoFinal: number;
  transacciones: Transaction[];
}
