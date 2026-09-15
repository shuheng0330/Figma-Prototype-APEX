export type AppStatus =
  | "Ready for Appraisal"
  | "Draft"
  | "Pending Review"
  | "Return for Revision"
  | "Approve"
  | "Override and Approve";

export type Decision = "Promotion" | "Salary Increment" | "Both" | "No Recommendation";

export interface PeriodAppraisal {
  status: AppStatus;
  kpiScore: number;
  attScore: number;
  finalScore: number;
  managerDecision: Decision | null;
  justification: string;
  hrDecision: Decision | null;
  hrFinalScore?: number;
  hrOverrideReason: string;
  hrRemarks: string;
  hrReturnReason: string;
  submittedDate: string;
  finalDate: string;
}

export interface EmployeeAppraisalData {
  name: string;
  staffId: string;
  initials: string;
  role: string;
  trendData: Array<{ year: string; kpi: number; attitude: number; final: number }>;
  periods: Record<string, PeriodAppraisal>;
}

export const PERIOD_OPTIONS = [
  "2027 Annual KPI Review",
  "2026 Annual KPI Review",
  "2025 Annual KPI Review",
  "2024 Annual KPI Review",
];

export const LIVE_PERIOD = "2027 Annual KPI Review";

// localStorage keys — only live-period state is mutable
const K = (empId: string, field: string) => `apx3_${empId}_${field}`;

export function readLive(empId: string): Partial<PeriodAppraisal> {
  const status  = localStorage.getItem(K(empId, "status")) as AppStatus | null;
  const dec     = localStorage.getItem(K(empId, "decision")) as Decision | null;
  const just    = localStorage.getItem(K(empId, "justification"));
  const hrDec   = localStorage.getItem(K(empId, "hrDecision")) as Decision | null;
  const hrOver  = localStorage.getItem(K(empId, "hrOverrideReason"));
  const hrRem   = localStorage.getItem(K(empId, "hrRemarks"));
  const hrRet   = localStorage.getItem(K(empId, "hrReturnReason"));
  const subDate = localStorage.getItem(K(empId, "submittedDate"));
  const finDate = localStorage.getItem(K(empId, "finalDate"));
  const out: Partial<PeriodAppraisal> = {};
  if (status)         out.status          = status;
  if (dec)            out.managerDecision = dec;
  if (just !== null)  out.justification   = just;
  if (hrDec)          out.hrDecision      = hrDec;
  const hrFs = localStorage.getItem(K(empId, "hrFinalScore"));
  if (hrFs !== null)  out.hrFinalScore    = parseFloat(hrFs);
  if (hrOver !== null) out.hrOverrideReason = hrOver;
  if (hrRem  !== null) out.hrRemarks       = hrRem;
  if (hrRet  !== null) out.hrReturnReason  = hrRet;
  if (subDate !== null) out.submittedDate  = subDate;
  if (finDate !== null) out.finalDate      = finDate;
  return out;
}

export function writeLive(empId: string, patch: Partial<PeriodAppraisal>) {
  if (patch.status !== undefined)
    localStorage.setItem(K(empId, "status"), patch.status);
  if (patch.managerDecision !== undefined)
    localStorage.setItem(K(empId, "decision"), patch.managerDecision ?? "");
  if (patch.justification !== undefined)
    localStorage.setItem(K(empId, "justification"), patch.justification);
  if (patch.hrDecision !== undefined)
    localStorage.setItem(K(empId, "hrDecision"), patch.hrDecision ?? "");
  if (patch.hrFinalScore !== undefined)
    localStorage.setItem(K(empId, "hrFinalScore"), String(patch.hrFinalScore ?? ""));
  if (patch.hrOverrideReason !== undefined)
    localStorage.setItem(K(empId, "hrOverrideReason"), patch.hrOverrideReason);
  if (patch.hrRemarks !== undefined)
    localStorage.setItem(K(empId, "hrRemarks"), patch.hrRemarks);
  if (patch.hrReturnReason !== undefined)
    localStorage.setItem(K(empId, "hrReturnReason"), patch.hrReturnReason);
  if (patch.submittedDate !== undefined)
    localStorage.setItem(K(empId, "submittedDate"), patch.submittedDate);
  if (patch.finalDate !== undefined)
    localStorage.setItem(K(empId, "finalDate"), patch.finalDate);
  window.dispatchEvent(new Event("appraisalStatusChange"));
}

/** Returns the period data merged with any localStorage overrides (live period only). */
export function resolvePeriodData(empId: string, period: string): PeriodAppraisal | null {
  const emp = EMPLOYEES[empId];
  if (!emp) return null;
  const base = emp.periods[period];
  if (!base) return null;
  if (period !== LIVE_PERIOD) return base;
  return { ...base, ...readLive(empId) };
}

