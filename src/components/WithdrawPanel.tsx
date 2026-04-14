import { useState, useEffect } from 'react';
import { useBank } from '../context/BankContext';

const DAILY_LIMIT = 1000;

export function WithdrawPanel() {
  const { withdraw, hasAccount, getDailyWithdrawUsed, getDailyWithdrawCount, state } = useBank();
  const [monto, setMonto] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dailyUsed, setDailyUsed] = useState(0);
  const [withdrawCount, setWithdrawCount] = useState(0);

  useEffect(() => {
    if (hasAccount) {
      setDailyUsed(getDailyWithdrawUsed());
      setWithdrawCount(getDailyWithdrawCount());
    }
  }, [hasAccount, getDailyWithdrawUsed, getDailyWithdrawCount, state.transacciones]);

  if (!hasAccount) {
    return null;
  }

  const availableToday = DAILY_LIMIT - dailyUsed;
  const willHaveCommission = withdrawCount > 0;
  const totalToDeduct = parseFloat(monto) + (willHaveCommission ? 1 : 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum)) {
      setError('El monto debe ser un número válido');
      return;
    }

    const result = withdraw(montoNum);
    if (!result.success) {
      setError(result.error || 'Error al realizar retiro');
    } else {
      const commissionMsg = willHaveCommission ? ' (incluye comisión de $1)' : '';
      setSuccess(`Retiro de $${montoNum.toFixed(2)} realizado exitosamente${commissionMsg}`);
      setMonto('');
      setDailyUsed(getDailyWithdrawUsed());
      setWithdrawCount(getDailyWithdrawCount());
    }
  };

  return (
    <div className="card">
      <h2>Retiro</h2>
      <div className="info-box">
        <p><strong>Límite diario:</strong> ${DAILY_LIMIT.toFixed(2)}</p>
        <p><strong>Usado hoy:</strong> ${dailyUsed.toFixed(2)}</p>
        <p><strong>Disponible hoy:</strong> ${availableToday.toFixed(2)}</p>
        <p><strong>Retiros hoy:</strong> {withdrawCount}</p>
        {willHaveCommission && (
          <p className="warning-text">Nota: A partir del segundo retiro se cobra comisión de $1</p>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="montoRetiro">Monto a Retirar ($)</label>
          <input
            type="number"
            id="montoRetiro"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder={`Máximo: $${availableToday.toFixed(2)}`}
            min="0.01"
            max={availableToday}
            step="0.01"
          />
        </div>
        {parseFloat(monto) > 0 && (
          <div className="info-box">
            <p><strong>Total a deducir:</strong> ${totalToDeduct.toFixed(2)}</p>
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <button type="submit" className="btn btn-danger">
          Retirar
        </button>
      </form>
    </div>
  );
}
