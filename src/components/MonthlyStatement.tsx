import { useState } from 'react';
import { useBank } from '../context/BankContext';
import { formatDateTime } from '../utils/dateHelpers';
import { getAvailableMonths, getAvailableYears } from '../utils/dateHelpers';
import type { TransactionType } from '../types';

const monthNames = getAvailableMonths();
const years = getAvailableYears();

export function MonthlyStatement() {
  const { hasAccount, getMonthlySummary } = useBank();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDetail, setShowDetail] = useState(false);

  if (!hasAccount) {
    return null;
  }

  const summary = getMonthlySummary(selectedMonth, selectedYear);

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

  const totalMovimientos = summary.totalDepositos + summary.totalRetiros + summary.totalComisiones + summary.totalIntereses;

  return (
    <div className="card">
      <h2>Estado de Cuenta Mensual</h2>
      <div className="filter-row">
        <div className="form-group">
          <label htmlFor="mes">Mes</label>
          <select
            id="mes"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {monthNames.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="anio">Año</label>
          <select
            id="anio"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button onClick={() => setShowDetail(!showDetail)} className="btn btn-outline">
          {showDetail ? 'Ocultar Detalle' : 'Ver Detalle'}
        </button>
      </div>

      <div className="summary-section">
        <h3>Resumen Global - {monthNames[selectedMonth].label} {selectedYear}</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Saldo Inicial del Mes:</span>
            <span className="summary-value">${summary.saldoInicial.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Depósitos:</span>
            <span className="summary-value positive">+${summary.totalDepositos.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Retiros:</span>
            <span className="summary-value negative">-${summary.totalRetiros.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Comisiones:</span>
            <span className="summary-value negative">-${summary.totalComisiones.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Intereses:</span>
            <span className="summary-value positive">+${summary.totalIntereses.toFixed(2)}</span>
          </div>
          <div className="summary-item highlight">
            <span className="summary-label">Saldo Final del Mes:</span>
            <span className="summary-value">${summary.saldoFinal.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Movimientos:</span>
            <span className="summary-value">${totalMovimientos.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {showDetail && (
        <div className="detail-section">
          <h3>Detalle de Transacciones</h3>
          {summary.transacciones.length === 0 ? (
            <p className="no-transactions">No hay transacciones en este período</p>
          ) : (
            <div className="transaction-list">
              <div className="transaction-header">
                <span>Fecha</span>
                <span>Tipo</span>
                <span>Monto</span>
                <span>Saldo</span>
                <span>Justificación</span>
              </div>
              {summary.transacciones.map((t) => (
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
      )}
    </div>
  );
}
