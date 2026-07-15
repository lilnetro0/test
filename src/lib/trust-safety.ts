/** Shared trust & safety constants — keep in sync with Phase 9 migration. */

export const REPORT_REASONS = [
  "abuse",
  "spam",
  "harassment",
  "illegal",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export function isReportReason(value: string): value is ReportReason {
  return (REPORT_REASONS as readonly string[]).includes(value);
}
