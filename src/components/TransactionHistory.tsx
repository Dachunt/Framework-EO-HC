import { useBank } from '../context/BankContext';
import { formatDateTime } from '../utils/dateHelpers';
import type { TransactionType } from '../types';

export function TransactionHistory() {
  const { state, hasAccount } = useBank();

  if (!hasAccount) {
    return null;
  }

  const getTransactionIcon = (tipo: TransactionType) => {
    switch (tipo) {
      case 'deposito':
        return '+';
      case 'retiro':
        return '-';
      case 'interes':
        return 'I';
      case 'comision':
        return 'C';
      default:
        return '?';
    }
  };

  const getTransactionClass = (tipo: TransactionType) => {
    switch (tipo) {
      case 'deposito':
        return 'transaction-deposit';
      case 'retiro':
        return 'transaction-withdrawal';
      case 'interes':
        return 'transaction-interest';
      case 'comision':
        return 'transaction-commission';
      default:
        return '';
    }
  };

  const sortedTransactions = [...state.transacciones].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  return (
    <div className="card">
      <h2>Historial de Transacciones</h2>
      {sortedTransactions.length === 0 ? (
        <p className="no-transactions">No hay transacciones registradas</p>
      ) : (
        <div className="transaction-list">
          <div className="transaction-header">
            <span>Fecha</span>
            <span>Tipo</span>
            <span>Monto</span>
            <span>Saldo</span>
            <span>Justificación</span>
          </div>
          {sortedTransactions.map((t) => (
            <div key={t.id} className={`transaction-row ${getTransactionClass(t.tipo)}`}>
              <span>{formatDateTime(new Date(t.fecha))}</span>
              <span className="transaction-type">
                <span className={`type-badge ${t.tipo}`}>{getTransactionIcon(t.tipo)}</span>
                {t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1)}
              </span>
              <span className={`amount ${t.tipo}`}>
                {t.tipo === 'deposito' || t.tipo === 'interes' ? '+' : '-'}${t.monto.toFixed(2)}
              </span>
              <span className="balance">${t.saldoResultado.toFixed(2)}</span>
              <span className="justification">{t.justificacion || '-'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
