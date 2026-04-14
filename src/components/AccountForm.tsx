import { useState } from 'react';
import { useBank } from '../context/BankContext';
import { validateAccountHolder, validateInitialBalance } from '../utils/validators';

export function AccountForm() {
  const { createAccount, hasAccount } = useBank();
  const [nombreTitular, setNombreTitular] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [error, setError] = useState('');

  if (hasAccount) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nameValidation = validateAccountHolder(nombreTitular);
    if (!nameValidation.isValid) {
      setError(nameValidation.error);
      return;
    }

    const balanceNum = parseFloat(saldoInicial);
    const balanceValidation = validateInitialBalance(balanceNum);
    if (!balanceValidation.isValid) {
      setError(balanceValidation.error);
      return;
    }

    const result = createAccount(nombreTitular, balanceNum);
    if (!result.success) {
      setError(result.error || 'Error al crear cuenta');
    } else {
      setNombreTitular('');
      setSaldoInicial('');
    }
  };

  return (
    <div className="card">
      <h2>Crear Cuenta Bancaria</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombreTitular">Nombre del Titular</label>
          <input
            type="text"
            id="nombreTitular"
            value={nombreTitular}
            onChange={(e) => setNombreTitular(e.target.value)}
            placeholder="Ej: Ana Pérez"
          />
        </div>
        <div className="form-group">
          <label htmlFor="saldoInicial">Saldo Inicial ($)</label>
          <input
            type="number"
            id="saldoInicial"
            value={saldoInicial}
            onChange={(e) => setSaldoInicial(e.target.value)}
            placeholder="Ej: 500.00"
            min="0"
            step="0.01"
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="btn btn-primary">
          Crear Cuenta
        </button>
      </form>
    </div>
  );
}
