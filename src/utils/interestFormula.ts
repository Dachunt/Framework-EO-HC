export interface InterestResult {
  interes: number;
  capitalFinal: number;
}

export function calculateSimpleInterest(capital: number, annualRate: number, years: number): InterestResult {
  const interes = capital * (annualRate / 100) * years;
  return {
    interes: Math.round(interes * 100) / 100,
    capitalFinal: Math.round((capital + interes) * 100) / 100,
  };
}
