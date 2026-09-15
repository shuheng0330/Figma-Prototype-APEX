import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts";
import { ArrowLeft, ChevronDown, ChevronRight, X, CheckCircle2, Clock } from "lucide-react";
import {
  EMPLOYEES, PERIOD_OPTIONS, LIVE_PERIOD, AppStatus,
  PeriodAppraisal, resolvePeriodData,
} from "./appraisalData";

// ── Palette ────────────────────────────────────────────────────────────────────
const BLUE   = "#2457A6";
const TEAL   = "#0F9F8F";
const AMBER  = "#D99000";
const GREEN  = "#059669";
const RED    = "#D14343";
const PURPLE = "#8B5CF6";
const TEXT   = "#172033";
const MUTED  = "#667085";
const BORDER = "#DCE3EC";
const BG     = "#F4F6F9";

const STATUS_STYLE: Record<AppStatus, { color: string; bg: string }> = {
  "Ready for Appraisal":  { color: BLUE,   bg: "#EEF3FC" },
  "Draft":                { color: AMBER,  bg: "#FEF9EC" },
  "Pending Review":       { color: TEAL,   bg: "#ECFDF9" },
  "Return for Revision":  { color: RED,    bg: "#FEF3F2" },
  "Approve":              { color: GREEN,  bg: "#ECFDF5" },
  "Override and Approve": { color: PURPLE, bg: "#F5F3FF" },
};

// ── Employee metadata ──────────────────────────────────────────────────────────
const EMP_META: Record<string, { dept: string; avatarColor: string }> = {
  amir:  { dept: "Retail Banking", avatarColor: BLUE  },
  sarah: { dept: "Retail Banking", avatarColor: TEAL  },
  rizal: { dept: "Retail Banking", avatarColor: AMBER },
  nurul: { dept: "Retail Banking", avatarColor: GREEN },
};

// ── KPI Types & Mock Data ──────────────────────────────────────────────────────
interface KpiCheckpoint {
  label: string;
  status: "Completed" | "Pending";
  selfScore: number | null;
  superiorScore: number | null;
  selfComment: string;
  superiorComment: string;
}

interface KpiItem {
  id: string;
  name: string;
  level: string;
  target: string;
  frequency: "Monthly" | "Quarterly" | "Annually";
  finalScore: number;
  checkpoints: KpiCheckpoint[];
}

