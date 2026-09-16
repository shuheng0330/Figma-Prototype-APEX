import { describe, expect, it } from "vitest";
import { applyScenarioEvent, createScenarioState } from "./scenario";

describe("automated 2027–2028 prototype simulation", () => {
  it("runs the confirmed workflow while preserving TBC boundaries", () => {
    let state = createScenarioState();
    const run = (event: Parameters<typeof applyScenarioEvent>[1]) => { state = applyScenarioEvent(state, event); };

    run({ type: "publish-period", periodId: "2027" });
    run({ type: "submit-individual-kpi" });
    run({ type: "return-individual-kpi", reason: "Clarify the target." });
    run({ type: "resubmit-individual-kpi" });
    run({ type: "approve-individual-kpi" });
    run({ type: "open-period", periodId: "2027" });
    run({ type: "complete-checkpoint", checkpointId: "jan", completedAt: "2027-02-05", point: 4 });
    run({ type: "mark-checkpoint-overdue", checkpointId: "feb" });
    run({ type: "complete-checkpoint", checkpointId: "mar", completedAt: "2027-04-05", point: 4 });
    run({ type: "revise-approved-kpi", reason: "Revised sales target." });

    expect(state.individualKpi.version).toBe(2);
    expect(state.individualKpi.status).toBe("Pending Approval");
    expect(state.requirementGaps).toContain("open-kpi-revision");
    expect(state.checkpoints.mar.status).toBe("Reviewed");
    expect(state.checkpoints.feb.overdue).toBe(true);

    run({ type: "approve-individual-kpi" });
    run({ type: "complete-checkpoint", checkpointId: "feb", completedAt: "2027-03-08", point: 3 });
    run({ type: "complete-attitude", superiorPoints: [4, 4, 5, 3] });
    expect(state.readyForAppraisal).toBe(true);

    run({ type: "submit-appraisal", recommendation: "Promotion" });
    run({ type: "return-appraisal", reason: "Add evidence." });
    run({ type: "resubmit-appraisal" });
    run({ type: "open-period", periodId: "2028" });
    expect(state.periods["2027"].status).toBe("Open");
    expect(state.periods["2028"].status).toBe("Open");
    expect(state.dashboardDefaultPeriod).toBe("2027");

    run({ type: "approve-appraisal" });
    expect(state.appraisal).toMatchObject({ status: "Approved", approvalMethod: "Accepted Superior Recommendation", locked: true });
    expect(state.requirementGaps).toContain("review-period-closure");
    expect(state.periods["2027"].status).toBe("Open");
  });

  it("allows HR to override only to a different recommendation without changing the final score", () => {
    let state = createScenarioState({ ready: true, finalScore: 80.2 });
    state = applyScenarioEvent(state, { type: "submit-appraisal", recommendation: "Promotion" });
    state = applyScenarioEvent(state, { type: "override-appraisal", decision: "Salary Increment", reason: "Policy eligibility." });
    expect(state.appraisal.status).toBe("Approved");
    expect(state.appraisal.superiorRecommendation).toBe("Promotion");
    expect(state.appraisal.hrFinalDecision).toBe("Salary Increment");
    expect(state.appraisal.finalScore).toBe(80.2);
    expect(() => applyScenarioEvent(state, { type: "override-appraisal", decision: "Promotion", reason: "Same." })).toThrow();
  });
});
