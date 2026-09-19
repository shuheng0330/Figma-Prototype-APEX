import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Target, Flag, CheckCircle, Lock, Plus, X, UserCheck, ShieldCheck,
  Calendar, Route, Handshake, Eye, ChevronRight, BookOpen,
} from "lucide-react";
import { useRole, ROLE_META, scopeOf, canEdit } from "../access";
import {
  IDPS, STAFF, COURSES, COMPETENCIES, PATH_TEMPLATES, ROLE_IDENTITY,
  GOAL_STATE_STYLE, staffById, teamOf, courseById,
  addGoal, updateGoal, setIdpPath, fmtDate, useStoreVersion,
  type DevelopmentGoal, type GoalState,
} from "../trainingStore";

const TEAL = "#00C9A7";
const TEXT = "#1A1F2E";
const MUTED = "#9CA3AF";
const BORDER = "#E5E7EB";
const PALETTE = ["#00C9A7", "#3B82F6", "#7C3AED", "#D97706", "#DC2626", "#0891B2"];

/** A goal is only "Agreed" once HR and the superior have both signed off. */
function deriveState(g: DevelopmentGoal): GoalState {
  if (g.progress >= 100) return "Achieved";
  return g.hrApproved && g.superiorApproved ? "Agreed" : "Proposed";
}

