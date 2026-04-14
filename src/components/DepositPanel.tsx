import { useState } from 'react';
import { useBank } from '../context/BankContext';

export function DepositPanel() {
  const { deposit, hasAccount } = useBank();
  const [monto, setMonto] = useState('');
  const [justificacion, setJustificacion] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!hasAccount) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum)) {
      setError('El monto debe ser un número válido');
      return;
    }

    const result = deposit(montoNum, justificacion);
    if (!result.success) {
      setError(result.error || 'Error al realizar depósito');
    } else {
      setSuccess(`Depósito de $${montoNum.toFixed(2)} realizado exitosamente`);
      setMonto('');
      setJustificacion('');
    }
  };

  const showJustification = parseFloat(monto) >= 1000;

  return (
    <div className="card">
      <h2>Depósito</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="montoDeposito">Monto a Depositar ($)</label>
          <input
            type="number"
            id="montoDeposito"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Ej: 500.00"
            min="0.01"
            step="0.01"
          />
        </div>
        {showJustification && (
          <div className="form-group">
            <label htmlFor="justificacion">Justificación (requerida para montos &gt;= $1000)</label>
            <input
              type="text"
              id="justificacion"
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              placeholder="Ej: Ahorro mensual"
            />
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <button type="submit" className="btn btn-success">
          Depositar
        </button>
      </form>
    </div>
  );
}
