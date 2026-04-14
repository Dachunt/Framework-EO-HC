import { useState } from 'react';
import { useBank } from '../context/BankContext';
import { validateAccountHolder, validateInitialBalance } from '../utils/validators';

export function AccountForm() {
  const { createAccount, accounts, hasAccount, selectAccount } = useBank();
  const [nombreTitular, setNombreTitular] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

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
      setShowCreateForm(false);
    }
  };

  const handleSelectAccount = (accountId: string) => {
    selectAccount(accountId);
  };

  if (hasAccount) {
    return null;
  }

  if (accounts.length > 0 && !showCreateForm) {
    return (
      <div className="card">
        <h2>Seleccionar Cuenta</h2>
        <p className="info-text">Selecciona una cuenta existente o crea una nueva:</p>
        <div className="account-list">
          {accounts.map((account) => (
            <div key={account.id} className="account-item">
              <div className="account-info">
                <span className="account-name">{account.nombreTitular}</span>
                <span className="account-balance">${account.saldo.toFixed(2)}</span>
              </div>
              <button
                onClick={() => handleSelectAccount(account.id)}
                className="btn btn-primary"
              >
                Seleccionar
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-outline"
          style={{ marginTop: '1rem' }}
        >
          + Crear Nueva Cuenta
        </button>
      </div>
    );
  }

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
        <div className="button-group">
          <button type="submit" className="btn btn-primary">
            Crear Cuenta
          </button>
          {accounts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="btn btn-outline"
            >
              Volver
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
