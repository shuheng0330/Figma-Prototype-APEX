import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Target, Package, Brain, TrendingUp, CheckCircle, Clock, Info,
  ChevronRight, Award, CalendarCheck,
} from "lucide-react";
import { useRole, ROLE_META, scopeOf } from "../access";
import {
  STAFF, COURSES, IDPS, ROLE_IDENTITY, KPI_STYLE,
  staffById, teamOf, kpiFor, completedSessionsFor, pendingSessionsFor,
  fmtDate, useStoreVersion,
} from "../trainingStore";

const TEAL = "#00C9A7";
const TEXT = "#1A1F2E";
const MUTED = "#9CA3AF";
const BORDER = "#E5E7EB";

/** Weighting agreed with performance management. */
const WEIGHTS = { product: 40, skill: 60 };

export function TrainingKpi() {
  const role = useRole();
  useStoreVersion();
  const myId = ROLE_IDENTITY[role] ?? "E001";
  const scope = scopeOf(role, "training-kpi");

  const visible = useMemo(() => {
    if (scope === "all")  return STAFF;
    if (scope === "team") return [staffById(myId)!, ...teamOf(myId)].filter(Boolean);
    return [staffById(myId)!].filter(Boolean);
  }, [scope, myId]);

  const [staffId, setStaffId] = useState(myId);
  const staff = staffById(visible.some(s => s.id === staffId) ? staffId : visible[0]?.id ?? myId);
  const kpi = kpiFor(staff?.id ?? myId);
  const done = completedSessionsFor(staff?.id ?? myId);
  const pending = pendingSessionsFor(staff?.id ?? myId);
  const idp = IDPS.find(i => i.staffId === staff?.id);

  const courseRows = COURSES.filter(c => c.progress >= 100);

  const cards = [
    {
      key: "Product Training" as const, icon: Package, weight: WEIGHTS.product,
      data: kpi.product, blurb: "Product, model and technical knowledge training",
    },
    {
      key: "Skill-Based Training" as const, icon: Brain, weight: WEIGHTS.skill,
      data: kpi.skill, blurb: "Soft skills, compliance, leadership and process training",
    },
  ];

  return (
    <div className="p-6" style={{ backgroundColor: "#F4F6F9", minHeight: "calc(100vh - 56px)" }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[19px] font-extrabold" style={{ color: TEXT }}>Training KPI Contribution</h1>
          <p className="text-[12px] mt-1" style={{ color: MUTED }}>
            Completed training feeds performance management, split into Product and Skill-Based training
          </p>
        </div>
        <div className="flex items-end gap-2">
          {visible.length > 1 && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: MUTED }}>Staff</label>
              <select value={staff?.id} onChange={e => setStaffId(e.target.value)}
                className="px-3 py-2 rounded-lg text-[12px] bg-white focus:outline-none"
                style={{ border: `1px solid ${BORDER}`, color: TEXT, minWidth: 210 }}>
                {visible.map(s => <option key={s.id} value={s.id}>{s.name} — {s.dept}</option>)}
              </select>
            </div>
          )}
          <span className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
            style={{ color: ROLE_META[role].color, backgroundColor: ROLE_META[role].bg }}>
            {ROLE_META[role].label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-4 items-start">
        <div className="space-y-4">

          {/* ── Category cards ────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            {cards.map(({ key, icon: Icon, weight, data, blurb }) => {
              const style = KPI_STYLE[key];
              const pct = Math.min(100, Math.round((data.done / data.target) * 100));
              return (
                <div key={key} className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: style.bg }}>
                        <Icon size={14} style={{ color: style.color }} />
                      </div>
                      <h2 className="text-[13px] font-bold" style={{ color: TEXT }}>{key}</h2>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: style.color, backgroundColor: style.bg }}>
                      {weight}% of KPI
                    </span>
                  </div>

                  <div className="flex items-end gap-2 mb-2">
                    <p className="text-[30px] font-extrabold leading-none" style={{ color: style.color }}>{data.done}</p>
                    <p className="text-[13px] font-semibold mb-1" style={{ color: MUTED }}>/ {data.target} required</p>
                  </div>

                  <div className="rounded-full overflow-hidden mb-2" style={{ height: 6, backgroundColor: "#F3F4F6" }}>
                    <div className="rounded-full transition-all" style={{ height: 6, width: `${pct}%`, backgroundColor: style.color }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[11px]" style={{ color: MUTED }}>{blurb}</p>
                    <span className="flex items-center gap-1 text-[11px] font-bold shrink-0" style={{ color: style.color }}>
                      <Clock size={10} /> {data.hours}h
                    </span>
                  </div>

                  {data.done < data.target && (
                    <p className="text-[10px] mt-2 font-semibold" style={{ color: "#B45309" }}>
                      {data.target - data.done} more to hit target
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Records feeding the KPI ───────────────────────────────── */}
          <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ borderColor: "#F3F4F6" }}>
              <CheckCircle size={15} style={{ color: "#059669" }} />
              <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Completions counted</h2>
              <span className="text-[11px] ml-1" style={{ color: MUTED }}>
                {done.length + courseRows.length} records
              </span>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr style={{ backgroundColor: "#F9FAFB" }}>
                  {["Training", "Category", "Source", "Date", "Score"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider border-b"
                      style={{ color: MUTED, borderColor: "#F3F4F6" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#F9FAFB" }}>
                {done.map(({ reg, session }) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-[12px] font-semibold" style={{ color: TEXT }}>{session.title}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ color: KPI_STYLE[session.kpi].color, backgroundColor: KPI_STYLE[session.kpi].bg }}>
                        {session.kpi}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[11px]" style={{ color: "#6B7280" }}>
                      {session.kind} · attendance recorded
                    </td>
                    <td className="px-4 py-2.5 text-[11px]" style={{ color: MUTED }}>{fmtDate(session.date)}</td>
                    <td className="px-4 py-2.5 text-[12px] font-bold" style={{ color: TEXT }}>
                      {reg.quizScore != null ? `${reg.quizScore}%` : "—"}
                    </td>
                  </tr>
                ))}
                {courseRows.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-[12px] font-semibold" style={{ color: TEXT }}>{c.emoji} {c.title}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ color: KPI_STYLE[c.kpi].color, backgroundColor: KPI_STYLE[c.kpi].bg }}>
                        {c.kpi}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[11px]" style={{ color: "#6B7280" }}>{c.delivery} · e-learning progress</td>
                    <td className="px-4 py-2.5 text-[11px]" style={{ color: MUTED }}>—</td>
                    <td className="px-4 py-2.5 text-[12px] font-bold" style={{ color: TEXT }}>100%</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pending.length > 0 && (
              <div className="px-5 py-3.5 border-t" style={{ borderColor: "#F3F4F6", backgroundColor: "#FFFBEB" }}>
                <p className="text-[11px] font-bold mb-1.5" style={{ color: "#92400E" }}>
                  Not counted yet — attendance not recorded ({pending.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pending.map(({ session, reg }) => (
                    <span key={session.id} className="px-2 py-1 rounded-md text-[10px] font-semibold bg-white"
                      style={{ color: "#B45309", border: "1px solid #FDE68A" }}>
                      {session.title} · {reg.status}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Side column ───────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Score */}
          <div className="bg-white rounded-xl p-5 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: MUTED }}>Training KPI score</p>
            <div className="relative mx-auto mb-3" style={{ width: 108, height: 108 }}>
              <svg width="108" height="108" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="54" cy="54" r="46" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                <circle cx="54" cy="54" r="46" fill="none" stroke={TEAL} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(kpi.score / 100) * 289} 289`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[26px] font-extrabold leading-none" style={{ color: TEXT }}>{kpi.score}</p>
                <p className="text-[10px]" style={{ color: MUTED }}>of 100</p>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: MUTED }}>
              {WEIGHTS.product}% product · {WEIGHTS.skill}% skill-based, weighted against each target.
            </p>
            <Link to="/performance/my-kpi-plan"
              className="flex items-center justify-center gap-1 mt-3 py-2 rounded-lg text-[11px] font-bold"
              style={{ backgroundColor: "#F4F6F9", color: TEAL }}>
              Open KPI plan <ChevronRight size={11} />
            </Link>
          </div>

          {/* IDP link */}
          {idp && (
            <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} style={{ color: "#7C3AED" }} />
                <h3 className="text-[13px] font-bold" style={{ color: TEXT }}>Linked to IDP</h3>
              </div>
              <p className="text-[11px] mb-2.5" style={{ color: MUTED }}>
                {idp.goals.filter(g => g.linkedCourseIds.length).length} goals reference training directly.
              </p>
              {idp.goals.filter(g => g.linkedCourseIds.length).slice(0, 3).map(g => (
                <div key={g.id} className="flex items-center gap-2 py-1.5">
                  <Award size={11} style={{ color: g.color }} />
                  <span className="text-[11px] truncate" style={{ color: "#6B7280" }}>{g.title}</span>
                </div>
              ))}
              <Link to="/idp" className="flex items-center justify-center gap-1 mt-2 py-2 rounded-lg text-[11px] font-bold"
                style={{ backgroundColor: "#F4F6F9", color: TEAL }}>
                Open IDP <ChevronRight size={11} />
              </Link>
            </div>
          )}

          {/* Rule */}
          <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: "#EFF6FF" }}>
            <div className="flex items-start gap-2">
              <Info size={13} className="mt-0.5 shrink-0" style={{ color: "#1D4ED8" }} />
              <p className="text-[10px] leading-relaxed" style={{ color: "#1E40AF" }}>
                A classroom or sharing session counts only once attendance has been recorded against the
                calendar event. E-learning counts at 100% module completion.
              </p>
            </div>
          </div>

          <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: "#F0FDFA" }}>
            <div className="flex items-start gap-2">
              <CalendarCheck size={13} className="mt-0.5 shrink-0" style={{ color: "#047857" }} />
              <p className="text-[10px] leading-relaxed" style={{ color: "#065F46" }}>
                HR and the superior review this split at the joint IDP review on{" "}
                {idp ? fmtDate(idp.reviewDate) : "the next cycle"}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
