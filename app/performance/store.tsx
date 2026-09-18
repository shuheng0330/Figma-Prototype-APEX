import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import {
  canDeleteReviewPeriod,
  canEditReviewPeriod,
  createReviewPeriodSnapshot,
  REQUIREMENT_GAPS,
  resolvePeriodStatus,
  selectLatestPeriodWithResults,
  validateReviewPeriod,
  type ReviewPeriod,
  type ReviewPeriodStatus,
} from "./domain";

const STORAGE_KEY = "apex-performance-store-v2";
export const PERFORMANCE_STORE_VERSION = 5;

export type PointMap = Record<string, number | null>;
export type CommentMap = Record<string, string>;
export interface StoredEvidenceFile { name: string; size: string }
export type EvidenceMap = Record<string, StoredEvidenceFile | null>;

export interface KpiAssessmentRecord {
  id: string;
  periodId: string;
  employeeId: string;
  checkpointId: string;
  checkpointLabel: string;
  status: "Draft" | "Pending Review" | "Reviewed";
  selfPoints: PointMap;
  selfComments: CommentMap;
  evidence: EvidenceMap;
  superiorPoints: PointMap;
  superiorComments: CommentMap;
  submittedAt?: string;
  reviewedAt?: string;
  completedLate?: boolean;
}

export interface AttitudeAssessmentRecord {
  id: string;
  periodId: string;
  employeeId: string;
  status: "Draft" | "Pending Review" | "Reviewed";
  selfPoints: PointMap;
  selfComments: CommentMap;
  superiorPoints: PointMap;
  superiorComments: CommentMap;
  submittedAt?: string;
  reviewedAt?: string;
  completedLate?: boolean;
}

export type StoredRecommendation = "Promotion" | "Salary Increment" | "Both" | "No Recommendation";
export interface StoredAppraisal {
  status: "Draft" | "Pending Review" | "Returned" | "Approved";
  readyForAppraisal?: boolean;
  managerDecision: StoredRecommendation | null;
  justification: string;
  hrDecision: StoredRecommendation | null;
  hrApprovalMethod?: "Accepted Superior Recommendation" | "Overridden Recommendation" | null;
  hrOverrideReason: string;
  hrReturnReason: string;
  submittedDate: string;
  finalDate: string;
}

export interface ResultAvailability {
  employee: boolean;
  team: boolean;
  organisation: boolean;
}

export interface PerformanceStoreState {
  version: number;
  effectiveDate: string;
  reviewPeriods: ReviewPeriod[];
  resultsByPeriod: Record<string, ResultAvailability>;
  kpiAssessments: Record<string, KpiAssessmentRecord>;
  attitudeAssessments: Record<string, AttitudeAssessmentRecord>;
  appraisals: Record<string, StoredAppraisal>;
  companyKpisByPeriod: Record<string, any[]>;
  departmentKpisByPeriod: Record<string, any[]>;
  employeeKpiPlansByPeriod: Record<string, any[]>;
  attitudeConfigurations: Record<string, any>;
  resetCounter: number;
}

const commonDeadlines = (year: number) => ({
  kpiSetup: `${year}-01-01`,
  selfAssessmentDays: 5,
  superiorAssessmentDays: 5,
  attitudeSelf: `${year}-12-20`,
  attitudeSuperior: `${year}-12-27`,
  superiorAppraisal: `${year + 1}-01-10`,
  hrReview: `${year + 1}-01-20`,
});

const commonAllocations = { company: 15, department: 25, individual: 60, kpi: 50, attitude: 50 };

const EMPTY_SELF_POINTS = { c1: null, c2: null, c3: null, d1: null, d2: null, i1: null, i2: null };
const EMPTY_SELF_COMMENTS = { c1: "", c2: "", c3: "", d1: "", d2: "", i1: "", i2: "" };
const EMPTY_EVIDENCE = { c1: null, c2: null, c3: null, d1: null, d2: null, i1: null, i2: null };
const JAN_SELF_POINTS = { c1: 4, c2: 3, c3: 4, d1: 3, d2: 4, i1: 3, i2: 2 };
const JAN_SELF_COMMENTS = {
  c1: "Strong start to the year. Company revenue tracking ahead of target.", c2: "", c3: "",
  d1: "Achieved RM 73,200 against the RM 80,000 target.", d2: "", i1: "",
  i2: "Cross-sell at 16% for January. Will focus on product pairing in February.",
};

