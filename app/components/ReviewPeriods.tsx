import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Search, Eye, Pencil } from "lucide-react";

const BLUE  = "#2457A6";
const TEAL  = "#0F9F8F";
const AMBER = "#D99000";
const TEXT  = "#172033";
const MUTED = "#667085";
const BORDER= "#DCE3EC";
const BG    = "#F4F6F9";

type ReviewStatus = "Draft" | "Upcoming" | "Open" | "Closed" | "Cancelled";

interface ReviewPeriod {
  id: string; name: string;
  startDate: string; endDate: string;
  eligibleGroup: string;
  status: ReviewStatus;
  lastUpdated: string;
  editable: boolean;
}

const STATUS_STYLE: Record<ReviewStatus, { color:string; bg:string }> = {
  Draft:     { color: MUTED,     bg: "#F2F4F7" },
  Upcoming:  { color: AMBER,     bg: "#FEF9EC" },
  Open:      { color: TEAL,      bg: "#ECFDF9" },
  Closed:    { color: "#374151", bg: "#F3F4F6" },
  Cancelled: { color: "#D14343", bg: "#FEF3F2" },
};

const PERIODS: ReviewPeriod[] = [
  { id:"2027", name:"2027 Annual KPI Review", startDate:"2027-01-01", endDate:"2027-12-31", eligibleGroup:"All Confirmed Staff",    status:"Draft",  lastUpdated:"2026-08-22", editable:true  },
  { id:"2026", name:"2026 Annual KPI Review", startDate:"2026-01-01", endDate:"2026-12-31", eligibleGroup:"All Confirmed Staff",    status:"Open",   lastUpdated:"2026-01-10", editable:true  },
  { id:"2025", name:"2025 Annual KPI Review", startDate:"2025-01-01", endDate:"2025-12-31", eligibleGroup:"All Confirmed Staff",    status:"Closed", lastUpdated:"2025-12-28", editable:false },
  { id:"2024", name:"2024 Annual KPI Review", startDate:"2024-01-01", endDate:"2024-12-31", eligibleGroup:"Retail Division Staff", status:"Closed", lastUpdated:"2024-12-26", editable:false },
];

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
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("All");
  const [yearFilter, setYear]        = useState("All");

  const visible = PERIODS.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.name.toLowerCase().includes(q) || p.eligibleGroup.toLowerCase().includes(q)) &&
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
            Closed periods open as read-only. Only one period can be Open at a time.
          </p>
        </div>
        <button
          onClick={() => navigate("/performance/review-periods/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
          style={{ backgroundColor: BLUE }}>
          <Plus size={14}/> Create New Review Period
        </button>
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
          {(["Draft","Upcoming","Open","Closed","Cancelled"] as ReviewStatus[]).map(s =>
            <option key={s} value={s}>{s}</option>
          )}
        </select>
        <select value={yearFilter} onChange={e => setYear(e.target.value)}
          className="px-3 py-2 bg-white border rounded-md text-[13px] outline-none cursor-pointer"
          style={{ borderColor: BORDER, color: TEXT }}>
          <option value="All">All Years</option>
          {["2027","2026","2025","2024"].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-lg overflow-hidden"
        style={{ boxShadow:"0 1px 4px rgba(0,0,0,0.08)", border:`1px solid ${BORDER}` }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ backgroundColor:"#F8FAFC", borderBottom:`1px solid ${BORDER}` }}>
              {["Review Period Name","Performance Period","Eligible Staff Group","Status","Last Updated","Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: MUTED }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center text-[13px]" style={{ color: MUTED }}>
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
                <td className="px-4 py-3.5 text-[12px]" style={{ color: MUTED }}>{p.eligibleGroup}</td>
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
                    {p.editable && (
                      <button
                        onClick={() => navigate(`/performance/review-periods/${p.id}/edit`)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors hover:bg-blue-50"
                        style={{ color: BLUE, borderColor: "#93B4E8" }}>
                        <Pencil size={11}/> Edit
                      </button>
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
            {visible.length} of {PERIODS.length} periods
          </span>
        </div>
      </div>
    </div>
  );
}
