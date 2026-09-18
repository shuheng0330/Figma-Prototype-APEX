import {
  canTransitionAppraisal,
  canTransitionIndividualKpi,
  isActivityOverdue,
  isReadyForAppraisal,
  validatePoint,
  type AppraisalStatus,
  type AssessmentStatus,
  type IndividualKpiStatus,
  type ReviewPeriodStatus,
} from "./domain";

type Recommendation = "Promotion" | "Salary Increment" | "Both" | "No Recommendation";
type CheckpointId = "jan" | "feb" | "mar";

interface ScenarioState {
  periods: Record<"2027" | "2028", { status: ReviewPeriodStatus; hasResults: boolean }>;
  individualKpi: {
    status: IndividualKpiStatus;
    version: number;
    versions: Array<{ version: number; reason?: string }>;
    revisionReason?: string;
  };
  checkpoints: Record<CheckpointId, { status: AssessmentStatus; deadline: string; completedAt?: string; point?: number; overdue: boolean }>;
  attitude: { status: AssessmentStatus; superiorPoints: number[] };
  readyForAppraisal: boolean;
  appraisal: {
    status: AppraisalStatus;
    superiorRecommendation: Recommendation | null;
    hrFinalDecision: Recommendation | null;
    approvalMethod: "Accepted Superior Recommendation" | "Overridden Recommendation" | null;
    overrideReason?: string;
    returnReason?: string;
    finalScore: number;
    locked: boolean;
  };
  requirementGaps: string[];
  dashboardDefaultPeriod: "2027" | "2028" | null;
}

export type ScenarioEvent =
  | { type: "publish-period"; periodId: "2027" | "2028" }
  | { type: "open-period"; periodId: "2027" | "2028" }
  | { type: "submit-individual-kpi" }
  | { type: "return-individual-kpi"; reason: string }
  | { type: "resubmit-individual-kpi" }
  | { type: "approve-individual-kpi" }
  | { type: "revise-approved-kpi"; reason: string }
  | { type: "mark-checkpoint-overdue"; checkpointId: CheckpointId }
  | { type: "complete-checkpoint"; checkpointId: CheckpointId; completedAt: string; point: number }
  | { type: "complete-attitude"; superiorPoints: number[] }
  | { type: "submit-appraisal"; recommendation: Recommendation }
  | { type: "return-appraisal"; reason: string }
  | { type: "resubmit-appraisal" }
  | { type: "approve-appraisal" }
  | { type: "override-appraisal"; decision: Recommendation; reason: string };

function derive(state: ScenarioState): ScenarioState {
  const readyForAppraisal = isReadyForAppraisal(
    Object.values(state.checkpoints).map(checkpoint => checkpoint.status),
    state.attitude.status,
  );
  const dashboardDefaultPeriod = state.periods["2028"].hasResults ? "2028"
    : state.periods["2027"].hasResults ? "2027" : null;
  return { ...state, readyForAppraisal, dashboardDefaultPeriod };
}

export function createScenarioState(options: { ready?: boolean; finalScore?: number } = {}): ScenarioState {
  const checkpointStatus: AssessmentStatus = options.ready ? "Reviewed" : "Draft";
  return derive({
    periods: {
      "2027": { status: "Draft", hasResults: Boolean(options.ready) },
      "2028": { status: "Upcoming", hasResults: false },
    },
    individualKpi: { status: "Draft", version: 1, versions: [{ version: 1 }] },
    checkpoints: {
      jan: { status: checkpointStatus, deadline: "2027-02-05", overdue: false },
      feb: { status: checkpointStatus, deadline: "2027-03-05", overdue: false },
      mar: { status: checkpointStatus, deadline: "2027-04-05", overdue: false },
    },
    attitude: { status: options.ready ? "Reviewed" : "Draft", superiorPoints: options.ready ? [4, 4, 5, 3] : [] },
    readyForAppraisal: false,
    appraisal: {
      status: "Draft",
      superiorRecommendation: null,
      hrFinalDecision: null,
      approvalMethod: null,
      finalScore: options.finalScore ?? 80.2,
      locked: false,
    },
    requirementGaps: ["review-period-closure", "working-days", "role-frequency-defaults"],
    dashboardDefaultPeriod: null,
  });
}

