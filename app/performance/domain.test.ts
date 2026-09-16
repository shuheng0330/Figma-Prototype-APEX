import { describe, expect, it } from "vitest";
import {
  calculateAnnualKpiPoint,
  calculateAttitudeScore,
  calculateFinalAppraisalScore,
  calculateKpiPerformanceScore,
  canTransitionAppraisal,
  canTransitionAssessment,
  canTransitionIndividualKpi,
  generateCheckpoints,
  isActivityOverdue,
  isReadyForAppraisal,
  resolvePeriodStatus,
  selectLatestPeriodWithResults,
  validateReviewPeriod,
  validatePoint,
  hasCapability,
  type ReviewPeriod,
} from "./domain";

const PERIOD: ReviewPeriod = {
  id: "2027",
  name: "2027 Annual KPI Review",
  configuredStatus: "Upcoming",
  startDate: "2027-01-01",
  endDate: "2027-12-31",
  lastUpdated: "2026-09-17",
  deadlines: {
    kpiSetup: "2027-01-01",
    selfAssessmentDays: 5,
    superiorAssessmentDays: 5,
    attitudeSelf: "2027-12-20",
    attitudeSuperior: "2027-12-27",
    superiorAppraisal: "2028-01-10",
    hrReview: "2028-01-20",
  },
  allocations: { company: 15, department: 25, individual: 60, kpi: 50, attitude: 50 },
  consolidationMethod: "final",
};

describe("review period lifecycle", () => {
  it("opens an Upcoming period on its start date without closing another period", () => {
    expect(resolvePeriodStatus(PERIOD, "2026-12-31")).toBe("Upcoming");
    expect(resolvePeriodStatus(PERIOD, "2027-01-01")).toBe("Open");
    expect(resolvePeriodStatus({ ...PERIOD, configuredStatus: "Closed" }, "2028-01-01")).toBe("Closed");
  });

  it("reports confirmed validation errors without inventing closure rules", () => {
    const errors = validateReviewPeriod({
      ...PERIOD,
      startDate: "2027-12-31",
      endDate: "2027-01-01",
      deadlines: { ...PERIOD.deadlines, kpiSetup: "2028-01-01", attitudeSelf: "2027-12-28" },
      allocations: { ...PERIOD.allocations, company: 20 },
    });
    expect(errors.map(error => error.code)).toEqual(expect.arrayContaining([
      "INVALID_PERIOD_RANGE", "KPI_SETUP_AFTER_START", "ATTITUDE_SEQUENCE", "KPI_ALLOCATION_TOTAL",
    ]));
    expect(errors.some(error => error.code.includes("CLOSE"))).toBe(false);
  });

  it("blocks missing deadlines and deadlines before the activity can be available", () => {
    const errors = validateReviewPeriod({
      ...PERIOD,
      deadlines: {
        ...PERIOD.deadlines,
        kpiSetup: "",
        superiorAppraisal: "2027-06-01",
      },
    });
    expect(errors.map(error => error.code)).toEqual(expect.arrayContaining([
      "DEADLINE_REQUIRED", "APPRAISAL_BEFORE_AVAILABLE",
    ]));
  });
});

describe("checkpoint schedule and overdue", () => {
  it("generates independent monthly checkpoints with next-year annual deadlines", () => {
    const monthly = generateCheckpoints(PERIOD, "Monthly");
    expect(monthly).toHaveLength(12);
    expect(monthly[0]).toMatchObject({ checkpointDate: "2027-01-31", availableFrom: "2027-02-01", selfDeadline: "2027-02-05", superiorDeadline: "2027-02-10" });
    expect(monthly[1].availableFrom).toBe("2027-03-01");
    const annual = generateCheckpoints(PERIOD, "Annually");
    expect(annual[0]).toMatchObject({ checkpointDate: "2027-12-31", availableFrom: "2028-01-01", selfDeadline: "2028-01-05" });
  });

  it("generates quarter ends and handles leap years", () => {
    const leapPeriod = { ...PERIOD, id: "2028", startDate: "2028-01-01", endDate: "2028-12-31" };
    const monthly = generateCheckpoints(leapPeriod, "Monthly");
    expect(monthly[1].checkpointDate).toBe("2028-02-29");
    expect(generateCheckpoints(leapPeriod, "Quarterly").map(item => item.checkpointDate)).toEqual([
      "2028-03-31", "2028-06-30", "2028-09-30", "2028-12-31",
    ]);
  });

  it("retains overdue when completion occurs after the deadline", () => {
    expect(isActivityOverdue("2027-03-05", undefined, "2027-03-06")).toBe(true);
    expect(isActivityOverdue("2027-03-05", "2027-03-07", "2027-03-10")).toBe(true);
    expect(isActivityOverdue("2027-03-05", "2027-03-05", "2027-03-10")).toBe(false);
  });
});