export function IdpManagement() {
  const role = useRole();
  useStoreVersion();
  const myId = ROLE_IDENTITY[role] ?? "E001";
  const scope = scopeOf(role, "idp");
  const editable = canEdit(role, "idp");
  const me = staffById(myId);

  // Which plans this role may open.
  const visible = useMemo(() => {
    if (scope === "all")  return IDPS;
    if (scope === "team") {
      const ids = new Set(teamOf(myId).map(s => s.id));
      return IDPS.filter(i => ids.has(i.staffId));
    }
    return IDPS.filter(i => i.staffId === myId);
  }, [scope, myId]);

  const [staffId, setStaffId] = useState(visible[0]?.staffId ?? "");
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [competency, setCompetency] = useState(COMPETENCIES[0]);
  const [targetDate, setTargetDate] = useState("2026-12-31");
  const [linked, setLinked] = useState<string[]>([]);

  const idp = visible.find(i => i.staffId === staffId) ?? visible[0];
  const staff = idp ? staffById(idp.staffId) : undefined;
  const hrOwner = idp ? staffById(idp.hrOwnerId) : undefined;
  const superior = idp ? staffById(idp.superiorId) : undefined;
  const path = idp?.pathTemplateId ? PATH_TEMPLATES.find(t => t.id === idp.pathTemplateId) : undefined;

  // Which half of the joint ownership is this viewer acting as?
  const actingAsHr = role === "hr" || role === "admin";
  const actingAsSuperior = idp ? role === "manager" && idp.superiorId === myId : false;

  if (!idp || !staff) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl p-8 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <Target size={28} className="mx-auto mb-3" style={{ color: "#D1D5DB" }} />
          <p className="text-[14px] font-bold" style={{ color: TEXT }}>No development plan available</p>
          <p className="text-[12px] mt-1" style={{ color: MUTED }}>HR creates the plan jointly with the staff member&apos;s superior.</p>
        </div>
      </div>
    );
  }

  const agreed = idp.goals.filter(g => deriveState(g) !== "Proposed").length;
  const achieved = idp.goals.filter(g => deriveState(g) === "Achieved").length;
  const avgProgress = idp.goals.length
    ? Math.round(idp.goals.reduce((a, g) => a + g.progress, 0) / idp.goals.length)
    : 0;

  function submitGoal() {
    if (!title.trim() || !idp) return;
    addGoal(idp.staffId, {
      id: `G${Date.now()}`,
      title: title.trim(),
      competency,
      targetDate,
      progress: 0,
      state: "Proposed",
      proposedBy: myId,
      hrApproved: actingAsHr,
      superiorApproved: actingAsSuperior,
      linkedCourseIds: linked,
      color: PALETTE[idp.goals.length % PALETTE.length],
    });
    setTitle(""); setLinked([]); setShowAdd(false);
  }

  return (
    <div className="p-6" style={{ backgroundColor: "#F4F6F9", minHeight: "calc(100vh - 56px)" }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-[19px] font-extrabold" style={{ color: TEXT }}>Individual Development Plan</h1>
          <p className="text-[12px] mt-1" style={{ color: MUTED }}>
            Jointly owned by HR and the staff member&apos;s superior — not set by the employee alone
          </p>
        </div>
        <div className="flex items-end gap-2">
          {visible.length > 1 && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: MUTED }}>
                Plan for
              </label>
              <select value={idp.staffId} onChange={e => setStaffId(e.target.value)}
                className="px-3 py-2 rounded-lg text-[12px] bg-white focus:outline-none"
                style={{ border: `1px solid ${BORDER}`, color: TEXT, minWidth: 210 }}>
                {visible.map(i => {
                  const s = staffById(i.staffId);
                  return <option key={i.staffId} value={i.staffId}>{s?.name} — {s?.position}</option>;
                })}
              </select>
            </div>
          )}
          <span className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
            style={{ color: ROLE_META[role].color, backgroundColor: ROLE_META[role].bg }}>
            {ROLE_META[role].label}
          </span>
        </div>
      </div>

      {/* ── Read-only notice for staff ───────────────────────────────────── */}
      {!editable && (
        <div className="rounded-xl px-5 py-3.5 mb-4 flex items-start gap-2.5" style={{ backgroundColor: "#F9FAFB" }}>
          <Eye size={14} className="mt-0.5 shrink-0" style={{ color: MUTED }} />
          <p className="text-[12px] leading-relaxed" style={{ color: "#6B7280" }}>
            You can follow your plan and see progress here, but goals are set and approved by
            <b> HR ({hrOwner?.name})</b> together with your superior <b>({superior?.name})</b>.
            Raise a suggestion with either of them and it will appear as a proposed goal.
          </p>
        </div>
      )}

      <div className="grid grid-cols-[1fr_300px] gap-4 items-start">

        {/* ── Goals ─────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Plan summary */}
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[13px] font-extrabold"
                  style={{ backgroundColor: staff.color }}>{staff.initials}</div>
                <div>
                  <p className="text-[14px] font-extrabold" style={{ color: TEXT }}>{staff.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                    {staff.position} · {staff.dept} · {idp.period}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {[
                  { label: "Goals", value: idp.goals.length, color: TEXT },
                  { label: "Agreed", value: agreed, color: "#1D4ED8" },
                  { label: "Achieved", value: achieved, color: "#059669" },
                  { label: "Progress", value: `${avgProgress}%`, color: TEAL },
                ].map(s => (
                  <div key={s.label} className="text-center px-3 py-2 rounded-lg" style={{ backgroundColor: "#F9FAFB", minWidth: 68 }}>
                    <p className="text-[16px] font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[9px] font-semibold uppercase tracking-wide mt-1" style={{ color: MUTED }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Joint ownership strip */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t" style={{ borderColor: "#F3F4F6" }}>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#ECFEFF" }}>
                <ShieldCheck size={14} className="shrink-0" style={{ color: "#0891B2" }} />
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#0E7490" }}>HR owner</p>
                  <p className="text-[12px] font-semibold truncate" style={{ color: "#155E75" }}>{hrOwner?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#EFF6FF" }}>
                <UserCheck size={14} className="shrink-0" style={{ color: "#1D4ED8" }} />
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#1D4ED8" }}>Superior</p>
                  <p className="text-[12px] font-semibold truncate" style={{ color: "#1E40AF" }}>{superior?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#F9FAFB" }}>
                <Calendar size={14} className="shrink-0" style={{ color: MUTED }} />
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>Joint review</p>
                  <p className="text-[12px] font-semibold truncate" style={{ color: TEXT }}>{fmtDate(idp.reviewDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Goal list */}
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Flag size={15} style={{ color: "#7C3AED" }} />
                <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Development goals</h2>
              </div>
              {editable && (
                <button onClick={() => setShowAdd(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white"
                  style={{ backgroundColor: TEAL }}>
                  {showAdd ? <><X size={11} /> Cancel</> : <><Plus size={11} /> Propose goal</>}
                </button>
              )}
            </div>
            <p className="text-[11px] mb-4" style={{ color: MUTED }}>
              A goal becomes active only after both HR and the superior approve it.
            </p>

            {/* Add form */}
            {showAdd && editable && (
              <div className="rounded-lg border p-4 mb-4" style={{ borderColor: TEAL, backgroundColor: "#F0FDFA" }}>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: MUTED }}>Goal</label>
                    <input value={title} onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Complete Advanced HVAC certification"
                      className="w-full px-3 py-2 rounded-lg text-[12px] bg-white focus:outline-none"
                      style={{ border: `1px solid ${BORDER}`, color: TEXT }} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: MUTED }}>Competency</label>
                    <select value={competency} onChange={e => setCompetency(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-[12px] bg-white focus:outline-none"
                      style={{ border: `1px solid ${BORDER}`, color: TEXT }}>
                      {COMPETENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: MUTED }}>Target date</label>
                    <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-[12px] bg-white focus:outline-none"
                      style={{ border: `1px solid ${BORDER}`, color: TEXT }} />
                  </div>
                </div>

                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: MUTED }}>
                  Link training (optional)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {COURSES.slice(0, 10).map(c => {
                    const on = linked.includes(c.id);
                    return (
                      <button key={c.id}
                        onClick={() => setLinked(l => on ? l.filter(x => x !== c.id) : [...l, c.id])}
                        className="px-2 py-1 rounded-full text-[10px] font-semibold border transition-all"
                        style={on
                          ? { backgroundColor: TEAL, color: "white", borderColor: TEAL }
                          : { backgroundColor: "white", color: "#6B7280", borderColor: BORDER }}>
                        {c.emoji} {c.title}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-[10px]" style={{ color: MUTED }}>
                    Proposed as {actingAsHr ? "HR" : actingAsSuperior ? "the superior" : "a viewer"} — the other
                    party still needs to approve.
                  </p>
                  <button onClick={submitGoal} disabled={!title.trim()}
                    className="px-4 py-2 rounded-lg text-[12px] font-bold text-white"
                    style={{ backgroundColor: title.trim() ? TEAL : "#D1D5DB" }}>
                    Add goal
                  </button>
                </div>
              </div>
            )}

            {/* Goals */}
            <div className="space-y-3">
              {idp.goals.map(g => {
                const state = deriveState(g);
                const st = GOAL_STATE_STYLE[state];
                const proposer = staffById(g.proposedBy);
                return (
                  <div key={g.id} className="rounded-lg border px-4 py-3.5"
                    style={{ borderColor: BORDER, backgroundColor: state === "Achieved" ? "#F0FDF9" : "white" }}>

                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-[13px] font-semibold" style={{ color: TEXT }}>{g.title}</p>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ color: st.color, backgroundColor: st.bg }}>
                            {state}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 text-[10px]" style={{ color: MUTED }}>
                            <Calendar size={10} /> Target {fmtDate(g.targetDate)}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ backgroundColor: `${g.color}18`, color: g.color }}>{g.competency}</span>
                          <span className="text-[10px]" style={{ color: MUTED }}>Proposed by {proposer?.name ?? "—"}</span>
                        </div>
                      </div>
                      <span className="text-[14px] font-extrabold shrink-0" style={{ color: state === "Achieved" ? "#059669" : g.color }}>
                        {g.progress}%
                      </span>
                    </div>

                    <div className="w-full rounded-full mb-3" style={{ height: 5, backgroundColor: "#F3F4F6" }}>
                      <div className="rounded-full transition-all"
                        style={{ height: 5, width: `${g.progress}%`, backgroundColor: state === "Achieved" ? "#059669" : g.color }} />
                    </div>

                    {/* Linked training */}
                    {g.linkedCourseIds.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        <BookOpen size={10} style={{ color: MUTED }} />
                        {g.linkedCourseIds.map(id => {
                          const c = courseById(id);
                          return c ? (
                            <span key={id} className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                              style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>
                              {c.emoji} {c.title}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Joint sign-off */}
                    <div className="flex items-center justify-between gap-3 pt-2.5 border-t flex-wrap" style={{ borderColor: "#F3F4F6" }}>
                      <div className="flex items-center gap-2">
                        {[
                          { who: "HR", on: g.hrApproved, allowed: actingAsHr, key: "hrApproved" as const, color: "#0891B2" },
                          { who: "Superior", on: g.superiorApproved, allowed: actingAsSuperior, key: "superiorApproved" as const, color: "#1D4ED8" },
                        ].map(sig => (
                          <button
                            key={sig.who}
                            disabled={!sig.allowed || !editable}
                            onClick={() => updateGoal(idp.staffId, g.id, { [sig.key]: !sig.on })}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all"
                            style={{
                              backgroundColor: sig.on ? `${sig.color}18` : "#F9FAFB",
                              color: sig.on ? sig.color : "#9CA3AF",
                              border: `1px solid ${sig.on ? sig.color : BORDER}`,
                              cursor: sig.allowed && editable ? "pointer" : "default",
                            }}
                          >
                            {sig.on ? <CheckCircle size={10} /> : <Lock size={10} />} {sig.who} {sig.on ? "approved" : "pending"}
                          </button>
                        ))}
                      </div>

                      {editable && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]" style={{ color: MUTED }}>Progress</span>
                          <input
                            type="range" min={0} max={100} step={5} value={g.progress}
                            onChange={e => updateGoal(idp.staffId, g.id, { progress: Number(e.target.value) })}
                            style={{ width: 96, accentColor: g.color }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Side column ───────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Learning path on the plan */}
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Route size={14} style={{ color: TEAL }} />
              <h3 className="text-[13px] font-bold" style={{ color: TEXT }}>Assigned learning path</h3>
            </div>
            <p className="text-[11px] mb-3" style={{ color: MUTED }}>Set by HR or the superior alongside the goals.</p>

            {editable ? (
              <select
                value={idp.pathTemplateId ?? ""}
                onChange={e => setIdpPath(idp.staffId, e.target.value || undefined)}
                className="w-full px-3 py-2 rounded-lg text-[12px] bg-white focus:outline-none mb-3"
                style={{ border: `1px solid ${BORDER}`, color: TEXT }}
              >
                <option value="">No path assigned</option>
                {PATH_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            ) : null}

            {path ? (
              <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: "#F0FDFA" }}>
                <p className="text-[12px] font-bold" style={{ color: "#047857" }}>{path.name}</p>
                <p className="text-[10px] mt-1" style={{ color: "#059669" }}>
                  {path.steps.length} steps · {path.durationWeeks} weeks · {path.targetRole}
                </p>
                <div className="mt-2.5 space-y-1">
                  {path.steps.map(s => {
                    const c = courseById(s.courseId);
                    return (
                      <div key={s.order} className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                          style={{ backgroundColor: s.mandatory ? "#DC2626" : TEAL }}>{s.order}</span>
                        <span className="text-[10px] truncate" style={{ color: "#065F46" }}>{c?.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-[11px] py-2" style={{ color: MUTED }}>No path assigned yet.</p>
            )}

            <Link to="/learning-paths" className="flex items-center justify-center gap-1 mt-3 py-2 rounded-lg text-[11px] font-bold"
              style={{ backgroundColor: "#F4F6F9", color: TEAL }}>
              Manage learning paths <ChevronRight size={11} />
            </Link>
          </div>

          {/* Ownership explainer */}
          <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: "#ECFEFF" }}>
            <div className="flex items-start gap-2">
              <Handshake size={14} className="mt-0.5 shrink-0" style={{ color: "#0891B2" }} />
              <div>
                <p className="text-[11px] font-bold mb-1" style={{ color: "#155E75" }}>Joint ownership</p>
                <p className="text-[10px] leading-relaxed" style={{ color: "#0E7490" }}>
                  HR proposes and approves on the company side; the superior approves on the team side.
                  A goal stays <b>Proposed</b> until both have signed off, then becomes <b>Agreed</b>.
                  The employee can view and work the plan but cannot self-approve goals.
                </p>
              </div>
            </div>
          </div>

          {/* Your permissions here */}
          <div className="bg-white rounded-xl p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: MUTED }}>Your rights here</p>
            {[
              { label: "View plan",        on: true },
              { label: "Propose goals",    on: editable },
              { label: "Approve as HR",    on: actingAsHr && editable },
              { label: "Approve as superior", on: actingAsSuperior && editable },
              { label: "Assign learning path", on: editable },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-2 py-1">
                {r.on
                  ? <CheckCircle size={12} style={{ color: "#059669" }} />
                  : <Lock size={12} style={{ color: "#D1D5DB" }} />}
                <span className="text-[11px]" style={{ color: r.on ? TEXT : MUTED }}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