export function applyScenarioEvent(state: ScenarioState, event: ScenarioEvent): ScenarioState {
  if (state.appraisal.locked && (event.type === "approve-appraisal" || event.type === "override-appraisal" || event.type === "return-appraisal")) {
    throw new Error("Approved appraisals are locked.");
  }

  if (event.type === "publish-period") {
    if (state.periods[event.periodId].status !== "Draft") return state;
    return derive({ ...state, periods: { ...state.periods, [event.periodId]: { ...state.periods[event.periodId], status: "Upcoming" } } });
  }
  if (event.type === "open-period") {
    return derive({ ...state, periods: { ...state.periods, [event.periodId]: { ...state.periods[event.periodId], status: "Open" } } });
  }

  const moveKpi = (status: IndividualKpiStatus) => {
    if (!canTransitionIndividualKpi(state.individualKpi.status, status)) throw new Error("Invalid Individual KPI transition.");
    return derive({ ...state, individualKpi: { ...state.individualKpi, status } });
  };
  if (event.type === "submit-individual-kpi" || event.type === "resubmit-individual-kpi") return moveKpi("Pending Approval");
  if (event.type === "return-individual-kpi") return derive({ ...moveKpi("Returned"), individualKpi: { ...state.individualKpi, status: "Returned", revisionReason: event.reason } });
  if (event.type === "approve-individual-kpi") return moveKpi("Approved");
  if (event.type === "revise-approved-kpi") {
    if (state.individualKpi.status !== "Approved" || !event.reason.trim()) throw new Error("Only an Approved KPI can be revised with a reason.");
    const version = state.individualKpi.version + 1;
    return derive({
      ...state,
      individualKpi: {
        ...state.individualKpi,
        status: "Pending Approval",
        version,
        revisionReason: event.reason,
        versions: [...state.individualKpi.versions, { version, reason: event.reason }],
      },
      requirementGaps: state.requirementGaps.includes("open-kpi-revision") ? state.requirementGaps : [...state.requirementGaps, "open-kpi-revision"],
    });
  }
  if (event.type === "mark-checkpoint-overdue") {
    return derive({ ...state, checkpoints: { ...state.checkpoints, [event.checkpointId]: { ...state.checkpoints[event.checkpointId], overdue: true } } });
  }
  if (event.type === "complete-checkpoint") {
    if (!validatePoint(event.point)) throw new Error("Assessment Point must be an integer from 1 to 5.");
    const current = state.checkpoints[event.checkpointId];
    const checkpoints = {
      ...state.checkpoints,
      [event.checkpointId]: {
        ...current,
        status: "Reviewed" as const,
        point: event.point,
        completedAt: event.completedAt,
        overdue: current.overdue || isActivityOverdue(current.deadline, event.completedAt, event.completedAt),
      },
    };
    return derive({ ...state, checkpoints, periods: { ...state.periods, "2027": { ...state.periods["2027"], hasResults: true } } });
  }
  if (event.type === "complete-attitude") {
    if (!event.superiorPoints.length || event.superiorPoints.some(point => !validatePoint(point))) throw new Error("Every active Attitude criterion requires a Superior Point from 1 to 5.");
    return derive({ ...state, attitude: { status: "Reviewed", superiorPoints: event.superiorPoints } });
  }

  const moveAppraisal = (status: AppraisalStatus, patch: Partial<ScenarioState["appraisal"]> = {}) => {
    if (!canTransitionAppraisal(state.appraisal.status, status)) throw new Error("Invalid appraisal transition.");
    return derive({ ...state, appraisal: { ...state.appraisal, ...patch, status } });
  };
  if (event.type === "submit-appraisal") {
    if (!state.readyForAppraisal) throw new Error("The employee is not Ready for Appraisal.");
    return moveAppraisal("Pending Review", { superiorRecommendation: event.recommendation, returnReason: undefined });
  }
  if (event.type === "return-appraisal") return moveAppraisal("Returned", { returnReason: event.reason });
  if (event.type === "resubmit-appraisal") return moveAppraisal("Pending Review", { returnReason: undefined });
  if (event.type === "approve-appraisal") {
    return moveAppraisal("Approved", {
      hrFinalDecision: state.appraisal.superiorRecommendation,
      approvalMethod: "Accepted Superior Recommendation",
      locked: true,
    });
  }
  if (event.type === "override-appraisal") {
    if (event.decision === state.appraisal.superiorRecommendation) throw new Error("Override decision must differ from the Superior Recommendation.");
    if (!event.reason.trim()) throw new Error("Override Reason is required.");
    return moveAppraisal("Approved", {
      hrFinalDecision: event.decision,
      approvalMethod: "Overridden Recommendation",
      overrideReason: event.reason,
      locked: true,
    });
  }
  return state;
}