const ATTITUDE_IDS = ["a1", "a2", "a3", "a4", "a5", "a6"];
const emptyAttitudePoints = () => Object.fromEntries(ATTITUDE_IDS.map(id => [id, null]));
const emptyAttitudeComments = () => Object.fromEntries(ATTITUDE_IDS.map(id => [id, ""]));

function createInitialPerformanceState(): PerformanceStoreState {
  return {
  version: PERFORMANCE_STORE_VERSION,
  effectiveDate: "2027-04-10",
  reviewPeriods: [
    { id: "2028", name: "2028 Annual KPI Review", configuredStatus: "Upcoming", startDate: "2028-01-01", endDate: "2028-12-31", lastUpdated: "2026-09-10", deadlines: commonDeadlines(2028), allocations: commonAllocations, consolidationMethod: "final" },
    { id: "2027", name: "2027 Annual KPI Review", configuredStatus: "Upcoming", startDate: "2027-01-01", endDate: "2027-12-31", lastUpdated: "2026-08-22", deadlines: commonDeadlines(2027), allocations: commonAllocations, consolidationMethod: "final" },
    { id: "2026", name: "2026 Annual KPI Review", configuredStatus: "Closed", startDate: "2026-01-01", endDate: "2026-12-31", lastUpdated: "2026-01-10", deadlines: commonDeadlines(2026), allocations: commonAllocations, consolidationMethod: "final", snapshotCreatedAt: "2026-01-01" },
    { id: "2025", name: "2025 Annual KPI Review", configuredStatus: "Closed", startDate: "2025-01-01", endDate: "2025-12-31", lastUpdated: "2025-12-28", deadlines: commonDeadlines(2025), allocations: commonAllocations, consolidationMethod: "final", snapshotCreatedAt: "2025-01-01" },
  ],
  resultsByPeriod: {
    "2028": { employee: false, team: false, organisation: false },
    "2027": { employee: true, team: true, organisation: true },
    "2026": { employee: true, team: true, organisation: true },
    "2025": { employee: true, team: true, organisation: true },
  },
  kpiAssessments: {
    "2027:amir:jan": {
      id: "2027:amir:jan", periodId: "2027", employeeId: "amir", checkpointId: "jan", checkpointLabel: "January 2027",
      status: "Reviewed", selfPoints: JAN_SELF_POINTS, selfComments: JAN_SELF_COMMENTS,
      evidence: { ...EMPTY_EVIDENCE, d1: { name: "sales-report-jan-2027.pdf", size: "2.4 MB" } },
      superiorPoints: { c1: 4, c2: 3, c3: 4, d1: 3, d2: 4, i1: 3, i2: 2 },
      superiorComments: { ...EMPTY_SELF_COMMENTS }, submittedAt: "2027-02-03", reviewedAt: "2027-02-05",
    },
    "2027:amir:feb": {
      id: "2027:amir:feb", periodId: "2027", employeeId: "amir", checkpointId: "feb", checkpointLabel: "February 2027",
      status: "Draft", selfPoints: { ...EMPTY_SELF_POINTS }, selfComments: { ...EMPTY_SELF_COMMENTS }, evidence: { ...EMPTY_EVIDENCE },
      superiorPoints: { ...EMPTY_SELF_POINTS }, superiorComments: { ...EMPTY_SELF_COMMENTS },
    },
    "2027:amir:mar": {
      id: "2027:amir:mar", periodId: "2027", employeeId: "amir", checkpointId: "mar", checkpointLabel: "March 2027",
      status: "Draft", selfPoints: { ...EMPTY_SELF_POINTS }, selfComments: { ...EMPTY_SELF_COMMENTS }, evidence: { ...EMPTY_EVIDENCE },
      superiorPoints: { ...EMPTY_SELF_POINTS }, superiorComments: { ...EMPTY_SELF_COMMENTS },
    },
  },
  attitudeAssessments: {
    "2027:amir": {
      id: "2027:amir", periodId: "2027", employeeId: "amir", status: "Draft",
      selfPoints: emptyAttitudePoints(), selfComments: emptyAttitudeComments(),
      superiorPoints: emptyAttitudePoints(), superiorComments: emptyAttitudeComments(),
    },
  },
  appraisals: {
    amir: { status: "Draft", readyForAppraisal: true, managerDecision: null, justification: "", hrDecision: null, hrApprovalMethod: null, hrOverrideReason: "", hrReturnReason: "", submittedDate: "", finalDate: "" },
    sarah: { status: "Draft", managerDecision: "Salary Increment", justification: "Sarah has shown consistent improvement.", hrDecision: null, hrApprovalMethod: null, hrOverrideReason: "", hrReturnReason: "", submittedDate: "", finalDate: "" },
    rizal: { status: "Pending Review", managerDecision: "No Recommendation", justification: "A structured development plan is proposed.", hrDecision: null, hrApprovalMethod: null, hrOverrideReason: "", hrReturnReason: "", submittedDate: "15 Aug 2027", finalDate: "" },
    nurul: { status: "Approved", managerDecision: "Promotion", justification: "Consistently exceeds targets.", hrDecision: "Promotion", hrApprovalMethod: "Accepted Superior Recommendation", hrOverrideReason: "", hrReturnReason: "", submittedDate: "10 Aug 2027", finalDate: "20 Aug 2027" },
  },
  companyKpisByPeriod: {},
  departmentKpisByPeriod: {},
  employeeKpiPlansByPeriod: {},
  attitudeConfigurations: {},
  resetCounter: 0,
  };
}

