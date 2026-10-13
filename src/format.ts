const inrFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** ₹1,290 / ₹1,50,00,000 */
export const inr = (n: number) => `₹${inrFmt.format(Math.round(n))}`;

/** Probability as a whole percentage: 0.82 → "82%" */
export const pc = (n: number) => `${Math.round(n * 100)}%`;

/** Ratio value already in percent: 1.7 → "1.70%" */
export const pct = (n: number) => `${n.toFixed(2)}%`;

export const hhmm = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

export type RiskLevel = 'High' | 'Medium' | 'Low';

export const riskLevel = (p: number): RiskLevel => (p >= 0.7 ? 'High' : p >= 0.4 ? 'Medium' : 'Low');

/** January impact in points: -0.04 → "-0.04 points" */
export const points = (n: number) => (n === 0 ? '0 points' : `${n > 0 ? '+' : '-'}${Math.abs(n).toFixed(2)} points`);