describe("canonical calculations", () => {
  it("accepts only raw Points from 1 to 5", () => {
    expect(validatePoint(1)).toBe(true);
    expect(validatePoint(5)).toBe(true);
    expect(validatePoint(0)).toBe(false);
    expect(validatePoint(5.1)).toBe(false);
  });
  it("uses final or average Superior Points without intermediate rounding", () => {
    expect(calculateAnnualKpiPoint([3, 4, 5], "final")).toBe(5);
    expect(calculateAnnualKpiPoint([3, 4, 5], "average")).toBe(4);
  });

  it("calculates weighted KPI, Attitude and Final Appraisal scores", () => {
    expect(calculateKpiPerformanceScore([
      { annualPoint: 4.2, weightage: 20 },
      { annualPoint: 3.8, weightage: 30 },
      { annualPoint: 4, weightage: 50 },
    ])).toBeCloseTo(79.6, 8);
    expect(calculateAttitudeScore([4, 4, 5, 3])).toBe(80);
    expect(calculateFinalAppraisalScore(79.6, 82, 50, 50)).toBeCloseTo(80.8, 8);
  });

  it("requires every checkpoint and the Attitude Evaluation before appraisal readiness", () => {
    expect(isReadyForAppraisal(["Reviewed", "Pending Review"], "Reviewed")).toBe(false);
    expect(isReadyForAppraisal(["Reviewed", "Reviewed"], "Pending Review")).toBe(false);
    expect(isReadyForAppraisal(["Reviewed", "Reviewed"], "Reviewed")).toBe(true);
  });
});

describe("canonical workflow transitions", () => {
  it("keeps KPI approval, assessment review, and appraisal transitions distinct", () => {
    expect(canTransitionIndividualKpi("Draft", "Pending Approval")).toBe(true);
    expect(canTransitionIndividualKpi("Returned", "Pending Approval")).toBe(true);
    expect(canTransitionIndividualKpi("Approved", "Draft")).toBe(false);
    expect(canTransitionAssessment("Draft", "Pending Review")).toBe(true);
    expect(canTransitionAssessment("Pending Review", "Reviewed")).toBe(true);
    expect(canTransitionAssessment("Pending Review", "Draft")).toBe(false);
    expect(canTransitionAppraisal("Pending Review", "Returned")).toBe(true);
    expect(canTransitionAppraisal("Returned", "Pending Review")).toBe(true);
    expect(canTransitionAppraisal("Approved", "Returned")).toBe(false);
  });

  it("uses one capability map for role access", () => {
    expect(hasCapability("manager_hod", "team-reviews")).toBe(true);
    expect(hasCapability("hr", "team-reviews")).toBe(false);
    expect(hasCapability("super_admin", "hr-appraisals")).toBe(false);
    expect(hasCapability("trainer", "training-admin")).toBe(true);
  });
});

describe("dashboard period selection", () => {
  it("keeps the latest period that actually has results", () => {
    expect(selectLatestPeriodWithResults([
      { periodId: "2028", hasResults: false },
      { periodId: "2027", hasResults: true },
      { periodId: "2026", hasResults: true },
    ])).toBe("2027");
  });
});
