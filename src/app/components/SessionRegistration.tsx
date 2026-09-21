import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Users, CheckCircle,
  AlertTriangle, Ticket, UserCheck, Sparkles, ShieldCheck,
} from "lucide-react";
import { useRole } from "../access";
import {
  ROLE_IDENTITY, SESSIONS, catStyle, KPI_STYLE, staffById,
  seatCount, waitCount, myReg, register, cancelRegistration,
  fmtDate, daysUntil, useStoreVersion,
} from "../trainingStore";

const TEAL = "#00C9A7";
const TEXT = "#1A1F2E";
const MUTED = "#9CA3AF";
const BORDER = "#E5E7EB";

const RACES = ["Malay", "Chinese", "Indian", "Bumiputera Sabah", "Bumiputera Sarawak", "Other"];
const QUALS = ["SPM", "STPM", "Certificate", "Diploma", "Degree", "Master", "PhD"];
const BRANCHES = [
  "HQ — Kuala Lumpur", "Branch — Petaling Jaya", "Branch — Subang Jaya",
  "Branch — Shah Alam", "Branch — Klang", "Branch — Kajang", "Branch — Puchong",
  "Branch — Cheras", "Branch — Ampang", "Branch — Penang", "Branch — Johor Bahru",
  "Branch — Kota Kinabalu", "Branch — Kuching", "Branch — Ipoh", "Branch — Seremban",
];

function Field({ label, required = true, error, children }: {
  label: string; required?: boolean; error?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "#374151" }}>
        {label} {required && <span style={{ color: "#DC2626" }}>*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] mt-1" style={{ color: "#DC2626" }}>This field is required</p>}
    </div>
  );
}

