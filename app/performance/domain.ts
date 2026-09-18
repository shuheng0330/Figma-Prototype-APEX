import type { OrganisationalRole } from "../auth";

export const PERFORMANCE_TIME_ZONE = "Asia/Kuala_Lumpur";

export type ReviewPeriodStatus = "Draft" | "Upcoming" | "Open" | "Closed";
export type IndividualKpiStatus = "Draft" | "Pending Approval" | "Approved" | "Returned";
export type AssessmentStatus = "Draft" | "Pending Review" | "Reviewed";
export type AppraisalStatus = "Draft" | "Pending Review" | "Returned" | "Approved";
export type ReviewFrequency = "Monthly" | "Quarterly" | "Annually";
export type ConsolidationMethod = "final" | "average";

export interface ReviewPeriodDeadlines {
  kpiSetup: string;
  selfAssessmentDays: number;
  superiorAssessmentDays: number;
  attitudeSelf: string;
  attitudeSuperior: string;
  superiorAppraisal: string;
  hrReview: string;
}

export interface ReviewPeriodAllocations {
  company: number;
  department: number;
  individual: number;
  kpi: number;
  attitude: number;
}

export interface ReviewPeriod {
  id: string;
  name: string;
  configuredStatus: ReviewPeriodStatus;
  startDate: string;
  endDate: string;
  lastUpdated: string;
  deadlines: ReviewPeriodDeadlines;
  allocations: ReviewPeriodAllocations;
  consolidationMethod: ConsolidationMethod;
  roleFrequencies?: Record<string, ReviewFrequency>;
  snapshotCreatedAt?: string;
  snapshot?: {
    createdAt: string;
    deadlines: ReviewPeriodDeadlines;
    allocations: ReviewPeriodAllocations;
    roleFrequencies: Record<string, ReviewFrequency>;
    attitudeConfigurationVersion: string;
  };
}

export function createReviewPeriodSnapshot(period: ReviewPeriod, createdAt: string): NonNullable<ReviewPeriod["snapshot"]> {
  return {
    createdAt,
    deadlines: { ...period.deadlines },
    allocations: { ...period.allocations },
    roleFrequencies: { ...(period.roleFrequencies ?? {}) },
    attitudeConfigurationVersion: "published-master-v1",
  };
}

export interface DomainValidationError {
  code: string;
  message: string;
}

export interface ReviewCheckpoint {
  id: string;
  label: string;
  checkpointDate: string;
  availableFrom: string;
  selfDeadline: string;
  superiorDeadline: string;
}

export interface RequirementGap {
  id: string;
  title: string;
  question: string;
}

export const REQUIREMENT_GAPS: RequirementGap[] = [
  {
    id: "review-period-closure",
    title: "Review Period closure",
    question: "What triggers Open → Closed, and what prerequisites or reopening rules apply?",
  },
  {
    id: "open-kpi-revision",
    title: "Open-period KPI revision",
    question: "Which KPI version applies to existing and future checkpoints, and is recalculation required?",
  },
  {
    id: "role-frequency-defaults",
    title: "Role frequency defaults",
    question: "What is the production source of the default Monthly, Quarterly, and Annual role mappings?",
  },
];

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addCalendarDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

function endOfMonth(year: number, monthIndex: number) {
  return isoDate(new Date(Date.UTC(year, monthIndex + 1, 0)));
}

