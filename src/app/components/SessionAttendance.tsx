import { useMemo, useRef, useState } from "react";
import {
  ClipboardCheck, Upload, Download, CheckCircle, XCircle, Users, Ticket,
  CalendarDays, MapPin, AlertTriangle, FileSpreadsheet, Search, ShieldCheck,
} from "lucide-react";
import { useRole, ROLE_META, scopeOf } from "../access";
import {
  SESSIONS, REGISTRATIONS, ROLE_IDENTITY, catStyle,
  staffById, teamOf, seatCount, waitCount, setAttendance, cancelRegistration,
  fmtDate, useStoreVersion,
} from "../trainingStore";

const TEAL = "#00C9A7";
const TEXT = "#1A1F2E";
const MUTED = "#9CA3AF";
const BORDER = "#E5E7EB";

/** Columns of the HRDC batch attendance template. */
const HRDC_COLUMNS = [
  "Employee ID", "IC No", "Full Name", "Designation", "Branch",
  "Attended (Y/N)", "Quiz Score",
];

interface BatchOutcome { matched: number; attended: number; unmatched: string[]; }

export function SessionAttendance() {
  const role = useRole();
  useStoreVersion();
  const myId = ROLE_IDENTITY[role] ?? "E001";
  const scope = scopeOf(role, "attendance");
  const fileRef = useRef<HTMLInputElement>(null);

  // Sessions this role may record attendance for.
  const mySessions = useMemo(() => {
    const sorted = [...SESSIONS].sort((a, b) => b.date.localeCompare(a.date));
    if (scope === "all") return sorted;
    if (scope === "team") {
      const teamIds = new Set([myId, ...teamOf(myId).map(s => s.id)]);
      return sorted.filter(s => teamIds.has(s.trainerId));
    }
    return sorted.filter(s => s.trainerId === myId);
  }, [scope, myId]);

  const [sessionId, setSessionId] = useState(mySessions[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState<BatchOutcome | null>(null);
  const [saved, setSaved] = useState(false);

  const session = SESSIONS.find(s => s.id === sessionId);
  const rows = REGISTRATIONS
    .filter(r => r.sessionId === sessionId && r.status !== "cancelled")
    .map(r => ({ reg: r, staff: staffById(r.staffId) }))
    .filter(x => x.staff)
    .filter(x => !search.trim() || x.staff!.name.toLowerCase().includes(search.toLowerCase().trim()));

  const seated = rows.filter(x => x.reg.status === "registered");
  const waiting = rows.filter(x => x.reg.status === "waitlisted");
  const attended = seated.filter(x => x.reg.attended).length;

  function flash() { setSaved(true); window.setTimeout(() => setSaved(false), 2500); }

  function toggle(staffId: string, on: boolean) {
    setAttendance(sessionId, staffId, on, "manual", myId);
    flash();
  }

  function setScore(staffId: string, value: string) {
    const n = value === "" ? null : Math.max(0, Math.min(100, Number(value)));
    setAttendance(sessionId, staffId, true, "manual", myId, n);
  }

  function markAll(on: boolean) {
    seated.forEach(x => setAttendance(sessionId, x.staff!.id, on, "manual", myId));
    flash();
  }

  function downloadTemplate() {
    if (!session) return;
    const header = HRDC_COLUMNS.join(",");
    const body = REGISTRATIONS
      .filter(r => r.sessionId === sessionId && r.status === "registered")
      .map(r => {
        const s = staffById(r.staffId);
        return [s?.id ?? "", "", s?.name ?? "", s?.position ?? "", "HQ — Kuala Lumpur", "", ""].join(",");
      })
      .join("\n");
    const blob = new Blob([`${header}\n${body}\n`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HRDC-attendance-${session.id}-${session.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Parses an uploaded HRDC template and applies attendance in one pass. */
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !session) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      const outcome: BatchOutcome = { matched: 0, attended: 0, unmatched: [] };

      lines.slice(1).forEach(line => {
        const cells = line.split(",").map(c => c.trim());
        const [empId, , name, , , attendedFlag, score] = cells;
        const staff = staffById(empId) ?? (name
          ? REGISTRATIONS.filter(r => r.sessionId === sessionId)
              .map(r => staffById(r.staffId))
              .find(s => s?.name.toLowerCase() === name.toLowerCase())
          : undefined);

        if (!staff) { if (empId || name) outcome.unmatched.push(name || empId); return; }
        const reg = REGISTRATIONS.find(r => r.sessionId === sessionId && r.staffId === staff.id && r.status !== "cancelled");
        if (!reg) { outcome.unmatched.push(staff.name); return; }

        outcome.matched += 1;
        const present = !attendedFlag || /^(y|yes|1|present|hadir)$/i.test(attendedFlag);
        if (present) outcome.attended += 1;
        setAttendance(sessionId, staff.id, present, "batch", myId, score ? Number(score) : undefined);
      });

      setBatch(outcome);
      flash();
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  if (!mySessions.length || !session) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl p-8 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <ClipboardCheck size={28} className="mx-auto mb-3" style={{ color: "#D1D5DB" }} />
          <p className="text-[14px] font-bold" style={{ color: TEXT }}>No sessions to record</p>
          <p className="text-[12px] mt-1" style={{ color: MUTED }}>
            You can record attendance only for sessions you run.
          </p>
        </div>
      </div>
    );
  }

  const topic = catStyle(session.topic);
  const trainer = staffById(session.trainerId);

  return (
    <div className="p-6" style={{ backgroundColor: "#F4F6F9", minHeight: "calc(100vh - 56px)" }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[19px] font-extrabold" style={{ color: TEXT }}>Event Attendance</h1>
          <p className="text-[12px] mt-1" style={{ color: MUTED }}>
            Attendance is recorded per calendar event · {ROLE_META[role].label} ·{" "}
            {scope === "all" ? "all sessions" : scope === "team" ? "your team's sessions" : "sessions you run"}
          </p>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
            style={{ backgroundColor: "#ECFDF5", color: "#065F46" }}>
            <CheckCircle size={12} /> Attendance saved
          </span>
        )}
      </div>

      {/* ── Session picker ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 mb-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: MUTED }}>
          Calendar event
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={sessionId}
            onChange={e => { setSessionId(e.target.value); setBatch(null); }}
            className="flex-1 min-w-[300px] px-3 py-2.5 rounded-lg text-[13px] bg-white focus:outline-none"
            style={{ border: `1px solid ${BORDER}`, color: TEXT }}
          >
            {mySessions.map(s => (
              <option key={s.id} value={s.id}>{fmtDate(s.date)} — {s.title}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <button onClick={downloadTemplate}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-[12px] font-semibold border transition-colors hover:bg-gray-50"
              style={{ borderColor: BORDER, color: "#6B7280" }}>
              <Download size={13} /> HRDC template
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-[12px] font-bold text-white"
              style={{ backgroundColor: "#7C3AED" }}>
              <Upload size={13} /> Batch upload
            </button>
            <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx" className="hidden" onChange={handleUpload} />
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap mt-4 pt-4 border-t" style={{ borderColor: "#F3F4F6" }}>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ color: topic.color, backgroundColor: topic.bg }}>
            {topic.emoji} {topic.name}
          </span>
          <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "#6B7280" }}>
            <CalendarDays size={12} style={{ color: MUTED }} /> {fmtDate(session.date)} · {session.time}
          </span>
          <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "#6B7280" }}>
            <MapPin size={12} style={{ color: MUTED }} /> {session.venue}
          </span>
          <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "#6B7280" }}>
            <Users size={12} style={{ color: MUTED }} /> {seatCount(session.id)}/{session.capacity} seats
            {waitCount(session.id) > 0 && ` · ${waitCount(session.id)} waitlisted`}
          </span>
          <span className="text-[12px]" style={{ color: "#6B7280" }}>Trainer: {trainer?.name}</span>
          {session.hrdcClaimable && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ color: "#1D4ED8", backgroundColor: "#EFF6FF" }}>
              HRDC claimable
            </span>
          )}
        </div>
      </div>

      {/* ── Batch result ─────────────────────────────────────────────────── */}
      {batch && (
        <div className="rounded-xl px-5 py-4 mb-4 flex items-start gap-3"
          style={{ backgroundColor: batch.unmatched.length ? "#FFFBEB" : "#ECFDF5" }}>
          <FileSpreadsheet size={16} className="mt-0.5 shrink-0" style={{ color: batch.unmatched.length ? "#B45309" : "#059669" }} />
          <div>
            <p className="text-[12px] font-bold" style={{ color: batch.unmatched.length ? "#92400E" : "#065F46" }}>
              Batch upload processed — {batch.matched} rows matched, {batch.attended} marked present
            </p>
            {batch.unmatched.length > 0 && (
              <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "#B45309" }}>
                Not matched to a registration and skipped: {batch.unmatched.join(", ")}. Only registered
                participants can be marked present.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-[1fr_280px] gap-4 items-start">

        {/* ── Participant list ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b flex-wrap" style={{ borderColor: "#F3F4F6" }}>
            <div className="flex items-center gap-2">
              <ClipboardCheck size={15} style={{ color: TEAL }} />
              <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Registered participants</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>
                {attended}/{seated.length} present
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find participant…"
                  className="pl-8 pr-3 py-1.5 rounded-lg text-[12px] focus:outline-none"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT, width: 170 }} />
              </div>
              <button onClick={() => markAll(true)} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                style={{ backgroundColor: "#ECFDF5", color: "#059669" }}>All present</button>
              <button onClick={() => markAll(false)} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>Clear</button>
            </div>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr style={{ backgroundColor: "#F9FAFB" }}>
                {["Participant", "Department", "Registered", "Attendance", "Quiz score"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider border-b"
                    style={{ color: MUTED, borderColor: "#F3F4F6" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#F9FAFB" }}>
              {seated.map(({ reg, staff }) => (
                <tr key={staff!.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                        style={{ backgroundColor: staff!.color }}>{staff!.initials}</div>
                      <div>
                        <p className="text-[12px] font-semibold" style={{ color: TEXT }}>{staff!.name}</p>
                        <p className="text-[10px]" style={{ color: MUTED }}>{staff!.position}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[12px]" style={{ color: "#6B7280" }}>{staff!.dept}</td>
                  <td className="px-4 py-2.5 text-[11px]" style={{ color: MUTED }}>{fmtDate(reg.registeredOn)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => toggle(staff!.id, true)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors"
                        style={reg.attended
                          ? { backgroundColor: "#059669", color: "white" }
                          : { backgroundColor: "#F3F4F6", color: "#9CA3AF" }}>
                        <CheckCircle size={11} /> Present
                      </button>
                      <button onClick={() => toggle(staff!.id, false)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors"
                        style={!reg.attended
                          ? { backgroundColor: "#FEE2E2", color: "#DC2626" }
                          : { backgroundColor: "#F3F4F6", color: "#9CA3AF" }}>
                        <XCircle size={11} /> Absent
                      </button>
                      {reg.attendanceMethod === "batch" && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ color: "#7C3AED", backgroundColor: "#F3E8FF" }}>
                          batch
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number" min={0} max={100}
                      value={reg.quizScore ?? ""}
                      disabled={!reg.attended}
                      onChange={e => setScore(staff!.id, e.target.value)}
                      placeholder={reg.attended ? "—" : "n/a"}
                      className="w-16 px-2 py-1 rounded-md text-[12px] text-center focus:outline-none"
                      style={{ border: `1px solid ${BORDER}`, color: TEXT, backgroundColor: reg.attended ? "white" : "#F9FAFB" }}
                    />
                  </td>
                </tr>
              ))}
              {!seated.length && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[12px]" style={{ color: MUTED }}>No registrations yet.</td></tr>
              )}
            </tbody>
          </table>

          {/* Waitlist */}
          {waiting.length > 0 && (
            <div className="px-5 py-4 border-t" style={{ borderColor: "#F3F4F6", backgroundColor: "#FFFBEB" }}>
              <div className="flex items-center gap-2 mb-2.5">
                <Ticket size={13} style={{ color: "#B45309" }} />
                <p className="text-[12px] font-bold" style={{ color: "#92400E" }}>Waitlist ({waiting.length})</p>
                <span className="text-[11px]" style={{ color: "#B45309" }}>Promoted automatically when a seat is cancelled.</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {waiting.map(({ staff }) => (
                  <span key={staff!.id} className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-white border"
                    style={{ borderColor: "#FDE68A" }}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                      style={{ backgroundColor: staff!.color }}>{staff!.initials}</span>
                    <span className="text-[11px] font-semibold" style={{ color: "#92400E" }}>{staff!.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Side panel ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: MUTED }}>This event</p>
            {[
              { label: "Registered", value: seated.length, color: "#1D4ED8" },
              { label: "Present",    value: attended,      color: "#059669" },
              { label: "Absent",     value: seated.length - attended, color: "#DC2626" },
              { label: "Waitlisted", value: waiting.length, color: "#D97706" },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-1.5">
                <span className="text-[12px]" style={{ color: "#6B7280" }}>{s.label}</span>
                <span className="text-[15px] font-extrabold" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "#F3F4F6" }}>
              <div className="rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "#F3F4F6" }}>
                <div className="rounded-full transition-all"
                  style={{ height: 6, width: `${seated.length ? (attended / seated.length) * 100 : 0}%`, backgroundColor: TEAL }} />
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: MUTED }}>
                {seated.length ? Math.round((attended / seated.length) * 100) : 0}% attendance rate
              </p>
            </div>
          </div>

          <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: "#EFF6FF" }}>
            <div className="flex items-start gap-2">
              <ShieldCheck size={13} className="mt-0.5 shrink-0" style={{ color: "#1D4ED8" }} />
              <p className="text-[11px] leading-relaxed" style={{ color: "#1E40AF" }}>
                Marking someone present writes the session into their profile as a completed training record
                and feeds their training KPI. Registration alone never does.
              </p>
            </div>
          </div>

          <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: "#F9FAFB" }}>
            <div className="flex items-start gap-2">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: MUTED }} />
              <div>
                <p className="text-[11px] font-semibold mb-1" style={{ color: "#6B7280" }}>Batch upload format</p>
                <p className="text-[10px] leading-relaxed" style={{ color: MUTED }}>
                  CSV with columns: {HRDC_COLUMNS.join(" · ")}. Download the template to get the
                  registered list pre-filled.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => { seated.filter(x => !x.reg.attended).forEach(x => cancelRegistration(sessionId, x.staff!.id)); flash(); }}
            className="w-full py-2.5 rounded-lg text-[11px] font-semibold border"
            style={{ borderColor: BORDER, color: "#6B7280" }}
          >
            Release no-show seats to waitlist
          </button>
        </div>
      </div>
    </div>
  );
}