const KPI_DATA: Record<string, KpiItem[]> = {
  amir: [
    {
      id: "k1", name: "Monthly Sales Achievement", level: "Level 3",
      target: "50 units / month", frequency: "Monthly", finalScore: 75.2,
      checkpoints: [
        { label: "January 2027",  status: "Completed", selfScore: 72, superiorScore: 70, selfComment: "Achieved 36/50 units but faced inventory shortages in mid-month.",    superiorComment: "Below target due to stock constraints. Effort commendable." },
        { label: "February 2027", status: "Completed", selfScore: 76, superiorScore: 74, selfComment: "Improved by leveraging walk-in traffic from new branch signage.",      superiorComment: "Good recovery. Encourage cross-sell strategy." },
        { label: "March 2027",    status: "Completed", selfScore: 80, superiorScore: 79, selfComment: "Achieved 39/50 units. Best month so far.",                             superiorComment: "Solid improvement. Continue building customer pipeline." },
        { label: "April 2027",    status: "Completed", selfScore: 74, superiorScore: 75, selfComment: "Slightly below due to team restructuring impact.",                    superiorComment: "Acceptable. Expected temporary dip." },
        { label: "May 2027",      status: "Completed", selfScore: 78, superiorScore: 77, selfComment: "Consistent effort. Customer referrals contributed.",                  superiorComment: "Good. Track referral program outcomes." },
        { label: "June 2027",     status: "Completed", selfScore: 79, superiorScore: 78, selfComment: "Strong half-year close.",                                               superiorComment: "Approved." },
        { label: "July 2027",     status: "Completed", selfScore: 75, superiorScore: 76, selfComment: "Mid-year review completed. Trajectory positive.",                     superiorComment: "On track." },
        { label: "August 2027",   status: "Pending",   selfScore: null, superiorScore: null, selfComment: "", superiorComment: "" },
      ],
    },
    {
      id: "k2", name: "Cross-Sell Rate", level: "Level 2",
      target: "30% of transactions", frequency: "Quarterly", finalScore: 68.5,
      checkpoints: [
        { label: "Q1 2027", status: "Completed", selfScore: 65, superiorScore: 64, selfComment: "Cross-sell at 19% of transactions. Need to improve product bundling.",    superiorComment: "Below target. Attend product knowledge refresher." },
        { label: "Q2 2027", status: "Completed", selfScore: 70, superiorScore: 69, selfComment: "Improved to 22%. Better product familiarity helping.",                    superiorComment: "Improvement noted. Set Q3 milestone of 25%." },
        { label: "Q3 2027", status: "Completed", selfScore: 72, superiorScore: 72, selfComment: "Reached 23% cross-sell. Consultative approach taking effect.",           superiorComment: "Steady progress. Will review at year-end." },
        { label: "Q4 2027", status: "Pending",   selfScore: null, superiorScore: null, selfComment: "", superiorComment: "" },
      ],
    },
    {
      id: "k3", name: "Customer Satisfaction Score", level: "Level 1",
      target: "≥ 4.0 / 5.0", frequency: "Quarterly", finalScore: 84.5,
      checkpoints: [
        { label: "Q1 2027", status: "Completed", selfScore: 82, superiorScore: 83, selfComment: "Survey average 4.1/5.0 from 28 responses.",                   superiorComment: "Good. Continue proactive follow-up." },
        { label: "Q2 2027", status: "Completed", selfScore: 85, superiorScore: 86, selfComment: "4.3/5.0 average. Received commendations for responsiveness.", superiorComment: "Excellent. Nominate for service excellence award." },
        { label: "Q3 2027", status: "Completed", selfScore: 86, superiorScore: 84, selfComment: "Maintained 4.2/5.0 through holiday period.",                  superiorComment: "Strong consistency." },
        { label: "Q4 2027", status: "Pending",   selfScore: null, superiorScore: null, selfComment: "", superiorComment: "" },
      ],
    },
    {
      id: "k4", name: "Customer Acquisition Rate", level: "Level 2",
      target: "15 new accounts / month", frequency: "Quarterly", finalScore: 79.0,
      checkpoints: [
        { label: "Q1 2027", status: "Completed", selfScore: 76, superiorScore: 77, selfComment: "Opened avg. 12 new accounts per month.",    superiorComment: "Below target. Focus on referral conversion." },
        { label: "Q2 2027", status: "Completed", selfScore: 80, superiorScore: 81, selfComment: "13-14 new accounts per month on average.",  superiorComment: "Improving. Keep building network." },
        { label: "Q3 2027", status: "Completed", selfScore: 79, superiorScore: 79, selfComment: "Consistent at 13-14 new accounts monthly.", superiorComment: "Stable. Encourage referral program participation." },
        { label: "Q4 2027", status: "Pending",   selfScore: null, superiorScore: null, selfComment: "", superiorComment: "" },
      ],
    },
  ],
  sarah: [
    {
      id: "k1", name: "Monthly Sales Achievement", level: "Level 2",
      target: "40 units / month", frequency: "Monthly", finalScore: 72.0,
      checkpoints: [
        { label: "January 2027",  status: "Completed", selfScore: 68, superiorScore: 67, selfComment: "Achieved 27/40 units. Difficult start to the year.", superiorComment: "Below target. Provide additional sales coaching." },
        { label: "February 2027", status: "Completed", selfScore: 72, superiorScore: 71, selfComment: "Improved to 29/40.",                                   superiorComment: "Progress noted." },
        { label: "March 2027",    status: "Completed", selfScore: 74, superiorScore: 73, selfComment: "30/40 units. Positive trend.",                         superiorComment: "Keep the momentum." },
        { label: "April 2027",    status: "Completed", selfScore: 73, superiorScore: 72, selfComment: "Consistent at 29-30 units.",                           superiorComment: "Stable performance." },
        { label: "May 2027",      status: "Completed", selfScore: 75, superiorScore: 74, selfComment: "30 units achieved.",                                   superiorComment: "Consistent improvement noted." },
        { label: "June 2027",     status: "Completed", selfScore: 73, superiorScore: 73, selfComment: "Mid-year review period.",                              superiorComment: "Approved." },
        { label: "July 2027",     status: "Completed", selfScore: 74, superiorScore: 73, selfComment: "On track.",                                            superiorComment: "Continue at this pace." },
        { label: "August 2027",   status: "Pending",   selfScore: null, superiorScore: null, selfComment: "", superiorComment: "" },
      ],
    },
    {
      id: "k2", name: "Cross-Sell Rate", level: "Level 1",
      target: "25% of transactions", frequency: "Quarterly", finalScore: 70.0,
      checkpoints: [
        { label: "Q1 2027", status: "Completed", selfScore: 67, superiorScore: 68, selfComment: "Around 17% cross-sell rate.",                        superiorComment: "Below target. Work on product knowledge." },
        { label: "Q2 2027", status: "Completed", selfScore: 71, superiorScore: 70, selfComment: "Improved to 20% through better product suggestions.", superiorComment: "Good effort." },
        { label: "Q3 2027", status: "Completed", selfScore: 72, superiorScore: 72, selfComment: "Achieving around 21%.",                              superiorComment: "Steady improvement." },
        { label: "Q4 2027", status: "Pending",   selfScore: null, superiorScore: null, selfComment: "", superiorComment: "" },
      ],
    },
    {
      id: "k3", name: "Customer Satisfaction Score", level: "Level 1",
      target: "≥ 4.0 / 5.0", frequency: "Quarterly", finalScore: 76.0,
      checkpoints: [
        { label: "Q1 2027", status: "Completed", selfScore: 74, superiorScore: 75, selfComment: "3.9/5.0 average. Just below target.",  superiorComment: "Close to target. Focus on resolution speed." },
        { label: "Q2 2027", status: "Completed", selfScore: 77, superiorScore: 76, selfComment: "4.0/5.0 achieved.",                    superiorComment: "Target met. Maintain consistency." },
        { label: "Q3 2027", status: "Completed", selfScore: 78, superiorScore: 77, selfComment: "4.1/5.0 average.",                     superiorComment: "Above target." },
        { label: "Q4 2027", status: "Pending",   selfScore: null, superiorScore: null, selfComment: "", superiorComment: "" },
      ],
    },
    {
      id: "k4", name: "Product Knowledge Assessment", level: "Level 2",
      target: "Pass assessment (≥ 70%)", frequency: "Annually", finalScore: 82.0,
      checkpoints: [
        { label: "Annual 2027", status: "Completed", selfScore: 82, superiorScore: 82, selfComment: "Scored 82% in product knowledge test.", superiorComment: "Above minimum threshold. Continue learning." },
      ],
    },
  ],
  rizal: [
    {
      id: "k1", name: "Monthly Sales Achievement", level: "Level 2",
      target: "45 units / month", frequency: "Monthly", finalScore: 65.0,
      checkpoints: [
        { label: "January 2027",  status: "Completed", selfScore: 60, superiorScore: 59, selfComment: "23/45 units. Challenging month.",                       superiorComment: "Significantly below target. Immediate coaching required." },
        { label: "February 2027", status: "Completed", selfScore: 63, superiorScore: 62, selfComment: "Slight improvement to 26/45.",                          superiorComment: "Progress insufficient. Development plan initiated." },
        { label: "March 2027",    status: "Completed", selfScore: 65, superiorScore: 65, selfComment: "Reached 28/45. Best month so far.",                    superiorComment: "Improvement noted but still below target." },
        { label: "April 2027",    status: "Completed", selfScore: 64, superiorScore: 63, selfComment: "27/45. Struggled with leads conversion.",              superiorComment: "Review sales approach." },
        { label: "May 2027",      status: "Completed", selfScore: 67, superiorScore: 66, selfComment: "29/45 units.",                                         superiorComment: "Slow but steady progress." },
        { label: "June 2027",     status: "Completed", selfScore: 66, superiorScore: 66, selfComment: "28/45. Mid-year results below departmental average.",  superiorComment: "Monthly check-ins to continue." },
        { label: "July 2027",     status: "Completed", selfScore: 68, superiorScore: 67, selfComment: "29/45. Showing consistency at this level.",           superiorComment: "Noted. Target for Q3 remains 40 units." },
        { label: "August 2027",   status: "Pending",   selfScore: null, superiorScore: null, selfComment: "", superiorComment: "" },
      ],
    },
    {
      id: "k2", name: "Cross-Sell Rate", level: "Level 1",
      target: "25% of transactions", frequency: "Quarterly", finalScore: 62.0,
      checkpoints: [
        { label: "Q1 2027", status: "Completed", selfScore: 60, superiorScore: 59, selfComment: "14% cross-sell. Below target.",                    superiorComment: "Needs significant improvement. Product training required." },
        { label: "Q2 2027", status: "Completed", selfScore: 63, superiorScore: 62, selfComment: "Improved to 16%. Product sessions helped.",        superiorComment: "Marginal improvement." },
        { label: "Q3 2027", status: "Completed", selfScore: 64, superiorScore: 64, selfComment: "17%. Slow progress.",                               superiorComment: "Continue coaching. Target 20% for Q4." },
        { label: "Q4 2027", status: "Pending",   selfScore: null, superiorScore: null, selfComment: "", superiorComment: "" },
      ],
    },
    {
      id: "k3", name: "Customer Satisfaction Score", level: "Level 1",
      target: "≥ 4.0 / 5.0", frequency: "Quarterly", finalScore: 71.0,
      checkpoints: [
        { label: "Q1 2027", status: "Completed", selfScore: 70, superiorScore: 69, selfComment: "3.7/5.0 average.",             superiorComment: "Work on customer communication skills." },
        { label: "Q2 2027", status: "Completed", selfScore: 72, superiorScore: 71, selfComment: "3.8/5.0. Marginal improvement.", superiorComment: "Noted. Continue monitoring." },
        { label: "Q3 2027", status: "Completed", selfScore: 73, superiorScore: 73, selfComment: "3.9/5.0. Approaching target.", superiorComment: "Improvement acknowledged. Target 4.0 for Q4." },
        { label: "Q4 2027", status: "Pending",   selfScore: null, superiorScore: null, selfComment: "", superiorComment: "" },
      ],
    },
  ],
  nurul: [
    {
      id: "k1", name: "Monthly Sales Achievement", level: "Level 4",
      target: "70 units / month", frequency: "Monthly", finalScore: 88.0,
      checkpoints: [
        { label: "January 2027",  status: "Completed", selfScore: 85, superiorScore: 86, selfComment: "60/70 units. Strong January.",             superiorComment: "Above average for the team. Excellent start." },
        { label: "February 2027", status: "Completed", selfScore: 88, superiorScore: 87, selfComment: "61/70 units.",                             superiorComment: "Consistent excellence." },
        { label: "March 2027",    status: "Completed", selfScore: 90, superiorScore: 90, selfComment: "63/70. Best month this year.",             superiorComment: "Outstanding. Best individual result in the branch." },
        { label: "April 2027",    status: "Completed", selfScore: 87, superiorScore: 88, selfComment: "62/70.",                                  superiorComment: "Solid." },
        { label: "May 2027",      status: "Completed", selfScore: 89, superiorScore: 89, selfComment: "62/70. Consistently high.",               superiorComment: "Excellent performance maintained." },
        { label: "June 2027",     status: "Completed", selfScore: 88, superiorScore: 88, selfComment: "Half-year performance exceeds target.",   superiorComment: "Approved." },
        { label: "July 2027",     status: "Completed", selfScore: 90, superiorScore: 89, selfComment: "63/70 units. Referral network growing.",  superiorComment: "Exemplary." },
        { label: "August 2027",   status: "Pending",   selfScore: null, superiorScore: null, selfComment: "", superiorComment: "" },
      ],
    },
    {
      id: "k2", name: "Team Mentoring and Development", level: "Level 3",
      target: "2 junior staff mentored / quarter", frequency: "Quarterly", finalScore: 90.0,
      checkpoints: [
        { label: "Q1 2027", status: "Completed", selfScore: 88, superiorScore: 90, selfComment: "Mentored Rizal and Sarah, both showed measurable improvement.",      superiorComment: "Exceptional. Rizal improvement directly attributable to Nurul's guidance." },
        { label: "Q2 2027", status: "Completed", selfScore: 91, superiorScore: 90, selfComment: "Continued 1:1 coaching plus group product knowledge drills.",         superiorComment: "Above and beyond expectation." },
        { label: "Q3 2027", status: "Completed", selfScore: 90, superiorScore: 90, selfComment: "Mentored 3 juniors this quarter.",                                    superiorComment: "Outstanding contribution to team development." },
        { label: "Q4 2027", status: "Pending",   selfScore: null, superiorScore: null, selfComment: "", superiorComment: "" },
      ],
    },
    {
      id: "k3", name: "Cross-Sell Rate", level: "Level 3",
      target: "40% of transactions", frequency: "Quarterly", finalScore: 80.0,
      checkpoints: [
        { label: "Q1 2027", status: "Completed", selfScore: 78, superiorScore: 79, selfComment: "35% cross-sell rate achieved.",        superiorComment: "Very good. Just below 40% target." },
        { label: "Q2 2027", status: "Completed", selfScore: 82, superiorScore: 81, selfComment: "38% — close to target.",              superiorComment: "Strong effort. Near target achievement." },
        { label: "Q3 2027", status: "Completed", selfScore: 80, superiorScore: 80, selfComment: "37% maintained across busy season.",  superiorComment: "Commendable consistency." },
        { label: "Q4 2027", status: "Pending",   selfScore: null, superiorScore: null, selfComment: "", superiorComment: "" },
      ],
    },
    {
      id: "k4", name: "Customer Satisfaction Score", level: "Level 2",
      target: "≥ 4.5 / 5.0", frequency: "Quarterly", finalScore: 85.0,
      checkpoints: [
        { label: "Q1 2027", status: "Completed", selfScore: 84, superiorScore: 85, selfComment: "4.6/5.0 average. Above target.",             superiorComment: "Excellent. Consistently the highest-rated in the branch." },
        { label: "Q2 2027", status: "Completed", selfScore: 86, superiorScore: 85, selfComment: "4.7/5.0. Several VIP commendation letters.", superiorComment: "Outstanding. Will submit for customer experience award." },
        { label: "Q3 2027", status: "Completed", selfScore: 85, superiorScore: 85, selfComment: "4.6/5.0 maintained.",                        superiorComment: "Consistently excellent." },
        { label: "Q4 2027", status: "Pending",   selfScore: null, superiorScore: null, selfComment: "", superiorComment: "" },
      ],
    },
  ],
};