export const INITIAL_PERFORMANCE_STATE: PerformanceStoreState = createInitialPerformanceState();

type Action =
  | { type: "SET_DATE"; date: string }
  | { type: "UPSERT_PERIOD"; period: ReviewPeriod }
  | { type: "PUBLISH_PERIOD"; id: string }
  | { type: "DELETE_PERIOD"; id: string }
  | { type: "UPSERT_KPI_ASSESSMENT"; record: KpiAssessmentRecord }
  | { type: "UPSERT_ATTITUDE_ASSESSMENT"; record: AttitudeAssessmentRecord }
  | { type: "UPDATE_APPRAISAL"; employeeId: string; patch: Partial<StoredAppraisal> }
  | { type: "SET_COMPANY_KPIS"; value: Record<string, any[]> }
  | { type: "SET_DEPARTMENT_KPIS"; value: Record<string, any[]> }
  | { type: "SET_EMPLOYEE_KPI_PLANS"; value: Record<string, any[]> }
  | { type: "SET_ATTITUDE_CONFIGURATIONS"; value: Record<string, any> }
  | { type: "RESET" };

function applyDateTransitions(state: PerformanceStoreState, effectiveDate: string): PerformanceStoreState {
  return {
    ...state,
    effectiveDate,
    reviewPeriods: state.reviewPeriods.map(period => {
      if (period.configuredStatus !== "Upcoming" || effectiveDate < period.startDate) return period;
      return {
        ...period,
        configuredStatus: "Open",
        snapshotCreatedAt: period.snapshotCreatedAt ?? period.startDate,
        snapshot: period.snapshot ?? createReviewPeriodSnapshot(period, period.startDate),
      };
    }),
  };
}

