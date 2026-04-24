/**
 * Monthly rates use a single age band. Per product rules, that band is driven by
 * the oldest age among all covered members (primary, spouse, and dependents).
 */
export function getHouseholdPricingAge(input: {
  primaryAge: number;
  spouseAge?: number | null;
  oldestDependentAge?: number | null;
  dependentsCount?: number;
}): number {
  const ages: number[] = [input.primaryAge];
  if (input.spouseAge != null && !Number.isNaN(Number(input.spouseAge))) {
    ages.push(input.spouseAge);
  }
  const depN = input.dependentsCount ?? 0;
  if (depN > 0 && input.oldestDependentAge != null && !Number.isNaN(Number(input.oldestDependentAge))) {
    ages.push(input.oldestDependentAge);
  }
  return Math.max(...ages);
}
