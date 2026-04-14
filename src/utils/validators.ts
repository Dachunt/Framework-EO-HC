export interface ValidationResult {
  isValid: boolean;
  error: string;
}

export function validateAmount(amount: number): ValidationResult {
  if (isNaN(amount)) {
    return { isValid: false, error: 'El monto debe ser un número válido' };
  }
  if (amount <= 0) {
    return { isValid: false, error: 'El monto no puede ser negativo o cero' };
  }
  return { isValid: true, error: '' };
}

export function validateJustification(amount: number, justification: string): ValidationResult {
  if (amount >= 1000 && (!justification || justification.trim() === '')) {
    return { isValid: false, error: 'Los depósitos mayores o iguales a $1000 requieren justificación' };
  }
  return { isValid: true, error: '' };
}

export function validateWithdraw(amount: number, currentBalance: number, dailyLimit: number, dailyUsed: number): ValidationResult {
  if (!validateAmount(amount).isValid) {
    return validateAmount(amount);
  }

  if (amount > currentBalance) {
    return { isValid: false, error: 'No puede retirar más del saldo disponible' };
  }

  const remainingDaily = dailyLimit - dailyUsed;
  if (amount > remainingDaily) {
    return { isValid: false, error: `Límite diario excedido. Disponible hoy: $${remainingDaily.toFixed(2)}` };
  }

  return { isValid: true, error: '' };
}

export function validateAccountHolder(name: string): ValidationResult {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'El nombre del titular es requerido' };
  }
  if (name.trim().length < 2) {
    return { isValid: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }
  return { isValid: true, error: '' };
}

export function validateInitialBalance(balance: number): ValidationResult {
  if (isNaN(balance)) {
    return { isValid: false, error: 'El saldo debe ser un número válido' };
  }
  if (balance < 0) {
    return { isValid: false, error: 'El saldo inicial no puede ser negativo' };
  }
  return { isValid: true, error: '' };
}

export function validateInterestParams(capital: number, rate: number, time: number): ValidationResult {
  if (capital <= 0) {
    return { isValid: false, error: 'El capital debe ser mayor a cero' };
  }
  if (rate < 0) {
    return { isValid: false, error: 'La tasa no puede ser negativa' };
  }
  if (time < 0) {
    return { isValid: false, error: 'El tiempo no puede ser negativo' };
  }
  return { isValid: true, error: '' };
}