function reducer(state: PerformanceStoreState, action: Action): PerformanceStoreState {
  if (action.type === "RESET") {
    const fresh = createInitialPerformanceState();
    return { ...applyDateTransitions(fresh, fresh.effectiveDate), resetCounter: state.resetCounter + 1 };
  }
  if (action.type === "SET_DATE") return applyDateTransitions(state, action.date);
  if (action.type === "UPSERT_PERIOD") {
    const existing = state.reviewPeriods.find(period => period.id === action.period.id);
    if (existing && !canEditReviewPeriod(resolvePeriodStatus(existing, state.effectiveDate))) return state;
    const exists = Boolean(existing);
    const reviewPeriods = exists
      ? state.reviewPeriods.map(period => period.id === action.period.id ? action.period : period)
      : [action.period, ...state.reviewPeriods];
    return { ...state, reviewPeriods };
  }
  if (action.type === "PUBLISH_PERIOD") {
    return {
      ...state,
      reviewPeriods: state.reviewPeriods.map(period => period.id === action.id && period.configuredStatus === "Draft"
        ? { ...period, configuredStatus: "Upcoming", lastUpdated: state.effectiveDate }
        : period),
    };
  }
  if (action.type === "DELETE_PERIOD") {
    const period = state.reviewPeriods.find(item => item.id === action.id);
    if (!period || !canDeleteReviewPeriod(resolvePeriodStatus(period, state.effectiveDate))) return state;
    const { [action.id]: _removed, ...resultsByPeriod } = state.resultsByPeriod;
    return { ...state, reviewPeriods: state.reviewPeriods.filter(item => item.id !== action.id), resultsByPeriod };
  }
  if (action.type === "UPSERT_KPI_ASSESSMENT") {
    return { ...state, kpiAssessments: { ...state.kpiAssessments, [action.record.id]: action.record } };
  }
  if (action.type === "UPSERT_ATTITUDE_ASSESSMENT") {
    return { ...state, attitudeAssessments: { ...state.attitudeAssessments, [action.record.id]: action.record } };
  }
  if (action.type === "UPDATE_APPRAISAL") {
    const current = state.appraisals[action.employeeId];
    if (!current) return state;
    return { ...state, appraisals: { ...state.appraisals, [action.employeeId]: { ...current, ...action.patch } } };
  }
  if (action.type === "SET_COMPANY_KPIS") return { ...state, companyKpisByPeriod: action.value };
  if (action.type === "SET_DEPARTMENT_KPIS") return { ...state, departmentKpisByPeriod: action.value };
  if (action.type === "SET_EMPLOYEE_KPI_PLANS") return { ...state, employeeKpiPlansByPeriod: action.value };
  if (action.type === "SET_ATTITUDE_CONFIGURATIONS") return { ...state, attitudeConfigurations: action.value };
  return state;
}

function loadInitialState(): PerformanceStoreState {
  if (typeof window === "undefined") return INITIAL_PERFORMANCE_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = createInitialPerformanceState();
      return applyDateTransitions(fresh, fresh.effectiveDate);
    }
    const parsed = JSON.parse(raw) as PerformanceStoreState;
    return parsed.version === PERFORMANCE_STORE_VERSION
      ? applyDateTransitions(parsed, parsed.effectiveDate)
      : applyDateTransitions(createInitialPerformanceState(), INITIAL_PERFORMANCE_STATE.effectiveDate);
  } catch {
    return applyDateTransitions(createInitialPerformanceState(), INITIAL_PERFORMANCE_STATE.effectiveDate);
  }
}

interface PerformanceStoreValue {
  state: PerformanceStoreState;
  periods: Array<ReviewPeriod & { status: ReviewPeriodStatus }>;
  requirementGaps: typeof REQUIREMENT_GAPS;
  setEffectiveDate: (date: string) => void;
  resetDemoData: () => void;
  upsertPeriod: (period: ReviewPeriod) => void;
  publishPeriod: (id: string) => { ok: boolean; errors: ReturnType<typeof validateReviewPeriod> };
  deletePeriod: (id: string) => void;
  upsertKpiAssessment: (record: KpiAssessmentRecord) => void;
  upsertAttitudeAssessment: (record: AttitudeAssessmentRecord) => void;
  updateAppraisal: (employeeId: string, patch: Partial<StoredAppraisal>) => void;
  setCompanyKpisByPeriod: (value: Record<string, any[]>) => void;
  setDepartmentKpisByPeriod: (value: Record<string, any[]>) => void;
  setEmployeeKpiPlansByPeriod: (value: Record<string, any[]>) => void;
  setAttitudeConfigurations: (value: Record<string, any>) => void;
  getPeriod: (id: string) => (ReviewPeriod & { status: ReviewPeriodStatus }) | undefined;
  getConfigurationDefaultPeriodId: () => string | null;
  getDashboardDefaultPeriodId: (scope: keyof ResultAvailability) => string | null;
}

