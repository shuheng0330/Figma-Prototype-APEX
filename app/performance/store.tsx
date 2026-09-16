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
export const PERFORMANCE_STORE_VERSION = 2;

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

export const INITIAL_PERFORMANCE_STATE: PerformanceStoreState = {
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
};

type Action =
  | { type: "SET_DATE"; date: string }
  | { type: "UPSERT_PERIOD"; period: ReviewPeriod }
  | { type: "PUBLISH_PERIOD"; id: string }
  | { type: "DELETE_PERIOD"; id: string }
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
  if (action.type === "RESET") return applyDateTransitions(INITIAL_PERFORMANCE_STATE, INITIAL_PERFORMANCE_STATE.effectiveDate);
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
  return state;
}

function loadInitialState(): PerformanceStoreState {
  if (typeof window === "undefined") return INITIAL_PERFORMANCE_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return applyDateTransitions(INITIAL_PERFORMANCE_STATE, INITIAL_PERFORMANCE_STATE.effectiveDate);
    const parsed = JSON.parse(raw) as PerformanceStoreState;
    return parsed.version === PERFORMANCE_STORE_VERSION
      ? applyDateTransitions(parsed, parsed.effectiveDate)
      : applyDateTransitions(INITIAL_PERFORMANCE_STATE, INITIAL_PERFORMANCE_STATE.effectiveDate);
  } catch {
    return applyDateTransitions(INITIAL_PERFORMANCE_STATE, INITIAL_PERFORMANCE_STATE.effectiveDate);
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
      resetDemoData: () => dispatch({ type: "RESET" }),
      upsertPeriod: period => dispatch({ type: "UPSERT_PERIOD", period }),
      publishPeriod: id => {
        const period = state.reviewPeriods.find(item => item.id === id);
        const errors = period ? validateReviewPeriod(period) : [{ code: "NOT_FOUND", message: "Review Period not found." }];
        if (!errors.length) dispatch({ type: "PUBLISH_PERIOD", id });
        return { ok: errors.length === 0, errors };
      },
      deletePeriod: id => dispatch({ type: "DELETE_PERIOD", id }),
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