export const EMPLOYEES: Record<string, EmployeeAppraisalData> = {
  amir: {
    name: "Amir Hassan", staffId: "RS-1042", initials: "AH", role: "Retail Sales Executive",
    trendData: [
      { year: "2023", kpi: 71.2, attitude: 76.0, final: 73.6 },
      { year: "2024", kpi: 74.8, attitude: 78.5, final: 76.7 },
      { year: "2025", kpi: 76.3, attitude: 80.2, final: 78.3 },
      { year: "2026", kpi: 77.1, attitude: 81.0, final: 79.1 },
      { year: "2027", kpi: 78.4, attitude: 82.0, final: 80.2 },
    ],
    periods: {
      "2027 Annual KPI Review": {
        status: "Ready for Appraisal", kpiScore: 78.4, attScore: 82.0, finalScore: 80.2,
        managerDecision: null, justification: "",
        hrDecision: null, hrOverrideReason: "", hrRemarks: "", hrReturnReason: "",
        submittedDate: "", finalDate: "",
      },
      "2026 Annual KPI Review": {
        status: "Override and Approve", kpiScore: 77.1, attScore: 81.0, finalScore: 79.1,
        managerDecision: "Promotion",
        justification: "Amir has demonstrated exceptional improvement in his KPI scores this year. His proactive attitude and willingness to take on additional responsibilities make him a strong candidate for promotion to a senior role.",
        hrDecision: "Salary Increment",
        hrOverrideReason: "Promotion eligibility requires a minimum of 3 years in the current role and written endorsement from the branch head. Amir has been in his current role for 2 years. HR approves a merit increment in recognition of his strong performance.",
        hrRemarks: "Override applied. Salary increment approved in lieu of promotion. Manager to resubmit promotion recommendation in 2028 once minimum tenure requirement is met.",
        hrReturnReason: "", submittedDate: "12 Aug 2026", finalDate: "22 Aug 2026",
      },
      "2025 Annual KPI Review": {
        status: "Approve", kpiScore: 76.3, attScore: 80.2, finalScore: 78.3,
        managerDecision: "Salary Increment",
        justification: "Amir has shown solid improvement over the year. His customer satisfaction scores are strong and his attendance record is exemplary. A merit increment is recommended.",
        hrDecision: "Salary Increment", hrOverrideReason: "",
        hrRemarks: "Approved. Performance meets threshold for merit increment.",
        hrReturnReason: "", submittedDate: "14 Aug 2025", finalDate: "24 Aug 2025",
      },
      "2024 Annual KPI Review": {
        status: "Approve", kpiScore: 74.8, attScore: 78.5, finalScore: 76.7,
        managerDecision: "No Recommendation",
        justification: "Amir's performance has been satisfactory but has not yet reached the threshold for a merit increment. Key areas for improvement include cross-sell rate and consultative selling.",
        hrDecision: "No Recommendation", hrOverrideReason: "",
        hrRemarks: "Noted. Development plan in place for the coming year.",
        hrReturnReason: "", submittedDate: "16 Aug 2024", finalDate: "26 Aug 2024",
      },
    },
  },
  sarah: {
    name: "Sarah Chen", staffId: "RS-1045", initials: "SC", role: "Retail Sales Executive",
    trendData: [
      { year: "2023", kpi: 68.5, attitude: 72.0, final: 70.3 },
      { year: "2024", kpi: 70.2, attitude: 74.8, final: 72.5 },
      { year: "2025", kpi: 71.5, attitude: 76.3, final: 73.9 },
      { year: "2026", kpi: 72.8, attitude: 78.0, final: 75.4 },
      { year: "2027", kpi: 74.1, attitude: 79.5, final: 76.8 },
    ],
    periods: {
      "2027 Annual KPI Review": {
        status: "Draft", kpiScore: 74.1, attScore: 79.5, finalScore: 76.8,
        managerDecision: "Salary Increment",
        justification: "Sarah has shown consistent improvement in her attitude scores and customer interactions. Her KPI score is trending upward and she has shown good initiative in team activities. A merit increment is recommended.",
        hrDecision: null, hrOverrideReason: "", hrRemarks: "", hrReturnReason: "",
        submittedDate: "", finalDate: "",
      },
      "2026 Annual KPI Review": {
        status: "Approve", kpiScore: 72.8, attScore: 78.0, finalScore: 75.4,
        managerDecision: "Salary Increment",
        justification: "Sarah demonstrated steady improvement across all KPI areas. Her attitude evaluation improved significantly, reflecting better team collaboration and customer handling.",
        hrDecision: "Salary Increment", hrOverrideReason: "",
        hrRemarks: "Approved. Merit increment warranted based on consistent improvement trend.",
        hrReturnReason: "", submittedDate: "13 Aug 2026", finalDate: "23 Aug 2026",
      },
      "2025 Annual KPI Review": {
        status: "Approve", kpiScore: 71.5, attScore: 76.3, finalScore: 73.9,
        managerDecision: "No Recommendation",
        justification: "Sarah is showing improvement but has not yet reached the threshold for a merit increment. Recommend continued development support.",
        hrDecision: "No Recommendation", hrOverrideReason: "",
        hrRemarks: "Noted. Development plan to continue into the next review cycle.",
        hrReturnReason: "", submittedDate: "15 Aug 2025", finalDate: "25 Aug 2025",
      },
    },
  },
  rizal: {
    name: "Rizal Hamdan", staffId: "RS-1051", initials: "RH", role: "Retail Sales Executive",
    trendData: [
      { year: "2023", kpi: 65.0, attitude: 70.5, final: 67.8 },
      { year: "2024", kpi: 67.5, attitude: 72.0, final: 69.8 },
      { year: "2025", kpi: 69.2, attitude: 73.8, final: 71.5 },
      { year: "2026", kpi: 70.5, attitude: 75.0, final: 72.8 },
      { year: "2027", kpi: 71.8, attitude: 76.2, final: 74.0 },
    ],
    periods: {
      "2027 Annual KPI Review": {
        status: "Pending Review", kpiScore: 71.8, attScore: 76.2, finalScore: 74.0,
        managerDecision: "No Recommendation",
        justification: "Rizal's performance has remained below departmental targets this year. Areas requiring improvement include Monthly Sales Achievement and Cross-Sell Rate. A structured development plan is proposed for the upcoming review period.",
        hrDecision: null, hrOverrideReason: "", hrRemarks: "", hrReturnReason: "",
        submittedDate: "15 Aug 2027", finalDate: "",
      },
      "2026 Annual KPI Review": {
        status: "Approve", kpiScore: 70.5, attScore: 75.0, finalScore: 72.8,
        managerDecision: "No Recommendation",
        justification: "Performance has not met expectations. A formal development plan is recommended with monthly check-ins.",
        hrDecision: "No Recommendation", hrOverrideReason: "",
        hrRemarks: "Noted. Improvement plan to be implemented with monthly check-ins from line manager.",
        hrReturnReason: "", submittedDate: "18 Aug 2026", finalDate: "28 Aug 2026",
      },
      "2025 Annual KPI Review": {
        status: "Approve", kpiScore: 69.2, attScore: 73.8, finalScore: 71.5,
        managerDecision: "No Recommendation",
        justification: "Performance remains below target. Ongoing coaching and development support is recommended.",
        hrDecision: "No Recommendation", hrOverrideReason: "",
        hrRemarks: "Noted. Ongoing coaching to continue.",
        hrReturnReason: "", submittedDate: "20 Aug 2025", finalDate: "30 Aug 2025",
      },
    },
  },
  nurul: {
    name: "Nurul Aina", staffId: "RS-1038", initials: "NA", role: "Retail Sales Senior",
    trendData: [
      { year: "2023", kpi: 78.0, attitude: 81.5, final: 79.8 },
      { year: "2024", kpi: 79.5, attitude: 82.0, final: 80.8 },
      { year: "2025", kpi: 80.8, attitude: 83.2, final: 82.0 },
      { year: "2026", kpi: 82.0, attitude: 84.1, final: 83.1 },
      { year: "2027", kpi: 83.2, attitude: 85.1, final: 84.2 },
    ],
    periods: {
      "2027 Annual KPI Review": {
        status: "Approve", kpiScore: 83.2, attScore: 85.1, finalScore: 84.2,
        managerDecision: "Promotion",
        justification: "Nurul has consistently exceeded all KPI targets and demonstrates outstanding leadership within the team. She mentors junior staff and proactively takes on additional responsibilities. Promotion to Branch Sales Lead is strongly recommended.",
        hrDecision: "Promotion", hrOverrideReason: "",
        hrRemarks: "Approved. Nurul meets all criteria for promotion. Effective from next quarter. HR to initiate role transition process.",
        hrReturnReason: "", submittedDate: "10 Aug 2027", finalDate: "20 Aug 2027",
      },
      "2026 Annual KPI Review": {
        status: "Approve", kpiScore: 82.0, attScore: 84.1, finalScore: 83.1,
        managerDecision: "Both",
        justification: "Nurul continues to be one of the team's strongest performers. Both a salary increment and promotion consideration are strongly recommended.",
        hrDecision: "Salary Increment", hrOverrideReason: "",
        hrRemarks: "Salary increment approved. Promotion deferred pending formal vacancy in the upcoming cycle.",
        hrReturnReason: "", submittedDate: "11 Aug 2026", finalDate: "21 Aug 2026",
      },
      "2025 Annual KPI Review": {
        status: "Approve", kpiScore: 80.8, attScore: 83.2, finalScore: 82.0,
        managerDecision: "Salary Increment",
        justification: "Nurul has delivered consistently strong performance across all KPI dimensions. A merit increment is well-justified.",
        hrDecision: "Salary Increment", hrOverrideReason: "",
        hrRemarks: "Approved. Outstanding performance recognised.",
        hrReturnReason: "", submittedDate: "12 Aug 2025", finalDate: "22 Aug 2025",
      },
      "2024 Annual KPI Review": {
        status: "Approve", kpiScore: 79.5, attScore: 82.0, finalScore: 80.8,
        managerDecision: "Salary Increment",
        justification: "Consistent high performer. Merit increment is warranted based on full-year results.",
        hrDecision: "Salary Increment", hrOverrideReason: "",
        hrRemarks: "Approved.",
        hrReturnReason: "", submittedDate: "13 Aug 2024", finalDate: "23 Aug 2024",
      },
    },
  },
};