const PerformanceStoreContext = createContext<PerformanceStoreValue | null>(null);

export function PerformanceStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<PerformanceStoreValue>(() => {
    const periods = state.reviewPeriods
      .map(period => ({ ...period, status: resolvePeriodStatus(period, state.effectiveDate) }))
      .sort((a, b) => Number(b.id) - Number(a.id));
    return {
      state,
      periods,
      requirementGaps: REQUIREMENT_GAPS,
      setEffectiveDate: date => dispatch({ type: "SET_DATE", date }),
      resetDemoData: () => {
        Object.keys(window.localStorage).filter(key => key.startsWith("apx3_")).forEach(key => window.localStorage.removeItem(key));
        dispatch({ type: "RESET" });
        window.dispatchEvent(new Event("performanceDemoReset"));
        window.dispatchEvent(new Event("appraisalStatusChange"));
      },
      upsertPeriod: period => dispatch({ type: "UPSERT_PERIOD", period }),
      publishPeriod: id => {
        const period = state.reviewPeriods.find(item => item.id === id);
        const errors = period ? validateReviewPeriod(period) : [{ code: "NOT_FOUND", message: "Review Period not found." }];
        if (!errors.length) dispatch({ type: "PUBLISH_PERIOD", id });
        return { ok: errors.length === 0, errors };
      },
      deletePeriod: id => dispatch({ type: "DELETE_PERIOD", id }),
      upsertKpiAssessment: record => dispatch({ type: "UPSERT_KPI_ASSESSMENT", record }),
      upsertAttitudeAssessment: record => dispatch({ type: "UPSERT_ATTITUDE_ASSESSMENT", record }),
      updateAppraisal: (employeeId, patch) => dispatch({ type: "UPDATE_APPRAISAL", employeeId, patch }),
      setCompanyKpisByPeriod: value => dispatch({ type: "SET_COMPANY_KPIS", value }),
      setDepartmentKpisByPeriod: value => dispatch({ type: "SET_DEPARTMENT_KPIS", value }),
      setEmployeeKpiPlansByPeriod: value => dispatch({ type: "SET_EMPLOYEE_KPI_PLANS", value }),
      setAttitudeConfigurations: value => dispatch({ type: "SET_ATTITUDE_CONFIGURATIONS", value }),
      getPeriod: id => periods.find(period => period.id === id),
      getConfigurationDefaultPeriodId: () => {
        const upcoming = periods.find(period => period.status === "Upcoming");
        return upcoming?.id ?? periods.find(period => period.status === "Open")?.id ?? null;
      },
      getDashboardDefaultPeriodId: scope => selectLatestPeriodWithResults(periods.map(period => ({
        periodId: period.id,
        hasResults: state.resultsByPeriod[period.id]?.[scope] ?? false,
      }))),
    };
  }, [state]);

  return <PerformanceStoreContext.Provider value={value}>{children}</PerformanceStoreContext.Provider>;
}

export function usePerformanceStore() {
  const value = useContext(PerformanceStoreContext);
  if (!value) throw new Error("usePerformanceStore must be used inside PerformanceStoreProvider");
  return value;
}

export function usePeriodAccess(periodId: string | null) {
  const store = usePerformanceStore();
  const period = periodId ? store.getPeriod(periodId) : undefined;
  return {
    period,
    canEdit: period ? canEditReviewPeriod(period.status) : false,
    canDelete: period ? canDeleteReviewPeriod(period.status) : false,
  };
}