export function SessionRegistration() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const role = useRole();
  useStoreVersion();

  const meId = ROLE_IDENTITY[role] ?? "E001";
  const me = staffById(meId);
  const session = SESSIONS.find(s => s.id === sessionId);

  const [ic, setIc] = useState("");
  const [gender, setGender] = useState("");
  const [race, setRace] = useState("");
  const [specify, setSpecify] = useState("");
  const [qual, setQual] = useState("");
  const [branch, setBranch] = useState("HQ — Kuala Lumpur");
  const [distance, setDistance] = useState("");
  const [meal, setMeal] = useState("No preference");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<"registered" | "waitlisted" | null>(null);

  const existing = session ? myReg(session.id, meId) : undefined;
  const seats = session ? seatCount(session.id) : 0;
  const waiting = session ? waitCount(session.id) : 0;
  const full = session ? seats >= session.capacity : false;
  const pct = session ? Math.min(100, Math.round((seats / session.capacity) * 100)) : 0;

  const needSpecify = race === "Other";
  const valid = useMemo(
    () => Boolean(ic.trim() && gender && race && (!needSpecify || specify.trim()) && qual && branch && distance !== ""),
    [ic, gender, race, needSpecify, specify, qual, branch, distance],
  );

  if (!session) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl p-8 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <AlertTriangle size={30} className="mx-auto mb-3" style={{ color: "#D1D5DB" }} />
          <p className="text-[14px] font-bold" style={{ color: TEXT }}>Session not found</p>
          <p className="text-[12px] mt-1" style={{ color: MUTED }}>It may have been removed from the calendar.</p>
          <Link to="/portal" className="inline-block mt-4 px-4 py-2 rounded-lg text-[12px] font-bold text-white" style={{ backgroundColor: TEAL }}>
            Back to My Learnings
          </Link>
        </div>
      </div>
    );
  }

  const trainer = staffById(session.trainerId);
  const topic = catStyle(session.topic);
  const isSharing = session.kind === "Sharing Session";
  const until = daysUntil(session.date);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!valid) return;
    setResult(register(session!.id, meId));
  }

  // ── Confirmation ────────────────────────────────────────────────────────────
  if (result || existing) {
    const status = result ?? existing!.status;
    const isWait = status === "waitlisted";
    return (
      <div className="p-6" style={{ backgroundColor: "#F4F6F9", minHeight: "calc(100vh - 56px)" }}>
        <button onClick={() => navigate("/portal")} className="flex items-center gap-1.5 text-[12px] font-semibold mb-4" style={{ color: MUTED }}>
          <ArrowLeft size={13} /> My Learnings
        </button>

        <div className="max-w-[640px] mx-auto bg-white rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <div className="px-6 py-7 text-center" style={{ backgroundColor: isWait ? "#FFFBEB" : "#ECFDF5" }}>
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: isWait ? "#FDE68A" : "#A7F3D0" }}>
              {isWait ? <Ticket size={22} style={{ color: "#92400E" }} /> : <CheckCircle size={22} style={{ color: "#065F46" }} />}
            </div>
            <p className="text-[16px] font-extrabold" style={{ color: isWait ? "#92400E" : "#065F46" }}>
              {isWait ? "You are on the waitlist" : "Registration confirmed"}
            </p>
            <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: isWait ? "#B45309" : "#047857" }}>
              {isWait
                ? `The session is at capacity. You are number ${waiting} in line and will be moved up automatically if someone cancels.`
                : "A calendar invite has been sent. Your seat is held until the session starts."}
            </p>
          </div>

          <div className="px-6 py-5">
            <p className="text-[14px] font-bold mb-3" style={{ color: TEXT }}>{session.title}</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { icon: CalendarDays, label: fmtDate(session.date) },
                { icon: Clock, label: session.time },
                { icon: MapPin, label: session.venue },
                { icon: UserCheck, label: trainer ? `${trainer.name}${isSharing ? " (staff sharing)" : ""}` : "TBC" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#F9FAFB" }}>
                  <Icon size={13} style={{ color: MUTED }} />
                  <span className="text-[12px] font-semibold" style={{ color: TEXT }}>{label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg mb-5" style={{ backgroundColor: "#EFF6FF" }}>
              <ShieldCheck size={13} className="mt-0.5 shrink-0" style={{ color: "#1D4ED8" }} />
              <p className="text-[11px] leading-relaxed" style={{ color: "#1E40AF" }}>
                This session counts towards your training record only after the trainer records your
                attendance on the day. Registering alone does not complete it.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/portal" className="flex-1 text-center px-4 py-2.5 rounded-lg text-[12px] font-bold text-white" style={{ backgroundColor: TEAL }}>
                Back to My Learnings
              </Link>
              <Link to="/calendar" className="flex-1 text-center px-4 py-2.5 rounded-lg text-[12px] font-bold border" style={{ borderColor: BORDER, color: "#6B7280" }}>
                View calendar
              </Link>
              <button
                onClick={() => { cancelRegistration(session.id, meId); setResult(null); setSubmitted(false); }}
                className="px-4 py-2.5 rounded-lg text-[12px] font-bold border"
                style={{ borderColor: "#FCA5A5", color: "#DC2626" }}
              >
                Cancel seat
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────────
  return (
    <div className="p-6" style={{ backgroundColor: "#F4F6F9", minHeight: "calc(100vh - 56px)" }}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[12px] font-semibold mb-4" style={{ color: MUTED }}>
        <ArrowLeft size={13} /> Back
      </button>

      <div className="max-w-[900px] mx-auto grid grid-cols-[1fr_300px] gap-4 items-start">

        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <div className="px-6 py-5 border-b" style={{ borderColor: "#F3F4F6" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: topic.color, backgroundColor: topic.bg }}>
                {topic.emoji} {topic.name}
              </span>
              {isSharing && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: "#B45309", backgroundColor: "#FFFBEB" }}>
                  <Sparkles size={9} /> Staff sharing session
                </span>
              )}
            </div>
            <h1 className="text-[18px] font-extrabold leading-tight" style={{ color: TEXT }}>{session.title}</h1>
            <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: MUTED }}>{session.description}</p>
          </div>

          <div className="px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: MUTED }}>
              Participant details {session.hrdcClaimable && "· HRDC claimable — all fields required"}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Full name" required={false}>
                <input value={me?.name ?? ""} readOnly className="w-full px-3 py-2 rounded-lg text-[12px]"
                  style={{ backgroundColor: "#F9FAFB", border: `1px solid ${BORDER}`, color: "#6B7280" }} />
              </Field>
              <Field label="Employee ID" required={false}>
                <input value={meId} readOnly className="w-full px-3 py-2 rounded-lg text-[12px]"
                  style={{ backgroundColor: "#F9FAFB", border: `1px solid ${BORDER}`, color: "#6B7280" }} />
              </Field>

              <Field label="IC / Passport number" error={submitted && !ic.trim()}>
                <input value={ic} onChange={e => setIc(e.target.value)} placeholder="900115014567"
                  className="w-full px-3 py-2 rounded-lg text-[12px] focus:outline-none"
                  style={{ border: `1px solid ${submitted && !ic.trim() ? "#FCA5A5" : BORDER}`, color: TEXT }} />
              </Field>
              <Field label="Gender" error={submitted && !gender}>
                <select value={gender} onChange={e => setGender(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[12px] bg-white focus:outline-none"
                  style={{ border: `1px solid ${submitted && !gender ? "#FCA5A5" : BORDER}`, color: gender ? TEXT : MUTED }}>
                  <option value="">Select…</option>
                  <option>Male</option><option>Female</option>
                </select>
              </Field>

              <Field label="Race" error={submitted && !race}>
                <select value={race} onChange={e => setRace(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[12px] bg-white focus:outline-none"
                  style={{ border: `1px solid ${submitted && !race ? "#FCA5A5" : BORDER}`, color: race ? TEXT : MUTED }}>
                  <option value="">Select…</option>
                  {RACES.map(r => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="If other, specify" required={needSpecify} error={submitted && needSpecify && !specify.trim()}>
                <input value={specify} onChange={e => setSpecify(e.target.value)} disabled={!needSpecify}
                  placeholder={needSpecify ? "e.g. Iban" : "—"}
                  className="w-full px-3 py-2 rounded-lg text-[12px] focus:outline-none"
                  style={{ border: `1px solid ${submitted && needSpecify && !specify.trim() ? "#FCA5A5" : BORDER}`,
                    backgroundColor: needSpecify ? "white" : "#F9FAFB", color: TEXT }} />
              </Field>

              <Field label="Highest qualification" error={submitted && !qual}>
                <select value={qual} onChange={e => setQual(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[12px] bg-white focus:outline-none"
                  style={{ border: `1px solid ${submitted && !qual ? "#FCA5A5" : BORDER}`, color: qual ? TEXT : MUTED }}>
                  <option value="">Select…</option>
                  {QUALS.map(q => <option key={q}>{q}</option>)}
                </select>
              </Field>
              <Field label="Designation" required={false}>
                <input value={me?.position ?? ""} readOnly className="w-full px-3 py-2 rounded-lg text-[12px]"
                  style={{ backgroundColor: "#F9FAFB", border: `1px solid ${BORDER}`, color: "#6B7280" }} />
              </Field>

              <Field label="Branch" error={submitted && !branch}>
                <select value={branch} onChange={e => setBranch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[12px] bg-white focus:outline-none"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT }}>
                  {BRANCHES.map(b => <option key={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Distance from venue (km)" error={submitted && distance === ""}>
                <input type="number" min={0} value={distance} onChange={e => setDistance(e.target.value)} placeholder="12"
                  className="w-full px-3 py-2 rounded-lg text-[12px] focus:outline-none"
                  style={{ border: `1px solid ${submitted && distance === "" ? "#FCA5A5" : BORDER}`, color: TEXT }} />
              </Field>

              <Field label="Meal preference" required={false}>
                <select value={meal} onChange={e => setMeal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[12px] bg-white focus:outline-none"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT }}>
                  <option>No preference</option><option>Vegetarian</option><option>Halal only</option><option>No meal</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: "#F3F4F6", backgroundColor: "#FCFCFD" }}>
            <p className="text-[11px]" style={{ color: MUTED }}>
              {full ? "Session is full — you will join the waitlist." : `${session.capacity - seats} of ${session.capacity} seats left`}
            </p>
            <button type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[12px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: full ? "#D97706" : TEAL }}>
              {full ? <><Ticket size={13} /> Join waitlist</> : <><CheckCircle size={13} /> Confirm registration</>}
            </button>
          </div>
        </form>

        {/* ── Session summary ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: MUTED }}>Session</p>
            <div className="space-y-2.5">
              {[
                { icon: CalendarDays, label: fmtDate(session.date), sub: until > 0 ? `in ${until} days` : until === 0 ? "today" : "past" },
                { icon: Clock, label: session.time },
                { icon: MapPin, label: session.venue },
                { icon: UserCheck, label: trainer?.name ?? "TBC", sub: trainer?.position },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <Icon size={13} className="mt-0.5 shrink-0" style={{ color: MUTED }} />
                  <div>
                    <p className="text-[12px] font-semibold leading-tight" style={{ color: TEXT }}>{label}</p>
                    {sub && <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>{sub}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t" style={{ borderColor: "#F3F4F6" }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: TEXT }}>
                  <Users size={12} style={{ color: MUTED }} /> Capacity
                </span>
                <span className="text-[11px] font-bold" style={{ color: full ? "#DC2626" : TEAL }}>
                  {seats} / {session.capacity}
                </span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "#F3F4F6" }}>
                <div className="rounded-full transition-all" style={{ height: 6, width: `${pct}%`, backgroundColor: full ? "#DC2626" : TEAL }} />
              </div>
              {full && (
                <p className="text-[10px] mt-2 font-semibold" style={{ color: "#B45309" }}>
                  Registration closed — {waiting} on waitlist
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: MUTED }}>Counts towards</p>
            <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold mb-2"
              style={{ color: KPI_STYLE[session.kpi].color, backgroundColor: KPI_STYLE[session.kpi].bg }}>
              {session.kpi}
            </span>
            <p className="text-[11px] leading-relaxed" style={{ color: MUTED }}>
              Completion feeds your performance KPI once attendance is recorded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
