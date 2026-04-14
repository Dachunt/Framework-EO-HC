import { useInterestCalculator } from '../hooks/useInterestCalculator';
import { useBank } from '../context/BankContext';

export function InterestCalculator() {
  const { hasAccount, addInterest } = useBank();
  const { capital, rate, time, result, error, setCapital, setRate, setTime, calculate, reset } =
    useInterestCalculator();

  if (!hasAccount) {
    return null;
  }

  const handleCalculate = () => {
    calculate();
  };

  const handleApplyInterest = () => {
    if (result && result.interes > 0) {
      addInterest(result.interes);
      reset();
    }
  };

  return (
    <div className="card">
      <h2>Calculadora de Interés Simple</h2>
      <p className="formula">Fórmula: I = C × r × t</p>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="capital">Capital (C) ($)</label>
          <input
            type="number"
            id="capital"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
            placeholder="Ej: 1000"
            min="0.01"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label htmlFor="rate">Tasa Anual (r) (%)</label>
          <input
            type="number"
            id="rate"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="Ej: 5"
            min="0"
            step="0.1"
          />
        </div>
        <div className="form-group">
          <label htmlFor="time">Tiempo (t) (años)</label>
          <input
            type="number"
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="Ej: 2"
            min="0"
            step="0.1"
          />
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="button-row">
        <button onClick={handleCalculate} className="btn btn-secondary">
          Calcular
        </button>
        <button onClick={reset} className="btn btn-outline">
          Limpiar
        </button>
      </div>
      {result && (
        <div className="result-box">
          <h3>Resultado</h3>
          <p>
            <strong>Interés generado:</strong> ${result.interes.toFixed(2)}
          </p>
          <p>
            <strong>Monto final:</strong> ${result.capitalFinal.toFixed(2)}
          </p>
          <button onClick={handleApplyInterest} className="btn btn-success">
            Aplicar Interés a Cuenta
          </button>
        </div>
      )}
    </div>
  );
}
