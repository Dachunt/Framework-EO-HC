import { BankProvider } from './context/BankContext';
import {
  AccountForm,
  DepositPanel,
  WithdrawPanel,
  AccountSummary,
  InterestCalculator,
  MonthlyStatement,
  TransactionHistory,
} from './components';
import './App.css';

function BankApp() {
  return (
    <div className="app">
      <header className="header">
        <h1>Banco UNICAES</h1>
        <p>Sistema de Gestión de Cuentas Bancarias</p>
      </header>

      <main className="main-content">
        <section className="account-section">
          <AccountForm />
          <AccountSummary />
        </section>

        <section className="operations-section">
          <div className="operations-grid">
            <DepositPanel />
            <WithdrawPanel />
            <InterestCalculator />
          </div>
        </section>

        <section className="reports-section">
          <MonthlyStatement />
          <TransactionHistory />
        </section>
      </main>

      <footer className="footer">
        <p>UNICAES - Aplicación de Framework Empresariales - Laboratorio #2</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BankProvider>
      <BankApp />
    </BankProvider>
  );
}

export default App;
