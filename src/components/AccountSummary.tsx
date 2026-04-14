import { useBank } from '../context/BankContext';
import { formatDate } from '../utils/dateHelpers';

export function AccountSummary() {
  const { state, hasAccount } = useBank();

  if (!hasAccount || !state.cuenta) {
    return null;
  }

  return (
    <div className="card account-summary">
      <h2>Información de la Cuenta</h2>
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">Titular:</span>
          <span className="info-value">{state.cuenta.nombreTitular}</span>
        </div>
        <div className="info-item">
          <span className="info-label">ID Cuenta:</span>
          <span className="info-value id-account">{state.cuenta.id}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Fecha de Creación:</span>
          <span className="info-value">{formatDate(new Date(state.cuenta.fechaCreacion))}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Saldo Actual:</span>
          <span className="info-value balance">${state.cuenta.saldo.toFixed(2)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Total Transacciones:</span>
          <span className="info-value">{state.transacciones.length}</span>
        </div>
      </div>
    </div>
  );
}
