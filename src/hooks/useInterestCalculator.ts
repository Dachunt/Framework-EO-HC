import { useState, useCallback } from 'react';
import { calculateSimpleInterest } from '../utils/interestFormula';
import type { InterestResult } from '../utils/interestFormula';
import { validateInterestParams } from '../utils/validators';

interface UseInterestCalculatorReturn {
  capital: string;
  rate: string;
  time: string;
  result: InterestResult | null;
  error: string;
  setCapital: (value: string) => void;
  setRate: (value: string) => void;
  setTime: (value: string) => void;
  calculate: () => boolean;
  reset: () => void;
}

export function useInterestCalculator(): UseInterestCalculatorReturn {
  const [capital, setCapital] = useState('');
  const [rate, setRate] = useState('');
  const [time, setTime] = useState('');
  const [result, setResult] = useState<InterestResult | null>(null);
  const [error, setError] = useState('');

  const calculate = useCallback((): boolean => {
    const capitalNum = parseFloat(capital);
    const rateNum = parseFloat(rate);
    const timeNum = parseFloat(time);

    const validation = validateInterestParams(capitalNum, rateNum, timeNum);
    if (!validation.isValid) {
      setError(validation.error);
      setResult(null);
      return false;
    }

    setError('');
    const interestResult = calculateSimpleInterest(capitalNum, rateNum, timeNum);
    setResult(interestResult);
    return true;
  }, [capital, rate, time]);

  const reset = useCallback(() => {
    setCapital('');
    setRate('');
    setTime('');
    setResult(null);
    setError('');
  }, []);

  return {
    capital,
    rate,
    time,
    result,
    error,
    setCapital,
    setRate,
    setTime,
    calculate,
    reset,
  };
}
