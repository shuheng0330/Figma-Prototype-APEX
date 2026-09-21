import { useMemo, useState } from "react";
import {
  Route, Users, Building2, CheckCircle, Lock, Plus, X, Layers,
  UserPlus, Sparkles, ChevronRight, Info, GraduationCap,
} from "lucide-react";
import { useRole, ROLE_META, scopeOf, canEdit } from "../access";
import {
  PATH_TEMPLATES, DEPARTMENTS, STAFF, COURSES, IDPS, ROLE_IDENTITY,
  LARGE_DEPT_THRESHOLD, KPI_STYLE, catStyle,
  isLargeDept, courseById, staffById, teamOf, assignTemplateToDept, setIdpPath,
  fmtDate, useStoreVersion,
} from "../trainingStore";

const TEAL = "#00C9A7";
const TEXT = "#1A1F2E";
const MUTED = "#9CA3AF";
const BORDER = "#E5E7EB";

export function LearningPaths() {
  const role = useRole();
  useStoreVersion();
  const myId = ROLE_IDENTITY[role] ?? "E013";
  const scope = scopeOf(role, "learning-paths");
  const editable = canEdit(role, "learning-paths");

  const me = staffById(myId);

  // Managers work within their own department; HR and Super Admin see everything.
  const visibleDepts = useMemo(
    () => (scope === "all" ? DEPARTMENTS : DEPARTMENTS.filter(d => d.name === me?.dept)),
    [scope, me],
  );
  const visibleTemplates = useMemo(
    () => (scope === "all" ? PATH_TEMPLATES : PATH_TEMPLATES.filter(t => t.dept === me?.dept || t.dept === "All")),
    [scope, me],
  );

  const [selectedId, setSelectedId] = useState(visibleTemplates[0]?.id ?? "");
  const [manualStaff, setManualStaff] = useState<string>("");
  const [toast, setToast] = useState("");

  const template = visibleTemplates.find(t => t.id === selectedId) ?? visibleTemplates[0];

  const manualCandidates = useMemo(() => {
    const smallDeptNames = new Set(visibleDepts.filter(d => !isLargeDept(d)).map(d => d.name));
    const pool = scope === "all" ? STAFF : [...teamOf(myId), ...(me ? [me] : [])];
    return pool.filter(s => smallDeptNames.has(s.dept) || scope !== "all");
  }, [visibleDepts, scope, myId, me]);

  function flash(msg: string) { setToast(msg); window.setTimeout(() => setToast(""), 2600); }

  function toggleDept(dept: string) {
    if (!template || !editable) return;
    assignTemplateToDept(template.id, dept);
    flash(`${template.name} ${template.assignedTo.includes(dept) ? "assigned to" : "removed from"} ${dept}`);
  }

  function assignManually(staffId: string) {
    if (!template || !editable) return;
    setIdpPath(staffId, template.id);
    flash(`${template.name} assigned to ${staffById(staffId)?.name} individually`);
    setManualStaff("");
  }

  return (
    <div className="p-6" style={{ backgroundColor: "#F4F6F9", minHeight: "calc(100vh - 56px)" }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[19px] font-extrabold" style={{ color: TEXT }}>Learning Paths</h1>
          <p className="text-[12px] mt-1" style={{ color: MUTED }}>
            Standardised role-based templates for large departments · manual picks for small teams
          </p>
        </div>
        <div className="flex items-center gap-2">
          {toast && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
              style={{ backgroundColor: "#ECFDF5", color: "#065F46" }}>
              <CheckCircle size={12} /> {toast}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ color: ROLE_META[role].color, backgroundColor: ROLE_META[role].bg }}>
            {ROLE_META[role].label} · {scope === "all" ? "company-wide" : `${me?.dept ?? "team"} only`}
          </span>
        </div>
      </div>

      {/* ── Rule banner ──────────────────────────────────────────────────── */}
      <div className="rounded-xl px-5 py-3.5 mb-4 flex items-start gap-2.5" style={{ backgroundColor: "#EFF6FF" }}>
        <Info size={14} className="mt-0.5 shrink-0" style={{ color: "#1D4ED8" }} />
        <p className="text-[12px] leading-relaxed" style={{ color: "#1E40AF" }}>
          Departments with <b>{LARGE_DEPT_THRESHOLD} or more staff</b> are assigned through a role-based
          template so everyone in the role gets the same sequence. Smaller teams are assigned manually,
          person by person, by HR or the staff member&apos;s superior.
        </p>
      </div>

      <div className="grid grid-cols-[260px_1fr_300px] gap-4 items-start">

        {/* ── Template list ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <div className="px-4 py-3.5 border-b flex items-center gap-2" style={{ borderColor: "#F3F4F6" }}>
            <Route size={14} style={{ color: TEAL }} />
            <p className="text-[13px] font-bold" style={{ color: TEXT }}>Templates</p>
            <span className="ml-auto text-[11px]" style={{ color: MUTED }}>{visibleTemplates.length}</span>
          </div>
          <div className="p-2">
            {visibleTemplates.map(t => {
              const active = t.id === template?.id;
              return (
                <button key={t.id} onClick={() => setSelectedId(t.id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors"
                  style={active ? { backgroundColor: "#E8FAF7" } : { backgroundColor: "transparent" }}>
                  <p className="text-[12px] font-bold leading-snug" style={{ color: active ? "#047857" : TEXT }}>{t.name}</p>
                  <p className="text-[10px] mt-1" style={{ color: MUTED }}>
                    {t.targetRole} · {t.steps.length} steps · {t.durationWeeks}w
                  </p>
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {t.assignedTo.length ? t.assignedTo.map(d => (
                      <span key={d} className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{ color: "#047857", backgroundColor: "#D1FAE5" }}>{d}</span>
                    )) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ color: "#9CA3AF", backgroundColor: "#F3F4F6" }}>
                        Not assigned
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {!visibleTemplates.length && (
              <p className="px-3 py-6 text-center text-[12px]" style={{ color: MUTED }}>No templates for your scope.</p>
            )}
          </div>
        </div>

        {/* ── Template detail ───────────────────────────────────────────── */}
        {template ? (
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-start justify-between mb-1 gap-3">
              <div>
                <h2 className="text-[15px] font-extrabold" style={{ color: TEXT }}>{template.name}</h2>
                <p className="text-[11px] mt-1" style={{ color: MUTED }}>
                  Target role: <b style={{ color: "#6B7280" }}>{template.targetRole}</b> · {template.dept} ·
                  updated {fmtDate(template.updatedOn)} by {staffById(template.createdBy)?.name}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0"
                style={{ color: KPI_STYLE[template.kpi].color, backgroundColor: KPI_STYLE[template.kpi].bg }}>
                {template.kpi}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-4 mb-4 flex-wrap">
              {[
                { label: "Steps", value: template.steps.length },
                { label: "Mandatory", value: template.steps.filter(s => s.mandatory).length },
                { label: "Duration", value: `${template.durationWeeks} weeks` },
                { label: "Departments", value: template.assignedTo.length || "—" },
              ].map(s => (
                <div key={s.label} className="px-3 py-2 rounded-lg" style={{ backgroundColor: "#F9FAFB", minWidth: 86 }}>
                  <p className="text-[15px] font-extrabold leading-none" style={{ color: TEXT }}>{s.value}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wide mt-1" style={{ color: MUTED }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Steps */}
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: MUTED }}>Path sequence</p>
            <div className="space-y-2">
              {template.steps.map((step, i) => {
                const c = courseById(step.courseId);
                const last = i === template.steps.length - 1;
                return (
                  <div key={step.order} className="flex items-start gap-3">
                    <div className="flex flex-col items-center shrink-0" style={{ width: 24 }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white"
                        style={{ backgroundColor: step.mandatory ? "#DC2626" : TEAL }}>
                        {step.order}
                      </div>
                      {!last && <div style={{ width: 2, height: 26, backgroundColor: "#F3F4F6" }} />}
                    </div>
                    <div className="flex-1 rounded-lg border px-3 py-2.5" style={{ borderColor: BORDER }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[14px]">{c?.emoji ?? "📘"}</span>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold truncate" style={{ color: TEXT }}>{c?.title ?? step.courseId}</p>
                            <p className="text-[10px]" style={{ color: MUTED }}>{c?.duration} · {c?.delivery}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {c && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                              style={{ color: catStyle(c.topic).color, backgroundColor: catStyle(c.topic).bg }}>
                              {catStyle(c.topic).name}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                            style={step.mandatory
                              ? { color: "#DC2626", backgroundColor: "#FEE2E2" }
                              : { color: "#6B7280", backgroundColor: "#F3F4F6" }}>
                            {step.mandatory ? "Mandatory" : "Optional"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Individuals currently on this path */}
            <div className="mt-5 pt-4 border-t" style={{ borderColor: "#F3F4F6" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: MUTED }}>
                Staff currently on this path
              </p>
              <div className="flex flex-wrap gap-2">
                {IDPS.filter(i => i.pathTemplateId === template.id).map(i => {
                  const s = staffById(i.staffId);
                  if (!s) return null;
                  return (
                    <span key={i.staffId} className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full border"
                      style={{ borderColor: BORDER }}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                        style={{ backgroundColor: s.color }}>{s.initials}</span>
                      <span className="text-[11px] font-semibold" style={{ color: TEXT }}>{s.name}</span>
                    </span>
                  );
                })}
                {!IDPS.some(i => i.pathTemplateId === template.id) && (
                  <p className="text-[11px]" style={{ color: MUTED }}>Nobody assigned individually yet.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <GraduationCap size={26} className="mx-auto mb-2" style={{ color: "#D1D5DB" }} />
            <p className="text-[13px] font-semibold" style={{ color: MUTED }}>No template selected</p>
          </div>
        )}

        {/* ── Assignment column ─────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Departments — template assignment */}
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={14} style={{ color: "#7C3AED" }} />
              <h3 className="text-[13px] font-bold" style={{ color: TEXT }}>Assign by department</h3>
            </div>
            <p className="text-[11px] mb-3.5" style={{ color: MUTED }}>
              Large departments only. Everyone in the target role receives the path.
            </p>

            <div className="space-y-2">
              {visibleDepts.map(d => {
                const large = isLargeDept(d);
                const on = template?.assignedTo.includes(d.name) ?? false;
                return (
                  <button
                    key={d.name}
                    disabled={!large || !editable}
                    onClick={() => toggleDept(d.name)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all"
                    style={{
                      borderColor: on ? TEAL : BORDER,
                      backgroundColor: on ? "#F0FDFA" : large ? "white" : "#FAFAFA",
                      cursor: large && editable ? "pointer" : "not-allowed",
                      opacity: large ? 1 : 0.65,
                    }}
                  >
                    <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                      style={{ backgroundColor: on ? TEAL : "transparent", border: `1.5px solid ${on ? TEAL : "#D1D5DB"}` }}>
                      {on && <CheckCircle size={10} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold" style={{ color: TEXT }}>{d.name}</p>
                      <p className="text-[10px]" style={{ color: MUTED }}>
                        {d.headcount} staff · {d.head}
                      </p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                      style={large
                        ? { color: "#047857", backgroundColor: "#D1FAE5" }
                        : { color: "#6B7280", backgroundColor: "#F3F4F6" }}>
                      {large ? "Template" : "Manual"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual assignment — small teams */}
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-2 mb-1">
              <UserPlus size={14} style={{ color: "#0891B2" }} />
              <h3 className="text-[13px] font-bold" style={{ color: TEXT }}>Assign manually</h3>
            </div>
            <p className="text-[11px] mb-3" style={{ color: MUTED }}>
              For small teams — pick the person, the path lands on their IDP.
            </p>

            <select
              value={manualStaff}
              onChange={e => setManualStaff(e.target.value)}
              disabled={!editable}
              className="w-full px-3 py-2 rounded-lg text-[12px] bg-white focus:outline-none mb-2"
              style={{ border: `1px solid ${BORDER}`, color: manualStaff ? TEXT : MUTED }}
            >
              <option value="">Select staff…</option>
              {manualCandidates.map(s => (
                <option key={s.id} value={s.id}>{s.name} — {s.dept}</option>
              ))}
            </select>

            <button
              disabled={!manualStaff || !editable}
              onClick={() => assignManually(manualStaff)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-bold text-white transition-opacity"
              style={{ backgroundColor: manualStaff && editable ? TEAL : "#D1D5DB", cursor: manualStaff && editable ? "pointer" : "not-allowed" }}
            >
              <Plus size={13} /> Assign path
            </button>

            {!editable && (
              <div className="flex items-start gap-1.5 mt-3 px-2.5 py-2 rounded-lg" style={{ backgroundColor: "#F9FAFB" }}>
                <Lock size={11} className="mt-0.5 shrink-0" style={{ color: MUTED }} />
                <p className="text-[10px] leading-relaxed" style={{ color: MUTED }}>
                  Your role can view learning paths but not change them. HR and the staff member&apos;s
                  superior own assignment.
                </p>
              </div>
            )}
          </div>

          {/* Who can do this */}
          <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: "#F3E8FF" }}>
            <div className="flex items-start gap-2">
              <Sparkles size={13} className="mt-0.5 shrink-0" style={{ color: "#7C3AED" }} />
              <div>
                <p className="text-[11px] font-bold mb-1" style={{ color: "#5B21B6" }}>Who sets learning paths</p>
                <p className="text-[10px] leading-relaxed" style={{ color: "#6D28D9" }}>
                  HR company-wide, and each Manager/Superior for their own department. Super Admin has
                  full access. Trainers and staff do not assign paths.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