// ── Attitude Types and Mock Data ───────────────────────────────────────────────
interface AttitudeCriterion {
  criterion: string;
  selfScore: number;
  superiorScore: number;
  selfComment: string;
  managerComment: string;
}

interface AttitudeData {
  form: string;
  superiorScore: number;
  status: "Completed" | "Pending";
  criteria: AttitudeCriterion[];
}

const ATTITUDE_DATA: Record<string, AttitudeData> = {
  amir: {
    form: "Sales Form", superiorScore: 82.0, status: "Completed",
    criteria: [
      { criterion: "Customer Service Orientation",  selfScore: 84, superiorScore: 83, selfComment: "I prioritise customer needs and follow up on all queries within 24 hours.",     managerComment: "Consistently good. Occasionally reactive rather than proactive." },
      { criterion: "Sales Professionalism",         selfScore: 80, superiorScore: 81, selfComment: "Maintain professional conduct in all customer interactions.",                    managerComment: "Reliable and courteous. Good presentation skills." },
      { criterion: "Teamwork and Collaboration",    selfScore: 82, superiorScore: 80, selfComment: "Contribute to team briefings and share lead information with peers.",          managerComment: "Good team player. Participates constructively in discussions." },
      { criterion: "Initiative and Self-Development", selfScore: 78, superiorScore: 79, selfComment: "Enrolled in product certification programme voluntarily.",                  managerComment: "Shows initiative. Continue to expand product knowledge." },
      { criterion: "Compliance and Ethics",         selfScore: 88, superiorScore: 87, selfComment: "Full compliance with all regulatory requirements. No incidents reported.",     managerComment: "Exemplary compliance record." },
    ],
  },
  sarah: {
    form: "Sales Form", superiorScore: 79.5, status: "Completed",
    criteria: [
      { criterion: "Customer Service Orientation",  selfScore: 80, superiorScore: 79, selfComment: "Focus on building long-term customer relationships.",          managerComment: "Good orientation. Improve speed of complaint resolution." },
      { criterion: "Sales Professionalism",         selfScore: 78, superiorScore: 78, selfComment: "Maintain professional image and conduct.",                     managerComment: "Professional. Meets expectations." },
      { criterion: "Teamwork and Collaboration",    selfScore: 81, superiorScore: 80, selfComment: "Active participant in team activities and knowledge sharing.", managerComment: "Positive team member. Often helps colleagues." },
      { criterion: "Initiative and Self-Development", selfScore: 79, superiorScore: 80, selfComment: "Completed product knowledge assessment with good score.",   managerComment: "Shows commitment to self-improvement." },
      { criterion: "Compliance and Ethics",         selfScore: 85, superiorScore: 81, selfComment: "No compliance issues throughout the year.",                   managerComment: "Good compliance record." },
    ],
  },
  rizal: {
    form: "Sales Form", superiorScore: 76.2, status: "Completed",
    criteria: [
      { criterion: "Customer Service Orientation",  selfScore: 75, superiorScore: 73, selfComment: "Try to address customer queries promptly.",          managerComment: "Average. Work on empathy and problem resolution skills." },
      { criterion: "Sales Professionalism",         selfScore: 74, superiorScore: 75, selfComment: "Maintain basic professional standards.",             managerComment: "Meets minimum requirements. Room to improve." },
      { criterion: "Teamwork and Collaboration",    selfScore: 77, superiorScore: 78, selfComment: "Participate in team meetings and share information.", managerComment: "Cooperative. Good team attitude despite performance challenges." },
      { criterion: "Initiative and Self-Development", selfScore: 73, superiorScore: 72, selfComment: "Attended two internal training sessions.",         managerComment: "Needs to take more initiative in skill development." },
      { criterion: "Compliance and Ethics",         selfScore: 83, superiorScore: 83, selfComment: "No compliance incidents.",                          managerComment: "Satisfactory compliance record." },
    ],
  },
  nurul: {
    form: "Sales Form", superiorScore: 85.1, status: "Completed",
    criteria: [
      { criterion: "Customer Service Orientation",  selfScore: 88, superiorScore: 87, selfComment: "Proactively contact customers and provide personalised service.",            managerComment: "Exemplary. Sets the benchmark for the team." },
      { criterion: "Sales Professionalism",         selfScore: 86, superiorScore: 86, selfComment: "Maintain the highest professional standards in all interactions.",           managerComment: "Outstanding professional conduct." },
      { criterion: "Teamwork and Collaboration",    selfScore: 87, superiorScore: 85, selfComment: "Lead team initiatives and mentor junior colleagues.",                       managerComment: "Exceptional team contributor and role model." },
      { criterion: "Initiative and Self-Development", selfScore: 84, superiorScore: 85, selfComment: "Completed advanced banking certification and attended 4 external seminars.", managerComment: "Highly self-motivated. Exceeds all development expectations." },
      { criterion: "Compliance and Ethics",         selfScore: 88, superiorScore: 83, selfComment: "Perfect compliance record. Conducted team compliance refresher session.",   managerComment: "Outstanding. Proactively promotes compliance culture." },
    ],
  },
};

