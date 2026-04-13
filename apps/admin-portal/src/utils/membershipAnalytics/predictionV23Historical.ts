import { format, parseISO, startOfDay, endOfMonth } from 'date-fns';

export type PredictionBacktestRow = {
  monthKey: string;
  monthLabel: string;
  actual: number;
  predicted: number;
  error: number;
  pctError: number | null;
  within20: boolean;
};

/**
 * Completed months in `year` before `now`: compare actual cancellations to a
 * simple recency forecast (weighted mean of the prior 6 months, same spirit as
 * the V2.3 recency leg — full median-of-3 replay per month would duplicate the
 * entire client-side model).
 */
export function computeYearToDatePredictionVsActual(
  year: number,
  now: Date,
  monthlyChurn: { monthKey: string; cancellations: number }[],
  _predictivePrimaryMembers: unknown[],
): PredictionBacktestRow[] {
  const today = startOfDay(now);
  const sorted = [...monthlyChurn].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  const rows: PredictionBacktestRow[] = [];

  const weights = [0.35, 0.25, 0.18, 0.12, 0.07, 0.03];

  for (const row of sorted) {
    const [y, m] = row.monthKey.split('-').map(Number);
    if (y !== year) continue;
    const monthEnd = endOfMonth(new Date(y, m - 1, 1));
    if (monthEnd >= today) continue;

    const prior = sorted.filter((x) => x.monthKey < row.monthKey);
    const last6 = prior.slice(-6);
    if (last6.length === 0) continue;

    const w = weights.slice(-last6.length);
    const sumW = w.reduce((a, b) => a + b, 0);
    const predicted = Math.round(
      last6.reduce((s, x, i) => s + x.cancellations * w[i], 0) / sumW,
    );

    const actual = row.cancellations;
    const error = predicted - actual;
    const pctError = actual > 0 ? (error / actual) * 100 : null;
    rows.push({
      monthKey: row.monthKey,
      monthLabel: format(parseISO(`${row.monthKey}-01`), 'MMM yyyy'),
      actual,
      predicted,
      error,
      pctError,
      within20: pctError != null && Math.abs(pctError) <= 20,
    });
  }

  return rows;
}
