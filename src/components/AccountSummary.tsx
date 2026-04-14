import { useBank } from '../context/BankContext';
import { formatDate } from '../utils/dateHelpers';

export function AccountSummary() {
  const { currentAccount, hasAccount, logout, state } = useBank();

  if (!hasAccount || !currentAccount) {
    return null;
  }

  const accountTransactions = state.transacciones.filter(t => t.id.startsWith(currentAccount.id));

  return (
    <div className="card account-summary">
      <div className="account-header">
        <h2>Información de la Cuenta</h2>
        <button onClick={logout} className="btn btn-outline btn-small">
          Cerrar Sesión
        </button>
      </div>
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">Titular:</span>
          <span className="info-value">{currentAccount.nombreTitular}</span>
        </div>
        <div className="info-item">
          <span className="info-label">ID Cuenta:</span>
          <span className="info-value id-account">{currentAccount.id}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Fecha de Creación:</span>
          <span className="info-value">{formatDate(new Date(currentAccount.fechaCreacion))}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Saldo Actual:</span>
          <span className="info-value balance">${currentAccount.saldo.toFixed(2)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Total Transacciones:</span>
          <span className="info-value">{accountTransactions.length}</span>
        </div>
      </div>
    </div>
  );
}
