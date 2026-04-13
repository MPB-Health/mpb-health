import {
  format,
  subMonths,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from 'date-fns';

export type ChurnMonthRow = {
  month: string;
  monthKey: string;
  sales: number;
  activations: number;
  cancellations: number;
  netChange: number;
};

export type NextMonthPredictionV23 = {
  nextMonthLabel: string;
  isEnrollmentMonth: boolean;
  scheduledActivationsNextMonth: number;
  predictedCancellations: number;
  predictedBreakdown: {
    ageOut: number;
    transactionDeclined: number;
    other: number;
  };
  transactionDeclinedRatePct: string;
  transactionDeclinedThisYear: number;
  totalCancelledThisYear: number;
  sourceLabel: string;
  avgCancellationsForComparison: number;
  predictedNetNextMonth: number;
  isWinning: boolean;
  scenarios: { best: number; base: number; worst: number };
  confidencePct: number;
  message: string;
};

type PrimaryRow = {
  member_id: string;
  inactive_date?: string | null;
  inactive_reason?: string | null;
  active_date?: string | null;
  is_primary?: boolean | null;
  is_active?: boolean | null;
  dob?: string | null;
};

type PastInactive = { inactive_date?: string | null; inactive_reason?: string | null };

function buildChurnForPrediction60(
  predictivePrimaryMembers: PrimaryRow[],
  pastInactives: PastInactive[],
): ChurnMonthRow[] {
  const PREDICTION_MONTHS = 60;
  const monthsData: { [key: string]: ChurnMonthRow } = {};
  for (let i = PREDICTION_MONTHS - 1; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const monthKey = format(monthDate, 'yyyy-MM');
    monthsData[monthKey] = {
      month: format(monthDate, 'MMM yyyy'),
      monthKey,
      sales: 0,
      activations: 0,
      cancellations: 0,
      netChange: 0,
    };
  }
  predictivePrimaryMembers.forEach((member) => {
    if (member.inactive_date) {
      try {
        const monthKey = format(parseISO(member.inactive_date), 'yyyy-MM');
        if (monthsData[monthKey]) monthsData[monthKey].cancellations++;
      } catch {
        /* skip */
      }
    }
  });
  pastInactives.forEach((pi) => {
    if (!pi.inactive_date) return;
    try {
      const monthKey = format(parseISO(pi.inactive_date), 'yyyy-MM');
      if (monthsData[monthKey]) monthsData[monthKey].cancellations++;
    } catch {
      /* skip */
    }
  });
  return Object.values(monthsData).map((d) => ({
    ...d,
    netChange: d.activations - d.cancellations,
  }));
}

function transactionDeclinedRate(
  predictivePrimaryMembers: PrimaryRow[],
  pastInactives: PastInactive[],
) {
  const isTransactionDeclined = (reason: string) => {
    const r = (reason || '').toLowerCase();
    return (
      (r.includes('transaction') && r.includes('declined')) ||
      (r.includes('payment') && r.includes('declined')) ||
      (r.includes('card') && r.includes('declined')) ||
      r.includes('bank declined')
    );
  };
  const thisYear = new Date().getFullYear();
  const cutoff12 = subMonths(new Date(), 12);
  let totalThisYear = 0;
  let countThisYear = 0;
  let totalLast12 = 0;
  let countLast12 = 0;

  predictivePrimaryMembers.forEach((member) => {
    if (!member.inactive_date) return;
    try {
      const inactiveDate = parseISO(member.inactive_date);
      const declined = isTransactionDeclined((member.inactive_reason || '').trim());
      if (inactiveDate.getFullYear() === thisYear) {
        totalThisYear++;
        if (declined) countThisYear++;
      }
      if (inactiveDate >= cutoff12) {
        totalLast12++;
        if (declined) countLast12++;
      }
    } catch {
      /* skip */
    }
  });

  pastInactives.forEach((pi) => {
    if (!pi.inactive_date) return;
    try {
      const inactiveDate = parseISO(pi.inactive_date);
      const declined = isTransactionDeclined((pi.inactive_reason || '').trim());
      if (inactiveDate.getFullYear() === thisYear) {
        totalThisYear++;
        if (declined) countThisYear++;
      }
      if (inactiveDate >= cutoff12) {
        totalLast12++;
        if (declined) countLast12++;
      }
    } catch {
      /* skip */
    }
  });

  const rate =
    totalThisYear > 0
      ? countThisYear / totalThisYear
      : totalLast12 > 0
        ? countLast12 / totalLast12
        : 0;
  return { rate, totalCancelled: totalThisYear, transactionDeclinedCount: countThisYear };
}

function predictedAgeOutNextMonth(predictivePrimaryMembers: PrimaryRow[]) {
  const birthdayMonth = subMonths(new Date(), -2);
  const targetYear = birthdayMonth.getFullYear();
  const targetMonth = birthdayMonth.getMonth() + 1;
  const birthYear = targetYear - 65;

  return predictivePrimaryMembers.filter((member) => {
    if (!member.is_primary || !member.dob) return false;
    if (!member.is_active) return false;
    try {
      const dobStr = String(member.dob);
      const match = dobStr.match(/^(\d{4})-(\d{2})/);
      if (!match) return false;
      const dobY = parseInt(match[1], 10);
      const dobM = parseInt(match[2], 10);
      return dobY === birthYear && dobM === targetMonth;
    } catch {
      return false;
    }
  }).length;
}

function scheduledActivationsNextMonth(predictivePrimaryMembers: PrimaryRow[]) {
  const nextMonthStart = startOfMonth(subMonths(new Date(), -1));
  const nextMonthEnd = endOfMonth(subMonths(new Date(), -1));
  return predictivePrimaryMembers.filter((member) => {
    if (!member.active_date) return false;
    try {
      const activeDate = parseISO(member.active_date);
      return isWithinInterval(activeDate, { start: nextMonthStart, end: nextMonthEnd });
    } catch {
      return false;
    }
  }).length;
}

function avgCancellationsThisYear(churnForPrediction: ChurnMonthRow[]) {
  const thisYear = new Date().getFullYear();
  const thisYearMonths = churnForPrediction.filter((d) => {
    const [y] = d.monthKey.split('-').map(Number);
    return y === thisYear;
  });
  if (thisYearMonths.length === 0) return null;
  return thisYearMonths.reduce((s, d) => s + d.cancellations, 0) / thisYearMonths.length;
}

/**
 * Same V2.3 median-of-3 model as MembershipSalesAnalyticsBody predictive tab.
 */
export function computeNextMonthPredictionV23(
  predictivePrimaryMembers: PrimaryRow[],
  pastInactives: PastInactive[],
): NextMonthPredictionV23 | null {
  const fullChurn = buildChurnForPrediction60(predictivePrimaryMembers, pastInactives);
  const historicalData = fullChurn.slice(-12);
  if (historicalData.length < 3) return null;

  const transactionDeclinedPrediction = transactionDeclinedRate(
    predictivePrimaryMembers,
    pastInactives,
  );
  const avgCancellationsTY = avgCancellationsThisYear(fullChurn);
  const ageOutListCount = predictedAgeOutNextMonth(predictivePrimaryMembers);
  const activationsNextMonth = scheduledActivationsNextMonth(predictivePrimaryMembers);
  const nextMonthDate = subMonths(new Date(), -1);
  const nextMonthNum = nextMonthDate.getMonth() + 1;

  const getAgeOutForMonthKey = (monthKey: string): number => {
    const [y, m] = monthKey.split('-').map(Number);
    const nextMonthYear = m === 12 ? y + 1 : y;
    const nextMonthMonth = m === 12 ? 1 : m + 1;
    const birthYear = nextMonthYear - 65;
    return predictivePrimaryMembers.filter((member) => {
      if (!member.dob || !member.is_primary) return false;
      try {
        const s = String(member.dob);
        const match = s.match(/^(\d{4})-(\d{2})/);
        return (
          match &&
          parseInt(match[1], 10) === birthYear &&
          parseInt(match[2], 10) === nextMonthMonth
        );
      } catch {
        return false;
      }
    }).length;
  };

  const behavioralByMonth: Record<string, number> = {};
  fullChurn.forEach((d) => {
    const ageOut = getAgeOutForMonthKey(d.monthKey);
    behavioralByMonth[d.monthKey] = Math.max(0, d.cancellations - ageOut);
  });

  const byMonthNum: Record<number, number[]> = {};
  fullChurn.forEach((d) => {
    const [, m] = d.monthKey.split('-').map(Number);
    if (!byMonthNum[m]) byMonthNum[m] = [];
    byMonthNum[m].push(d.cancellations);
  });
  const overallAvg =
    fullChurn.reduce((s, d) => s + d.cancellations, 0) / fullChurn.length || 1;
  const seasonalIndex: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) {
    const vals = byMonthNum[m] || [];
    const monthAvg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 1;
    seasonalIndex[m] = overallAvg > 0 ? monthAvg / overallAvg : 1;
  }
  const idx = seasonalIndex[nextMonthNum] ?? 1;

  const LAMBDA = 0.5;
  const recencyWeights = [0.35, 0.25, 0.18, 0.12, 0.07, 0.03];
  const enrollmentBoostByMonth: Record<number, number> = {
    1: 1.32,
    2: 1.16,
    10: 1.35,
    11: 1.55,
    12: 1.45,
  };
  const enrollmentMonths = [1, 2, 10, 11, 12];
  const seasonalDampenerByMonth: Record<number, number> = { 3: 0.55, 6: 0.92, 9: 0.78 };
  const enrollmentBoost = enrollmentBoostByMonth[nextMonthNum] ?? 1;
  const seasonalDampener = seasonalDampenerByMonth[nextMonthNum] ?? 1;
  const isEnrollmentMonth = enrollmentBoost > 1;

  const avgAllMonths =
    historicalData.reduce((s, d) => s + d.cancellations, 0) / historicalData.length;
  const isPostOEPRecency = nextMonthNum === 3 || nextMonthNum === 4;
  const last18Months = fullChurn.slice(-18);
  const recencyMonths = isPostOEPRecency
    ? last18Months
        .filter((d) => !enrollmentMonths.includes(parseInt(d.monthKey.split('-')[1], 10)))
        .slice(-6)
    : historicalData.slice(-6);
  const last6Months = recencyMonths.length >= 2 ? recencyMonths : historicalData.slice(-6);
  const last24 = fullChurn.slice(-24).map((d) => d.cancellations);
  const sorted = [...last24].sort((a, b) => a - b);
  const cap95 =
    sorted.length > 0
      ? sorted[Math.max(0, Math.min(Math.ceil(0.95 * sorted.length) - 1, sorted.length - 1))]
      : 9999;
  const last6Capped = last6Months.map((d) => Math.min(d.cancellations, cap95));
  const weights = recencyWeights.slice(0, last6Capped.length);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const avgLast6Months =
    last6Capped.length > 0 && weightSum > 0
      ? last6Capped.reduce((s, c, i) => s + c * weights[i], 0) / weightSum
      : avgAllMonths;

  const recencyOrFallback =
    avgLast6Months > 0 ? avgLast6Months : (avgCancellationsTY ?? avgAllMonths);
  const damp = seasonalDampener;

  let sameMonthWeightedSum = 0;
  let sameMonthWeightTotal = 0;
  let sameMoYears = 0;
  for (let y = 1; y <= 5; y++) {
    const key = `${nextMonthDate.getFullYear() - y}-${String(nextMonthNum).padStart(2, '0')}`;
    const val = behavioralByMonth[key] ?? 0;
    if (val > 0) {
      const w = Math.exp(-LAMBDA * y);
      sameMonthWeightedSum += val * w;
      sameMonthWeightTotal += w;
      sameMoYears++;
    }
  }
  const sameMonthLastYear =
    sameMonthWeightTotal > 0 ? sameMonthWeightedSum / sameMonthWeightTotal : null;

  const prior6Months = fullChurn.slice(-12, -6);
  const avgPrior6 =
    prior6Months.length > 0
      ? prior6Months.reduce((s, d) => s + d.cancellations, 0) / prior6Months.length
      : avgLast6Months;
  const growthFactor =
    avgPrior6 > 0 ? Math.max(0.95, Math.min(1.05, avgLast6Months / avgPrior6)) : 1;

  const last3 = fullChurn.slice(-3).reduce((s, d) => s + d.cancellations, 0) / 3;
  const prior3 = fullChurn.slice(-6, -3).reduce((s, d) => s + d.cancellations, 0) / 3;
  const momentum = Math.max(-0.25, Math.min(0.25, prior3 > 0 ? (last3 - prior3) / prior3 : 0));
  const trendFactor = 1 + 0.4 * momentum;

  const recencyForBlend =
    isPostOEPRecency && damp < 1 ? recencyOrFallback * damp : recencyOrFallback;
  const blendDamp = isPostOEPRecency && damp < 1 ? 1 : seasonalDampener;

  let predictedBehavioral: number;
  if (sameMoYears >= 2 && sameMonthLastYear != null && sameMonthLastYear > 0) {
    predictedBehavioral = sameMonthLastYear * 0.6 + recencyForBlend * 0.4;
  } else if (sameMoYears === 1 && sameMonthLastYear != null && sameMonthLastYear > 0) {
    predictedBehavioral = sameMonthLastYear * 0.7 + recencyForBlend * 0.3;
  } else {
    predictedBehavioral = recencyForBlend * 0.8 + overallAvg * idx * 0.2;
  }
  predictedBehavioral *= enrollmentBoost * blendDamp * growthFactor * trendFactor;

  const seasonalNaiveVal =
    (sameMonthWeightTotal > 0 ? sameMonthWeightedSum / sameMonthWeightTotal : recencyOrFallback) *
    enrollmentBoost *
    (isPostOEPRecency && damp < 1 ? 1 : seasonalDampener);

  const recencyOnlyVal = avgLast6Months * enrollmentBoost * seasonalDampener;

  const medianOf3 = (a: number, b: number, c: number) => {
    const s = [a, b, c].sort((x, y) => x - y);
    return s[1];
  };
  const ageOutCount = ageOutListCount;
  const expectedCancellationsBase =
    ageOutCount + Math.round(medianOf3(seasonalNaiveVal, recencyOnlyVal, predictedBehavioral));

  const predictedNetBase = activationsNextMonth - expectedCancellationsBase;
  const isWinning = predictedNetBase >= 0;
  const nextMonthLabel = format(subMonths(new Date(), -1), 'MMM yyyy');

  const thisYearCancellations = fullChurn
    .filter((d) => d.monthKey.startsWith(String(new Date().getFullYear())))
    .map((d) => d.cancellations);
  const meanActuals =
    thisYearCancellations.length >= 2
      ? thisYearCancellations.reduce((a, b) => a + b, 0) / thisYearCancellations.length
      : expectedCancellationsBase;
  let cancelStd =
    thisYearCancellations.length >= 2
      ? Math.sqrt(
          thisYearCancellations.reduce((s, n) => s + Math.pow(n - meanActuals, 2), 0) /
            thisYearCancellations.length,
        )
      : last24.length >= 2
        ? Math.sqrt(
            last24.reduce(
              (s, n) => s + Math.pow(n - last24.reduce((a, b) => a + b, 0) / last24.length, 2),
              0,
            ) / last24.length,
          )
        : 8;
  const bandWidth = Math.min(1.28 * cancelStd, expectedCancellationsBase * 0.25);
  const predictedNetBest =
    activationsNextMonth - Math.max(ageOutCount, expectedCancellationsBase - bandWidth);
  const predictedNetWorst = activationsNextMonth - (expectedCancellationsBase + bandWidth);

  const historicalNets = historicalData.map((d) => d.netChange);
  const avgNet12 = historicalNets.reduce((a, b) => a + b, 0) / historicalNets.length;
  const netVariance =
    historicalNets.reduce((s, n) => s + Math.pow(n - avgNet12, 2), 0) / historicalNets.length;
  const netStdDev = Math.sqrt(netVariance);
  const confidencePct = Math.min(95, Math.max(60, 85 - Math.round(netStdDev / 2)));

  const avgCancel =
    avgCancellationsTY ??
    historicalData.reduce((s, d) => s + d.cancellations, 0) / historicalData.length;

  const boostPct = Math.round((enrollmentBoost - 1) * 100);
  const dampenerPct = seasonalDampener < 1 ? Math.round((1 - seasonalDampener) * 100) : 0;
  let baseDesc = isEnrollmentMonth
    ? sameMonthLastYear != null
      ? `60% same mo (${sameMoYears}y) + 40% recency + ${boostPct}%`
      : `80% recency + 20% seasonal + ${boostPct}%`
    : sameMonthLastYear != null
      ? `60% same mo (${sameMoYears}y) + 40% recency`
      : `80% recency + 20% seasonal (${(idx * 100).toFixed(0)}%)`;
  if (dampenerPct > 0) baseDesc += `, −${dampenerPct}% seasonal`;
  const trendPct = Math.round((trendFactor - 1) * 100);
  const sourceLabel = `Median of 3 (V2.3): ${
    trendFactor !== 1
      ? `${baseDesc}, trend ${trendPct >= 0 ? '+' : ''}${trendPct}%`
      : baseDesc
  }`;

  const predictedCancellationsRounded = expectedCancellationsBase;
  const nonAgeOut = Math.max(0, predictedCancellationsRounded - ageOutCount);
  const predictedTransactionDeclined = Math.round(nonAgeOut * transactionDeclinedPrediction.rate);
  const otherCount = Math.max(0, nonAgeOut - predictedTransactionDeclined);

  return {
    nextMonthLabel,
    isEnrollmentMonth,
    scheduledActivationsNextMonth: activationsNextMonth,
    predictedCancellations: predictedCancellationsRounded,
    predictedBreakdown: {
      ageOut: ageOutCount,
      transactionDeclined: predictedTransactionDeclined,
      other: Math.round(otherCount),
    },
    transactionDeclinedRatePct: (transactionDeclinedPrediction.rate * 100).toFixed(1),
    transactionDeclinedThisYear: transactionDeclinedPrediction.transactionDeclinedCount,
    totalCancelledThisYear: transactionDeclinedPrediction.totalCancelled,
    sourceLabel,
    avgCancellationsForComparison: Math.round(avgCancel),
    predictedNetNextMonth: Math.round(predictedNetBase),
    isWinning,
    scenarios: {
      best: Math.round(predictedNetBest),
      base: Math.round(predictedNetBase),
      worst: Math.round(predictedNetWorst),
    },
    confidencePct,
    message: isWinning
      ? `${activationsNextMonth} scheduled activations vs ${predictedCancellationsRounded} predicted cancellations — on track to gain members.`
      : `${activationsNextMonth} scheduled activations vs ${predictedCancellationsRounded} predicted cancellations — need more scheduled plans to offset churn.`,
  };
}

export function buildMonthlyTrendsLast6(allMembersData: { active_date?: string | null; inactive_date?: string | null }[]) {
  const monthsData: Record<string, { month: string; active: number; inactive: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    const key = format(d, 'yyyy-MM');
    monthsData[key] = { month: format(d, 'MMM yy'), active: 0, inactive: 0 };
  }
  allMembersData.forEach((r) => {
    try {
      if (r.active_date) {
        const k = format(parseISO(r.active_date), 'yyyy-MM');
        if (monthsData[k]) monthsData[k].active++;
      }
      if (r.inactive_date) {
        const k = format(parseISO(r.inactive_date), 'yyyy-MM');
        if (monthsData[k]) monthsData[k].inactive++;
      }
    } catch {
      /* skip */
    }
  });
  return Object.values(monthsData);
}