export function todayInKualaLumpur(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PERFORMANCE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function resolvePeriodStatus(period: ReviewPeriod, effectiveDate: string): ReviewPeriodStatus {
  if (period.configuredStatus === "Draft" || period.configuredStatus === "Closed") return period.configuredStatus;
  if (period.configuredStatus === "Open") return "Open";
  return effectiveDate >= period.startDate ? "Open" : "Upcoming";
}

export function canEditReviewPeriod(status: ReviewPeriodStatus) {
  return status === "Draft" || status === "Upcoming";
}

export function canDeleteReviewPeriod(status: ReviewPeriodStatus) {
  return status === "Draft" || status === "Upcoming";
}

export function validateReviewPeriod(period: ReviewPeriod): DomainValidationError[] {
  const errors: DomainValidationError[] = [];
  if (!period.name.trim()) errors.push({ code: "NAME_REQUIRED", message: "Review Period Name is required." });
  const requiredDeadlines = [
    period.deadlines.kpiSetup,
    period.deadlines.attitudeSelf,
    period.deadlines.attitudeSuperior,
    period.deadlines.superiorAppraisal,
    period.deadlines.hrReview,
  ];
  if (requiredDeadlines.some(value => !value)) {
    errors.push({ code: "DEADLINE_REQUIRED", message: "Every configured deadline is required before publishing." });
  }
  if (!period.startDate || !period.endDate || period.startDate >= period.endDate) {
    errors.push({ code: "INVALID_PERIOD_RANGE", message: "Start Date must be earlier than End Date." });
  }
  if (period.deadlines.kpiSetup > period.startDate) {
    errors.push({ code: "KPI_SETUP_AFTER_START", message: "KPI Setup Deadline must be on or before the Start Date." });
  }
  if (period.deadlines.attitudeSelf < period.startDate) {
    errors.push({ code: "ATTITUDE_BEFORE_AVAILABLE", message: "Attitude Self-Assessment cannot be due before the period opens." });
  }
  if (period.deadlines.attitudeSelf > period.deadlines.attitudeSuperior) {
    errors.push({ code: "ATTITUDE_SEQUENCE", message: "Attitude Self-Assessment Deadline must be on or before the Superior Attitude Evaluation Deadline." });
  }
  if (period.deadlines.superiorAppraisal > period.deadlines.hrReview) {
    errors.push({ code: "APPRAISAL_SEQUENCE", message: "Superior Appraisal Recommendation Deadline must be on or before the HR Review Deadline." });
  }
  if (period.deadlines.superiorAppraisal && period.endDate && period.deadlines.superiorAppraisal < period.endDate) {
    errors.push({ code: "APPRAISAL_BEFORE_AVAILABLE", message: "Superior Recommendation deadline cannot be before the final performance interval ends." });
  }
  if (period.deadlines.selfAssessmentDays < 1 || period.deadlines.superiorAssessmentDays < 1) {
    errors.push({ code: "ASSESSMENT_DAY_RULE", message: "Self and Superior assessment rules must each be at least one Calendar Day." });
  }
  const kpiTotal = period.allocations.company + period.allocations.department + period.allocations.individual;
  if (kpiTotal !== 100) errors.push({ code: "KPI_ALLOCATION_TOTAL", message: `KPI-level allocations total ${kpiTotal}% and must equal 100%.` });
  const finalTotal = period.allocations.kpi + period.allocations.attitude;
  if (finalTotal !== 100) errors.push({ code: "FINAL_ALLOCATION_TOTAL", message: `Final-score allocations total ${finalTotal}% and must equal 100%.` });
  return errors;
}

export function generateCheckpoints(period: ReviewPeriod, frequency: ReviewFrequency): ReviewCheckpoint[] {
  if (!period.startDate || !period.endDate || period.startDate > period.endDate) return [];
  const checkpointDates: string[] = [];
  const start = new Date(`${period.startDate}T00:00:00Z`);
  const end = new Date(`${period.endDate}T00:00:00Z`);

  if (frequency === "Annually") {
    checkpointDates.push(period.endDate);
  } else if (frequency === "Quarterly") {
    for (let year = start.getUTCFullYear(); year <= end.getUTCFullYear(); year += 1) {
      for (const month of [2, 5, 8, 11]) {
        const value = endOfMonth(year, month);
        if (value >= period.startDate && value <= period.endDate) checkpointDates.push(value);
      }
    }
  } else {
    let year = start.getUTCFullYear();
    let month = start.getUTCMonth();
    while (year < end.getUTCFullYear() || (year === end.getUTCFullYear() && month <= end.getUTCMonth())) {
      const value = endOfMonth(year, month);
      if (value >= period.startDate && value <= period.endDate) checkpointDates.push(value);
      month += 1;
      if (month > 11) { month = 0; year += 1; }
    }
  }

  return checkpointDates.map((checkpointDate, index) => {
    const selfDeadline = addCalendarDays(checkpointDate, period.deadlines.selfAssessmentDays);
    return {
      id: `${period.id}-${frequency.toLowerCase()}-${index + 1}`,
      label: frequency === "Monthly"
        ? new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${checkpointDate}T00:00:00Z`))
        : frequency === "Quarterly" ? `Q${Math.floor(new Date(`${checkpointDate}T00:00:00Z`).getUTCMonth() / 3) + 1} ${checkpointDate.slice(0, 4)}`
        : `Annual ${checkpointDate.slice(0, 4)}`,
      checkpointDate,
      availableFrom: addCalendarDays(checkpointDate, 1),
      selfDeadline,
      superiorDeadline: addCalendarDays(selfDeadline, period.deadlines.superiorAssessmentDays),
    };
  });
}

export function isCheckpointAvailable(checkpoint: ReviewCheckpoint, effectiveDate: string) {
  return effectiveDate >= checkpoint.availableFrom;
}

export function isActivityOverdue(deadline: string, completedAt: string | undefined, effectiveDate: string) {
  return completedAt ? completedAt > deadline : effectiveDate > deadline;
}

export function validatePoint(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

const INDIVIDUAL_KPI_TRANSITIONS: Record<IndividualKpiStatus, IndividualKpiStatus[]> = {
  Draft: ["Pending Approval"],
  "Pending Approval": ["Approved", "Returned"],
  Returned: ["Pending Approval"],
  Approved: [],
};

const ASSESSMENT_TRANSITIONS: Record<AssessmentStatus, AssessmentStatus[]> = {
  Draft: ["Pending Review"],
  "Pending Review": ["Reviewed"],
  Reviewed: [],
};

const APPRAISAL_TRANSITIONS: Record<AppraisalStatus, AppraisalStatus[]> = {
  Draft: ["Pending Review"],
  "Pending Review": ["Returned", "Approved"],
  Returned: ["Pending Review"],
  Approved: [],
};

export function canTransitionIndividualKpi(from: IndividualKpiStatus, to: IndividualKpiStatus) {
  return INDIVIDUAL_KPI_TRANSITIONS[from].includes(to);
}

export function canTransitionAssessment(from: AssessmentStatus, to: AssessmentStatus) {
  return ASSESSMENT_TRANSITIONS[from].includes(to);
}

export function canTransitionAppraisal(from: AppraisalStatus, to: AppraisalStatus) {
  return APPRAISAL_TRANSITIONS[from].includes(to);
}

export function calculateAnnualKpiPoint(points: number[], method: ConsolidationMethod) {
  if (!points.length) return null;
  return method === "final" ? points[points.length - 1] : points.reduce((sum, point) => sum + point, 0) / points.length;
}

export function calculateWeightedKpiScore(annualPoint: number, weightage: number) {
  return annualPoint / 5 * weightage;
}

export function calculateKpiPerformanceScore(items: Array<{ annualPoint: number; weightage: number }>) {
  return items.reduce((sum, item) => sum + calculateWeightedKpiScore(item.annualPoint, item.weightage), 0);
}

export function calculateAttitudeScore(superiorPoints: number[]) {
  if (!superiorPoints.length) return null;
  return superiorPoints.reduce((sum, point) => sum + point, 0) / superiorPoints.length / 5 * 100;
}

export function calculateFinalAppraisalScore(kpiScore: number, attitudeScore: number, kpiAllocation: number, attitudeAllocation: number) {
  return kpiScore * (kpiAllocation / 100) + attitudeScore * (attitudeAllocation / 100);
}

export function isReadyForAppraisal(checkpointStatuses: AssessmentStatus[], attitudeStatus: AssessmentStatus) {
  return checkpointStatuses.length > 0 && checkpointStatuses.every(status => status === "Reviewed") && attitudeStatus === "Reviewed";
}

export function selectLatestPeriodWithResults(items: Array<{ periodId: string; hasResults: boolean }>) {
  return [...items]
    .filter(item => item.hasResults)
    .sort((a, b) => Number(b.periodId) - Number(a.periodId))[0]?.periodId ?? null;
}

export type PerformanceCapability =
  | "own-performance" | "own-learning" | "department-kpis" | "team-reviews"
  | "team-performance" | "team-appraisals" | "hr-appraisals" | "organisation-performance"
  | "review-period-admin" | "company-kpi-admin" | "attitude-admin" | "training-admin" | "user-admin";

export const CAPABILITIES_BY_ROLE: Record<OrganisationalRole, PerformanceCapability[]> = {
  employee: ["own-performance", "own-learning"],
  manager_hod: ["own-performance", "own-learning", "department-kpis", "team-reviews", "team-performance", "team-appraisals"],
  hr: ["own-performance", "own-learning", "hr-appraisals", "organisation-performance"],
  super_admin: ["review-period-admin", "company-kpi-admin", "attitude-admin", "organisation-performance", "training-admin", "user-admin"],
  trainer: ["own-learning", "training-admin"],
};

export function hasCapability(role: OrganisationalRole, capability: PerformanceCapability) {
  return CAPABILITIES_BY_ROLE[role].includes(capability);
}
