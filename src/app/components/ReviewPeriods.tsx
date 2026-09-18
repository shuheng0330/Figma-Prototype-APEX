import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Search, Eye, Pencil, Trash2, AlertTriangle, RotateCcw, Clock3 } from "lucide-react";
import { usePerformanceStore } from "../performance/store";
import type { ReviewPeriodStatus as ReviewStatus } from "../performance/domain";

const BLUE  = "#2457A6";
const TEAL  = "#0F9F8F";
const AMBER = "#D99000";
const TEXT  = "#172033";
const MUTED = "#667085";
const BORDER= "#DCE3EC";
const BG    = "#F4F6F9";

const STATUS_STYLE: Record<ReviewStatus, { color:string; bg:string }> = {
  Draft:     { color: MUTED,     bg: "#F2F4F7" },
  Upcoming:  { color: AMBER,     bg: "#FEF9EC" },
  Open:      { color: TEAL,      bg: "#ECFDF9" },
  Closed:    { color: "#374151", bg: "#F3F4F6" },
};

function StatusPill({ status }: { status: ReviewStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ color: s.color, backgroundColor: s.bg }}>
      {status}
    </span>
  );
}

function fmt(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(d)} ${M[parseInt(m)-1]} ${y}`;
}

export function ReviewPeriods() {
  const navigate = useNavigate();
  const { periods, state, requirementGaps, setEffectiveDate, resetDemoData, deletePeriod, prepareEmployeeForAppraisal } = usePerformanceStore();
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("All");
  const [yearFilter, setYear]        = useState("All");
  const [demoPeriodId, setDemoPeriodId] = useState("2028");
  const [demoEmployeeId, setDemoEmployeeId] = useState("amir");
  const [demoMessage, setDemoMessage] = useState("");

  const visible = periods.filter(p => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) &&
      (statusFilter === "All" || p.status === statusFilter) &&
      (yearFilter   === "All" || p.id === yearFilter)
    );
  });

  return (
    <div className="p-6 space-y-5" style={{ backgroundColor: BG, minHeight:"calc(100vh - 56px)" }}>

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold mb-1" style={{ color: TEXT }}>Review Periods</h1>
          <p className="text-[13px] max-w-2xl" style={{ color: MUTED }}>
            Each review period stores its own role-frequency rules, deadline configuration, and weightage settings.
            Draft and Upcoming periods can be edited. Open and Closed periods retain their configuration in read-only mode.
          </p>
        </div>
        <button
          onClick={() => navigate("/performance/review-periods/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
          style={{ backgroundColor: BLUE }}>
          <Plus size={14}/> Create New Review Period
        </button>
      </div>

      {/* ── Prototype consistency controls ── */}
      <div className="bg-white rounded-lg p-4" style={{ border:`1px solid ${BORDER}`, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Clock3 size={14} style={{ color: BLUE }}/>
              <h2 className="text-[13px] font-bold" style={{ color: TEXT }}>Prototype Simulation Date</h2>
            </div>
            <p className="text-[11px] mt-1" style={{ color: MUTED }}>
              Uses Asia/Kuala_Lumpur and controls period opening, checkpoint availability, and overdue indicators.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={state.effectiveDate} onChange={event => setEffectiveDate(event.target.value)}
              className="px-3 py-2 rounded-md text-[12px]" style={{ border:`1px solid ${BORDER}`, color:TEXT }}/>
            <button onClick={() => { if (window.confirm("Reset all locally saved performance demo data?")) resetDemoData(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-semibold border"
              style={{ color: MUTED, borderColor: BORDER }}><RotateCcw size={12}/> Reset Demo Data</button>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t" style={{ borderColor: BORDER }}>
          <div className="p-3 mb-4 rounded-md" style={{ backgroundColor:"#EEF3FC", border:"1px solid #B8CCEA" }}>
            <p className="text-[12px] font-bold" style={{ color: BLUE }}>Demo Tools — Prototype Simulation Only</p>
            <p className="text-[11px] mt-1" style={{ color: MUTED }}>Prepare the remaining reviewed checkpoints without weakening the real Ready for Appraisal rule. Existing manual work is preserved.</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <select value={demoPeriodId} onChange={event => setDemoPeriodId(event.target.value)} className="px-3 py-2 rounded-md text-[12px] bg-white" style={{ border:`1px solid ${BORDER}` }}>
                {periods.map(period => <option key={period.id} value={period.id}>{period.name} — {period.status}</option>)}
              </select>
              <select value={demoEmployeeId} onChange={event => setDemoEmployeeId(event.target.value)} className="px-3 py-2 rounded-md text-[12px] bg-white" style={{ border:`1px solid ${BORDER}` }}>
                {Object.values(state.employees).map(employee => <option key={employee.id} value={employee.id}>{employee.name} · {employee.staffId}</option>)}
              </select>
              <button onClick={() => { const result = prepareEmployeeForAppraisal(demoPeriodId, demoEmployeeId); setDemoMessage(result.message); }} className="px-3 py-2 rounded-md text-[12px] font-semibold text-white" style={{ backgroundColor: BLUE }}>Prepare Employee for Appraisal</button>
              {demoMessage && <span className="text-[11px]" style={{ color: demoMessage.startsWith("Remaining") ? TEAL : AMBER }}>{demoMessage}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={13} style={{ color: AMBER }}/>
            <p className="text-[12px] font-bold" style={{ color: TEXT }}>Stakeholder Requirement Gaps</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {requirementGaps.map(gap => (
              <div key={gap.id} className="p-3 rounded-md" style={{ backgroundColor:"#FEF9EC", border:"1px solid #F5D98A" }}>
                <p className="text-[11px] font-bold" style={{ color: AMBER }}>{gap.title} · TBC</p>
                <p className="text-[11px] mt-1" style={{ color: TEXT }}>{gap.question}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border rounded-md px-3 py-2 flex-1"
          style={{ borderColor: BORDER, minWidth: 220 }}>
          <Search size={13} style={{ color: MUTED }}/>
          <input type="text" placeholder="Search review periods…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-[13px] outline-none bg-transparent placeholder-[#9CA3AF]"
            style={{ color: TEXT }}/>
          {search && <button onClick={() => setSearch("")} className="text-[#9CA3AF] hover:text-gray-500 text-[11px]">✕</button>}
        </div>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 bg-white border rounded-md text-[13px] outline-none cursor-pointer"
          style={{ borderColor: BORDER, color: TEXT }}>
          <option value="All">All Statuses</option>
          {(["Draft","Upcoming","Open","Closed"] as ReviewStatus[]).map(s =>
            <option key={s} value={s}>{s}</option>
          )}
        </select>
        <select value={yearFilter} onChange={e => setYear(e.target.value)}
          className="px-3 py-2 bg-white border rounded-md text-[13px] outline-none cursor-pointer"
          style={{ borderColor: BORDER, color: TEXT }}>
          <option value="All">All Years</option>
          {periods.map(period => <option key={period.id} value={period.id}>{period.id}</option>)}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-lg overflow-x-auto"
        style={{ boxShadow:"0 1px 4px rgba(0,0,0,0.08)", border:`1px solid ${BORDER}` }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ backgroundColor:"#F8FAFC", borderBottom:`1px solid ${BORDER}` }}>
              {["Review Period Name","Performance Period","Status","Last Updated","Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: MUTED }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-14 text-center text-[13px]" style={{ color: MUTED }}>
                  No review periods match your filters.
                </td>
              </tr>
            ) : visible.map((p, i) => (
              <tr key={p.id}
                className="hover:bg-gray-50 transition-colors"
                style={{ borderBottom: i < visible.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                <td className="px-4 py-3.5">
                  <p className="font-semibold" style={{ color: TEXT }}>{p.name}</p>
                </td>
                <td className="px-4 py-3.5 text-[12px] whitespace-nowrap" style={{ color: MUTED }}>
                  {fmt(p.startDate)} – {fmt(p.endDate)}
                </td>
                <td className="px-4 py-3.5"><StatusPill status={p.status}/></td>
                <td className="px-4 py-3.5 text-[12px] whitespace-nowrap" style={{ color: MUTED }}>{fmt(p.lastUpdated)}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate(`/performance/review-periods/${p.id}/view`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors hover:bg-gray-50"
                      style={{ color: MUTED, borderColor: BORDER }}>
                      <Eye size={11}/> View
                    </button>
                    {(["Draft", "Upcoming"] as ReviewStatus[]).includes(p.status) && (
                      <>
                        <button
                          onClick={() => navigate(`/performance/review-periods/${p.id}/edit`)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors hover:bg-blue-50"
                          style={{ color: BLUE, borderColor: "#93B4E8" }}>
                          <Pencil size={11}/> Edit
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Delete ${p.name} and all of its prototype data?`)) deletePeriod(p.id); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors hover:bg-red-50"
                          style={{ color: "#D14343", borderColor: "#F2B8B5" }}>
                          <Trash2 size={11}/> Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Table footer count */}
        <div className="px-4 py-2.5 border-t flex items-center justify-between" style={{ borderColor: BORDER }}>
          <span className="text-[11px]" style={{ color: MUTED }}>
            {visible.length} of {periods.length} periods
          </span>
        </div>
      </div>
    </div>
  );
}