// ── HistoryDrawer — exact Screen 5 design ────────────────────────────────────
function HistoryDrawer({ period, data, onClose }: {
  period: string; data: PeriodAppraisal; onClose: () => void;
}) {
  const ss = STATUS_STYLE[data.status];
  const isOverride = data.status === "Override and Approve";
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.25)" }} onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 bg-white flex flex-col overflow-hidden"
        style={{ width: "clamp(380px, 38vw, 520px)", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Historical Record</p>
            <h3 className="text-[15px] font-bold mt-0.5" style={{ color: TEXT }}>{period}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <X size={17} style={{ color: MUTED }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-3" style={{ color: MUTED }}>Performance Scores</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "KPI Score",      value: data.kpiScore,   color: BLUE   },
                { label: "Attitude Score", value: data.attScore,   color: TEAL   },
                { label: "Final Score",    value: data.finalScore, color: PURPLE },
              ].map(s => (
                <div key={s.label} className="rounded-lg p-3 text-center"
                  style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                  <p className="text-[10px]" style={{ color: MUTED }}>{s.label}</p>
                  <p className="text-[20px] font-bold leading-snug" style={{ color: s.color }}>{s.value.toFixed(1)}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>Manager Recommendation</p>
            <div className="inline-flex items-center px-3 py-1.5 rounded-md text-[13px] font-semibold mb-3"
              style={{ backgroundColor: "#EEF3FC", color: BLUE }}>
              {data.managerDecision ?? "—"}
            </div>
            {data.justification && (
              <p className="text-[12px] leading-relaxed" style={{ color: TEXT }}>{data.justification}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[12px] font-semibold" style={{ color: MUTED }}>Appraisal Status:</p>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ color: ss.color, backgroundColor: ss.bg }}>
              {data.status}
            </span>
          </div>
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-3" style={{ color: MUTED }}>HR Decision</p>
            {isOverride && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold mb-1" style={{ color: MUTED }}>Original Manager Recommendation</p>
                <p className="text-[13px] font-semibold" style={{ color: TEXT }}>{data.managerDecision}</p>
              </div>
            )}
            <div className="mb-3">
              <p className="text-[11px] font-semibold mb-1" style={{ color: MUTED }}>HR Final Decision</p>
              <div className="inline-flex items-center px-3 py-1.5 rounded-md text-[13px] font-semibold"
                style={{ backgroundColor: "#ECFDF5", color: GREEN }}>
                {data.hrDecision ?? "—"}
              </div>
            </div>
            {isOverride && data.hrOverrideReason && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold mb-1" style={{ color: RED }}>HR Override Reason</p>
                <p className="text-[12px] leading-relaxed p-3 rounded-lg"
                  style={{ color: TEXT, backgroundColor: "#FEF3F2", border: "1px solid #FECDCA" }}>
                  {data.hrOverrideReason}
                </p>
              </div>
            )}
            {data.hrRemarks && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold mb-1" style={{ color: MUTED }}>HR Finalisation Remarks</p>
                <p className="text-[12px] leading-relaxed" style={{ color: TEXT }}>{data.hrRemarks}</p>
              </div>
            )}
            {data.finalDate && (
              <p className="text-[12px] mt-1" style={{ color: MUTED }}>
                Finalised on: <span className="font-semibold" style={{ color: TEXT }}>{data.finalDate}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── KPI Plan Modal ─────────────────────────────────────────────────────────────
function KpiPlanModal({ kpis, onClose }: { kpis: KpiItem[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Read-Only</p>
            <h2 className="text-[16px] font-bold" style={{ color: TEXT }}>Full KPI Plan</h2>
            <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>{LIVE_PERIOD}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <X size={18} style={{ color: MUTED }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC" }}>
                {["KPI Name", "KPI Level", "Target", "Frequency", "Final Score"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kpis.map((kpi, i) => (
                <tr key={kpi.id} className="hover:bg-[#F8FAFC] transition-colors"
                  style={{ borderBottom: i < kpis.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: TEXT }}>{kpi.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold"
                      style={{ backgroundColor: "#EEF3FC", color: BLUE }}>
                      {kpi.level}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: MUTED }}>{kpi.target}</td>
                  <td className="px-4 py-3" style={{ color: MUTED }}>{kpi.frequency}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold"
                      style={{ color: kpi.finalScore >= 80 ? GREEN : kpi.finalScore >= 70 ? AMBER : RED }}>
                      {kpi.finalScore.toFixed(1)}
                    </span>
                    <span className="ml-1" style={{ color: MUTED }}>/100</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Assessment History Modal ───────────────────────────────────────────────────
interface SelectedCheckpoint { kpi: KpiItem; checkpoint: KpiCheckpoint; }

function AssessmentHistoryModal({ kpis, onClose }: { kpis: KpiItem[]; onClose: () => void }) {
  const [selected, setSelected] = useState<SelectedCheckpoint | null>(null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            {selected && (
              <button onClick={() => setSelected(null)}
                className="flex items-center gap-1 text-[12px] font-medium hover:opacity-70 transition-opacity"
                style={{ color: BLUE }}>
                <ArrowLeft size={13} /> Back
              </button>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                {selected ? "Checkpoint Detail" : "KPI Assessment History"}
              </p>
              <h2 className="text-[15px] font-bold" style={{ color: TEXT }}>
                {selected ? selected.checkpoint.label : LIVE_PERIOD}
              </h2>
              {selected && (
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{selected.kpi.name}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <X size={18} style={{ color: MUTED }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div>
              {kpis.map((kpi, ki) => (
                <div key={kpi.id}>
                  <div className="px-6 py-3 sticky top-0 z-10"
                    style={{ backgroundColor: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-bold" style={{ color: TEXT }}>{kpi.name}</p>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded"
                        style={{ backgroundColor: "#EEF3FC", color: BLUE }}>
                        {kpi.level}
                      </span>
                      <span className="text-[11px]" style={{ color: MUTED }}>· {kpi.frequency}</span>
                    </div>
                  </div>
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr style={{ backgroundColor: "#FAFBFC" }}>
                        {["Review Checkpoint", "Status", "Self-Assessment", "Superior Assessment", ""].map(h => (
                          <th key={h} className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide"
                            style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {kpi.checkpoints.map((cp, ci) => (
                        <tr key={cp.label}
                          className={`transition-colors ${cp.status === "Completed" ? "hover:bg-[#F8FAFC] cursor-pointer" : ""}`}
                          onClick={() => cp.status === "Completed" && setSelected({ kpi, checkpoint: cp })}
                          style={{ borderBottom: ci < kpi.checkpoints.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                          <td className="px-4 py-3 font-medium" style={{ color: TEXT }}>{cp.label}</td>
                          <td className="px-4 py-3">
                            {cp.status === "Completed"
                              ? <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: GREEN }}>
                                  <CheckCircle2 size={11} /> Completed
                                </span>
                              : <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: MUTED }}>
                                  <Clock size={11} /> Pending
                                </span>
                            }
                          </td>
                          <td className="px-4 py-3" style={{ color: TEXT }}>
                            {cp.selfScore != null
                              ? <><span className="font-bold">{cp.selfScore}</span><span style={{ color: MUTED }}>/100</span></>
                              : <span style={{ color: MUTED }}>—</span>}
                          </td>
                          <td className="px-4 py-3" style={{ color: TEXT }}>
                            {cp.superiorScore != null
                              ? <><span className="font-bold">{cp.superiorScore}</span><span style={{ color: MUTED }}>/100</span></>
                              : <span style={{ color: MUTED }}>—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {cp.status === "Completed" && (
                              <button className="text-[11px] font-semibold hover:underline" style={{ color: BLUE }}>
                                View Details
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {ki < kpis.length - 1 && <div style={{ borderBottom: `2px solid ${BORDER}` }} />}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>KPI Name</p>
                  <p className="text-[13px] font-semibold" style={{ color: TEXT }}>{selected.kpi.name}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>Target</p>
                  <p className="text-[13px] font-semibold" style={{ color: TEXT }}>{selected.kpi.target}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>Self-Assessment Score</p>
                  <p className="text-[26px] font-bold" style={{ color: BLUE }}>
                    {selected.checkpoint.selfScore}
                    <span className="text-[13px]" style={{ color: MUTED }}>/100</span>
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>Superior Assessment Score</p>
                  <p className="text-[26px] font-bold" style={{ color: TEAL }}>
                    {selected.checkpoint.superiorScore}
                    <span className="text-[13px]" style={{ color: MUTED }}>/100</span>
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>Employee Comment / Evidence</p>
                <p className="text-[13px] leading-relaxed" style={{ color: TEXT }}>
                  {selected.checkpoint.selfComment || "—"}
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>Superior Assessment / Manager Comment</p>
                <p className="text-[13px] leading-relaxed" style={{ color: TEXT }}>
                  {selected.checkpoint.superiorComment || "—"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Attitude Evaluation Drawer ────────────────────────────────────────────────
function AttitudeDrawer({ attitude, onClose }: { attitude: AttitudeData; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.25)" }} onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 bg-white flex flex-col overflow-hidden"
        style={{ width: "clamp(400px, 42vw, 560px)", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
              Read-Only · {attitude.form}
            </p>
            <h2 className="text-[15px] font-bold" style={{ color: TEXT }}>Attitude Evaluation</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <X size={17} style={{ color: MUTED }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg text-center" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
              <p className="text-[10px]" style={{ color: MUTED }}>Form</p>
              <p className="text-[12px] font-bold mt-0.5" style={{ color: TEXT }}>{attitude.form}</p>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
              <p className="text-[10px]" style={{ color: MUTED }}>Superior Score</p>
              <p className="text-[22px] font-bold leading-snug" style={{ color: TEAL }}>
                {attitude.superiorScore.toFixed(1)}
              </p>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ backgroundColor: "#ECFDF5", border: "1px solid #6EE7B7" }}>
              <p className="text-[10px]" style={{ color: GREEN }}>Status</p>
              <p className="text-[12px] font-bold mt-0.5 flex items-center justify-center gap-1" style={{ color: GREEN }}>
                <CheckCircle2 size={12} /> {attitude.status}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 py-2 px-1 text-[10px] font-bold uppercase tracking-wide"
            style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}>
            <div className="col-span-2">Criterion</div>
            <div className="text-center">Self</div>
            <div className="text-center">Superior</div>
          </div>
          <div className="space-y-3">
            {attitude.criteria.map((c, i) => (
              <div key={i} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                <div className="grid grid-cols-4 px-4 py-2.5 items-center" style={{ backgroundColor: "#F8FAFC" }}>
                  <p className="col-span-2 text-[12px] font-semibold" style={{ color: TEXT }}>{c.criterion}</p>
                  <p className="text-center text-[13px] font-bold" style={{ color: BLUE }}>{c.selfScore}</p>
                  <p className="text-center text-[13px] font-bold" style={{ color: TEAL }}>{c.superiorScore}</p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {c.selfComment && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: MUTED }}>
                        Employee Comment
                      </p>
                      <p className="text-[12px] leading-relaxed" style={{ color: TEXT }}>{c.selfComment}</p>
                    </div>
                  )}
                  {c.managerComment && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: MUTED }}>
                        Manager Comment
                      </p>
                      <p className="text-[12px] leading-relaxed" style={{ color: TEXT }}>{c.managerComment}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function StaffProfileHR() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const empId    = id ?? "amir";
  const emp      = EMPLOYEES[empId] ?? EMPLOYEES.amir;
  const meta     = EMP_META[empId] ?? { dept: "Retail Banking", avatarColor: BLUE };
  const pd       = resolvePeriodData(empId, LIVE_PERIOD);
  const kpis     = KPI_DATA[empId] ?? [];
  const attitude = ATTITUDE_DATA[empId] ?? null;

  const [chartYears,     setChartYears]     = useState<3 | 5>(5);
  const [prevOpen,       setPrevOpen]       = useState(false);
  const [histDrawer,     setHistDrawer]     = useState<{ period: string; data: PeriodAppraisal } | null>(null);
  const [showKpiPlan,    setShowKpiPlan]    = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [showAttitude,   setShowAttitude]   = useState(false);

  const chartData = useMemo(
    () => chartYears === 3 ? emp.trendData.slice(-3) : emp.trendData,
    [chartYears, emp.trendData]
  );

  const selectedYear   = parseInt(LIVE_PERIOD.split(" ")[0]);
  const prevAppraisals = PERIOD_OPTIONS
    .filter(p => parseInt(p.split(" ")[0]) < selectedYear && emp.periods[p])
    .map(p => ({ period: p, data: emp.periods[p] }));

  return (
    <div style={{ backgroundColor: BG, minHeight: "calc(100vh - 56px)" }}>
      <div className="p-6 space-y-5">

        {/* ── 1. Header ── */}
        <div>
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[12px] mb-3 hover:opacity-70 transition-opacity"
            style={{ color: BLUE }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div className="bg-white rounded-lg p-5 flex items-center gap-4"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-[18px] font-bold shrink-0"
              style={{ backgroundColor: meta.avatarColor }}>
              {emp.initials}
            </div>
            <div className="flex-1">
              <h1 className="text-[20px] font-bold" style={{ color: TEXT }}>{emp.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-[12px]" style={{ color: MUTED }}>
                <span className="font-semibold" style={{ color: TEXT }}>{emp.staffId}</span>
                <span>·</span>
                <span>{emp.role}</span>
                <span>·</span>
                <span>{meta.dept}</span>
              </div>
              <p className="text-[11px] mt-1" style={{ color: MUTED }}>
                Review Period:{" "}
                <span className="font-semibold" style={{ color: BLUE }}>{LIVE_PERIOD}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── 2. Current Performance Score Cards ── */}
        {pd && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "KPI Performance Score",    value: pd.kpiScore,   color: BLUE,   note: `${selectedYear} Annual KPI Review result` },
              { label: "Attitude Evaluation Score", value: pd.attScore,   color: TEAL,   note: "Superior evaluation across core criteria" },
              { label: "Final Appraisal Score",     value: pd.finalScore, color: PURPLE, note: "Composite performance score" },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-lg p-5"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>{c.label}</p>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-[32px] font-bold leading-none" style={{ color: c.color }}>
                    {c.value.toFixed(1)}
                  </span>
                  <span className="text-[13px] mb-1" style={{ color: MUTED }}>/100</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${c.value}%`, backgroundColor: c.color }} />
                </div>
                <p className="text-[11px] mt-2" style={{ color: MUTED }}>{c.note}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── 3. Historical Performance Trend ── */}
        <div className="bg-white rounded-lg p-5"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Historical Performance Trend</h2>
            <div className="flex items-center gap-0.5 rounded-md p-0.5" style={{ border: `1px solid ${BORDER}` }}>
              {([3, 5] as const).map(y => (
                <button key={y} onClick={() => setChartYears(y)}
                  className="px-3 py-1 text-[11px] font-semibold rounded transition-colors"
                  style={chartYears === y
                    ? { backgroundColor: BLUE, color: "white" }
                    : { backgroundColor: "transparent", color: MUTED }
                  }>
                  {y} Years
                </button>
              ))}
            </div>
          </div>
          <p className="text-[12px] mb-4" style={{ color: MUTED }}>
            {chartYears}-year view of KPI, Attitude and Final scores for {emp.name}.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <ReTooltip contentStyle={{ fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8 }} />
              <Line type="monotone" dataKey="kpi"      name="KPI Score"     stroke={BLUE}   strokeWidth={2}   dot={{ r: 4, fill: BLUE }}   activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="attitude" name="Attitude Score" stroke={TEAL}   strokeWidth={2}   dot={{ r: 4, fill: TEAL }}   activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="final"    name="Final Score"   stroke={PURPLE} strokeWidth={2.5} dot={{ r: 5, fill: PURPLE }} activeDot={{ r: 7 }} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-5 mt-2">
            {[
              { label: "KPI Score",     color: BLUE   },
              { label: "Attitude Score",color: TEAL   },
              { label: "Final Score",   color: PURPLE },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[11px]" style={{ color: MUTED }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. KPI Performance ── */}
        {kpis.length > 0 && (
          <div className="bg-white rounded-lg overflow-hidden"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>KPI Performance</h2>
                <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>{LIVE_PERIOD}</p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setShowKpiPlan(true)}
                  className="text-[12px] font-semibold hover:underline"
                  style={{ color: BLUE }}>
                  View Full KPI Plan →
                </button>
                <button onClick={() => setShowAssessment(true)}
                  className="text-[12px] font-semibold hover:underline"
                  style={{ color: TEAL }}>
                  View Assessment History →
                </button>
              </div>
            </div>
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC" }}>
                  {["KPI Name", "KPI Level", "Target", "Annual Superior Assessment Score"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kpis.map((kpi, i) => (
                  <tr key={kpi.id} className="hover:bg-[#F8FAFC] transition-colors"
                    style={{ borderBottom: i < kpis.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: TEXT }}>{kpi.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold"
                        style={{ backgroundColor: "#EEF3FC", color: BLUE }}>
                        {kpi.level}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: MUTED }}>{kpi.target}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold"
                        style={{ color: kpi.finalScore >= 80 ? GREEN : kpi.finalScore >= 70 ? AMBER : RED }}>
                        {kpi.finalScore.toFixed(1)}
                      </span>
                      <span className="ml-1" style={{ color: MUTED }}>/100</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 5. Attitude Evaluation ── */}
        {attitude && (
          <div className="bg-white rounded-lg p-5"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Attitude Evaluation</h2>
                <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>{LIVE_PERIOD}</p>
              </div>
              <button onClick={() => setShowAttitude(true)}
                className="text-[12px] font-semibold hover:underline"
                style={{ color: TEAL }}>
                View Attitude Evaluation →
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>Applicable Form</p>
                <p className="text-[13px] font-semibold" style={{ color: TEXT }}>{attitude.form}</p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>Superior Evaluation Score</p>
                <div className="flex items-end gap-1">
                  <span className="text-[22px] font-bold" style={{ color: TEAL }}>{attitude.superiorScore.toFixed(1)}</span>
                  <span className="text-[12px] mb-0.5" style={{ color: MUTED }}>/100</span>
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#ECFDF5", border: "1px solid #6EE7B7" }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: GREEN }}>Status</p>
                <p className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: GREEN }}>
                  <CheckCircle2 size={14} /> {attitude.status}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── 6. Previous Appraisals — exact Screen 5 table + HistoryDrawer ── */}
        {prevAppraisals.length > 0 && (
          <div className="bg-white rounded-lg overflow-hidden"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <button onClick={() => setPrevOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-center gap-2">
                {prevOpen
                  ? <ChevronDown  size={15} style={{ color: MUTED }} />
                  : <ChevronRight size={15} style={{ color: MUTED }} />
                }
                <p className="text-[13px] font-semibold" style={{ color: TEXT }}>Previous Appraisals</p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: "#F3F4F6", color: MUTED }}>
                  {prevAppraisals.length}
                </span>
              </div>
              <p className="text-[12px]" style={{ color: MUTED }}>
                {prevOpen ? "Collapse" : "View historical appraisal records"}
              </p>
            </button>
            {prevOpen && (
              <div style={{ borderTop: `1px solid ${BORDER}` }}>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ backgroundColor: "#F8FAFC" }}>
                      {["Review Period", "Final Score", "Manager Recommendation", "Appraisal Status", "HR Final Decision", "Action"].map(h => (
                        <th key={h}
                          className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                          style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prevAppraisals.map(({ period, data: d }, i) => {
                      const pss = STATUS_STYLE[d.status];
                      const finalDisplay = (d.hrFinalScore ?? d.finalScore).toFixed(1);
                      return (
                        <tr key={period} className="hover:bg-[#F8FAFC] transition-colors"
                          style={{ borderBottom: i < prevAppraisals.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                          <td className="px-4 py-3 font-medium" style={{ color: TEXT }}>
                            {period.split(" ")[0]}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold" style={{ color: PURPLE }}>{finalDisplay}</span>
                            <span className="ml-1" style={{ color: MUTED }}>/100</span>
                          </td>
                          <td className="px-4 py-3" style={{ color: TEXT }}>{d.managerDecision ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                              style={{ color: pss.color, backgroundColor: pss.bg }}>
                              {d.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium" style={{ color: GREEN }}>
                            {d.hrDecision ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => setHistDrawer({ period, data: d })}
                              className="text-[11px] font-semibold hover:underline"
                              style={{ color: BLUE }}>
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Overlays ── */}
      {showKpiPlan    && <KpiPlanModal kpis={kpis} onClose={() => setShowKpiPlan(false)} />}
      {showAssessment && <AssessmentHistoryModal kpis={kpis} onClose={() => setShowAssessment(false)} />}
      {showAttitude   && attitude && <AttitudeDrawer attitude={attitude} onClose={() => setShowAttitude(false)} />}
      {histDrawer     && (
        <HistoryDrawer period={histDrawer.period} data={histDrawer.data} onClose={() => setHistDrawer(null)} />
      )}
    </div>
  );
}
