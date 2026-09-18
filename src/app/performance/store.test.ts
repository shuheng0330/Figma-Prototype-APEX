import { describe, expect, it } from "vitest";
import { applyEffectiveDateTransitions, createInitialPerformanceState, getConfirmedEmployeeKpiPlan, getEmployeeKpiPlanFromState, prepareEmployeeForAppraisalState } from "./store";

const scoreDef = { s5:"5", s4:"4", s3:"3", s2:"2", s1:"1" };

function acceptanceState() {
  const state = createInitialPerformanceState();
  state.effectiveDate = "2028-02-01";
  state.companyKpisByPeriod["2028 Annual KPI Review"] = [{ id:"company-1", perspective:"Financial", kra:"Growth", name:"Published Company KPI", target:"10%", weightage:15, status:"Published", scoreDef, version:1 }];
  state.departmentKpisByPeriod["2028 Annual KPI Review"] = [{ id:"department-1", departmentId:"retail-sales", perspective:"Customer", kra:"Sales", name:"Published Department KPI", target:"25%", weightage:25, status:"Published", scoreDef, version:1 }];
  state.employeeKpiPlansByPeriod["2028 Annual KPI Review"] = [{ id:"individual-1", employeeId:"amir", level:"Individual", perspective:"Customer", kra:"Growth", name:"Approved Individual KPI", target:"10", weightage:60, status:"Approved", scoreDef, version:1 }];
  state.attitudeSnapshotsByPeriod["2028"] = { sharedCriteria:[{id:"respect",name:"Respect",description:"Treats others respectfully.",status:"Active"}], salesCriteria:[{id:"sales-drive",name:"Sales Drive",description:"Pursues sales opportunities.",status:"Active"}], managerCriteria:[], nonSalesCriteria:[] };
  return state;
}

describe("shared 2028 workflow store", () => {
  it("builds Amir's plan from the published company and department KPIs plus his individual KPI", () => {
    const plan = getEmployeeKpiPlanFromState(acceptanceState(), "2028", "amir");
    expect(plan.map(item => [item.level, item.name])).toEqual([
      ["Company", "Published Company KPI"],
      ["Department", "Published Department KPI"],
      ["Individual", "Approved Individual KPI"],
    ]);
  });

  it("prepares only missing prerequisites, preserves manual work and calculates one shared result", () => {
    const state = acceptanceState();
    state.kpiAssessments["2028:amir:jan"] = {
      id:"2028:amir:jan", periodId:"2028", employeeId:"amir", checkpointId:"jan", checkpointLabel:"January 2028", status:"Reviewed",
      selfPoints:{"company-1":5,"department-1":4,"individual-1":3}, selfComments:{manual:"kept"}, evidence:{},
      superiorPoints:{"company-1":5,"department-1":4,"individual-1":3}, superiorComments:{manual:"kept"}, reviewedAt:"2028-02-01",
    };
    const prepared = prepareEmployeeForAppraisalState(state, "2028", "amir");
    const checkpoints = Object.values(prepared.kpiAssessments).filter(record => record.periodId === "2028" && record.employeeId === "amir");
    expect(checkpoints).toHaveLength(12);
    expect(prepared.kpiAssessments["2028:amir:jan"].selfComments.manual).toBe("kept");
    expect(prepared.attitudeAssessments["2028:amir"].criteria).toHaveLength(2);
    expect(prepared.appraisals.amir.readyForAppraisal).toBe(true);
    expect(prepared.performanceResults["2028:amir"].kpiResults).toHaveLength(3);
    expect(prepared.resultsByPeriod["2028"]).toEqual({ employee:true, team:true, organisation:true });
  });

  it("restores a clean, repeatable 2028 baseline", () => {
    const reset = createInitialPerformanceState();
    expect(Object.values(reset.kpiAssessments).filter(record => record.periodId === "2028")).toHaveLength(0);
    expect(reset.performanceResults["2028:amir"]).toBeUndefined();
    expect(reset.appraisals.amir).toMatchObject({ periodId:"2028", status:"Draft", readyForAppraisal:false });
  });

  it("locks the confirmed KPI versions when the period opens and does not propagate later revisions", () => {
    const state = acceptanceState();
    state.attitudeConfigurations["2028 Annual KPI Review"] = { configStatus:"Published", lastUpdated:"2028-01-20", sharedCriteria:[], salesCriteria:[], managerCriteria:[], nonSalesCriteria:[] };
    const opened = applyEffectiveDateTransitions(state, "2028-02-01");
    opened.companyKpisByPeriod["2028 Annual KPI Review"][0] = { ...opened.companyKpisByPeriod["2028 Annual KPI Review"][0], name:"Revised after Open", version:2 };
    expect(getConfirmedEmployeeKpiPlan(opened, "2028", "amir").find(item => item.id === "company-1")?.name).toBe("Published Company KPI");
  });
});
