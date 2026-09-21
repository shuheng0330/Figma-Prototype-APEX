import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Sparkles, Users, Presentation, Award, CalendarDays, MapPin,
  TrendingUp, Medal, UserCheck, ChevronRight, Star,
} from "lucide-react";
import { useRole, ROLE_META } from "../access";
import {
  ROLE_IDENTITY, STAFF, catStyle, staffById, teamOf,
  sharingResults, upcomingSharing, sharingLeaderboard, seatCount,
  fmtDate, daysUntil, useStoreVersion,
} from "../trainingStore";

const TEAL = "#00C9A7";
const TEXT = "#1A1F2E";
const MUTED = "#9CA3AF";
const BORDER = "#E5E7EB";
const AMBER = "#D97706";

function scoreColor(n: number) {
  return n >= 85 ? "#059669" : n >= 70 ? AMBER : "#DC2626";
}

function Tile({ icon: Icon, label, value, sub, color, bg }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-xl px-4 py-3.5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
          <Icon size={13} style={{ color }} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>{label}</p>
      </div>
      <p className="text-[24px] font-extrabold leading-none" style={{ color: TEXT }}>{value}</p>
      {sub && <p className="text-[10px] mt-1.5" style={{ color: MUTED }}>{sub}</p>}
    </div>
  );
}

/** Staff-led knowledge sharing: who presented, how often, and how many colleagues attended. */
export function SharingSessions({ embedded = false }: { embedded?: boolean } = {}) {
  const role = useRole();
  useStoreVersion();
  const myId = ROLE_IDENTITY[role] ?? "E001";
  const [sortBy, setSortBy] = useState<"sessions" | "involved" | "quiz">("sessions");
  /** Sharing is recognition — the board shows the whole company by default. */
  const [view, setView] = useState<"all" | "team" | "mine">("all");

  const myTeamIds = useMemo(() => [myId, ...teamOf(myId).map(s => s.id)], [myId]);

  const visibleIds = useMemo(() => {
    if (view === "mine") return [myId];
    if (view === "team") return myTeamIds;
    return undefined;                                  // everyone
  }, [view, myId, myTeamIds]);

  const VIEWS = useMemo(() => {
    const all = sharingLeaderboard();
    const team = sharingLeaderboard(myTeamIds);
    const mine = sharingLeaderboard([myId]);
    return [
      { id: "all"  as const, label: "Everyone",  count: all.length },
      { id: "team" as const, label: "My team",   count: team.length },
      { id: "mine" as const, label: "Mine",      count: mine.length },
    ];
  }, [myId, myTeamIds]);

  const results = sharingResults().filter(r => !visibleIds || visibleIds.includes(r.trainerId));
  const upcoming = upcomingSharing().filter(s => !visibleIds || visibleIds.includes(s.trainerId));
  const board = sharingLeaderboard(visibleIds);

  const totalSessions = results.length;
  const totalInvolved = results.reduce((a, r) => a + r.headcount, 0);
  const totalRegistered = results.reduce((a, r) => a + r.registered, 0);
  const presenters = board.length;
  const avgPerSession = totalSessions ? Math.round(totalInvolved / totalSessions) : 0;
  const avgQuiz = totalSessions ? Math.round(results.reduce((a, r) => a + r.avgQuizScore, 0) / totalSessions) : 0;
  const avgRating = totalSessions ? +(results.reduce((a, r) => a + r.rating, 0) / totalSessions).toFixed(1) : 0;
  const reach = STAFF.length ? Math.min(100, Math.round((totalInvolved / STAFF.length) * 100)) : 0;

  const sorted = [...board].sort((a, b) =>
    sortBy === "involved" ? b.involved - a.involved
    : sortBy === "quiz"   ? b.avgQuiz - a.avgQuiz
    : b.sessions - a.sessions || b.involved - a.involved,
  );

  const byDate = [...results].sort((a, b) => b.date.localeCompare(a.date));
  const maxInvolved = Math.max(1, ...board.map(b => b.involved));

  return (
    <div className={embedded ? "" : "p-6"}
      style={embedded ? undefined : { backgroundColor: "#F4F6F9", minHeight: "calc(100vh - 56px)" }}>

      {!embedded && (
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <h1 className="text-[19px] font-extrabold" style={{ color: TEXT }}>Staff Sharing Sessions</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ color: "#B45309", backgroundColor: "#FEF3C7" }}>
              <Sparkles size={9} /> Staff-led
            </span>
          </div>
          <p className="text-[12px] mt-1" style={{ color: MUTED }}>
            Knowledge shared by staff themselves · visible to everyone · viewing as {ROLE_META[role].label}
          </p>
        </div>
      )}

      {/* ── Headline numbers ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <Tile icon={Sparkles}     label="Sharing sessions" value={totalSessions} sub={`${upcoming.length} upcoming`}                 color="#B45309" bg="#FEF3C7" />
        <Tile icon={Users}        label="Staff involved"   value={totalInvolved} sub={`of ${totalRegistered} registered`}            color="#1D4ED8" bg="#EFF6FF" />
        <Tile icon={Presentation} label="Staff presenters" value={presenters}    sub="colleagues who shared"                         color="#7C3AED" bg="#F3E8FF" />
        <Tile icon={TrendingUp}   label="Avg attendance"   value={avgPerSession} sub="staff per session"                             color="#0891B2" bg="#ECFEFF" />
        <Tile icon={Award}        label="Avg quiz score"   value={`${avgQuiz}%`} sub={`${avgRating} avg rating`}                     color={scoreColor(avgQuiz)} bg="#ECFDF5" />
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4 items-start">

        {/* ── Presenter leaderboard ──────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="px-5 py-3.5 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: "#F3F4F6" }}>
              <div className="flex items-center gap-2">
                <Medal size={15} style={{ color: AMBER }} />
                <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Staff who shared</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>
                  {board.length} presenter{board.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ backgroundColor: "#F4F6F9", border: `1px solid ${BORDER}` }}>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2" style={{ color: MUTED }}>Show</span>
                {VIEWS.map(v => (
                  <button key={v.id} onClick={() => setView(v.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all"
                    style={view === v.id
                      ? { backgroundColor: "white", color: TEXT, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                      : { backgroundColor: "transparent", color: MUTED }}>
                    {v.label}
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                      style={view === v.id ? { backgroundColor: "#FEF3C7", color: "#B45309" } : { backgroundColor: "#EBEDF0", color: MUTED }}>
                      {v.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ backgroundColor: "#F4F6F9", border: `1px solid ${BORDER}` }}>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2" style={{ color: MUTED }}>Sort</span>
                {([
                  { id: "sessions", label: "Sessions" },
                  { id: "involved", label: "Staff involved" },
                  { id: "quiz",     label: "Quiz score" },
                ] as const).map(({ id, label }) => (
                  <button key={id} onClick={() => setSortBy(id)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all"
                    style={sortBy === id
                      ? { backgroundColor: "white", color: TEXT, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                      : { backgroundColor: "transparent", color: MUTED }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr style={{ backgroundColor: "#F9FAFB" }}>
                  {["Presenter", "Department", "Sharings", "Staff involved", "Avg / session", "Avg quiz", "Last shared"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider border-b"
                      style={{ color: MUTED, borderColor: "#F3F4F6" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#F9FAFB" }}>
                {sorted.map((row, i) => {
                  const s = staffById(row.staffId);
                  if (!s) return null;
                  return (
                    <tr key={row.staffId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3" style={row.staffId === myId ? { backgroundColor: "#F0FDFA" } : undefined}>
                        <div className="flex items-center gap-2.5">
                          <div className="relative shrink-0">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                              style={{ backgroundColor: s.color }}>{s.initials}</div>
                            {i < 3 && sortBy === "sessions" && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-extrabold text-white"
                                style={{ backgroundColor: i === 0 ? "#D97706" : i === 1 ? "#9CA3AF" : "#B45309" }}>
                                {i + 1}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold truncate flex items-center gap-1.5" style={{ color: TEXT }}>
                              {s.name}
                              {s.id === myId && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0"
                                  style={{ color: "#047857", backgroundColor: "#D1FAE5" }}>you</span>
                              )}
                            </p>
                            <p className="text-[10px] truncate" style={{ color: MUTED }}>
                              {s.position}{s.isTrainer ? "" : " · not a formal trainer"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: "#6B7280" }}>{s.dept}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold"
                          style={{ color: "#B45309", backgroundColor: "#FEF3C7" }}>{row.sessions}</span>
                      </td>
                      <td className="px-4 py-3" style={{ minWidth: 140 }}>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-extrabold" style={{ color: "#1D4ED8", minWidth: 22 }}>{row.involved}</span>
                          <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, backgroundColor: "#F3F4F6" }}>
                            <div className="rounded-full" style={{ height: 5, width: `${(row.involved / maxInvolved) * 100}%`, backgroundColor: "#3B82F6" }} />
                          </div>
                        </div>
                        <p className="text-[9px] mt-1" style={{ color: MUTED }}>{row.registered} registered</p>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: TEXT }}>
                        {Math.round(row.involved / row.sessions)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] font-extrabold" style={{ color: scoreColor(row.avgQuiz) }}>{row.avgQuiz}%</span>
                        <span className="flex items-center gap-0.5 text-[10px] mt-0.5" style={{ color: MUTED }}>
                          <Star size={8} /> {row.avgRating}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px]" style={{ color: MUTED }}>{fmtDate(row.lastShared)}</td>
                    </tr>
                  );
                })}
                {!sorted.length && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[12px]" style={{ color: MUTED }}>
                    No sharing sessions recorded yet.
                  </td></tr>
                )}
              </tbody>
            </table>

            {board.length > 0 && (
              <div className="px-5 py-3 border-t flex items-center gap-4 flex-wrap" style={{ borderColor: "#F3F4F6", backgroundColor: "#FCFCFD" }}>
                <span className="text-[11px]" style={{ color: MUTED }}>
                  <b style={{ color: TEXT }}>{totalSessions}</b> sharing sessions ·
                  <b style={{ color: TEXT }}> {totalInvolved}</b> staff involved in total ·
                  <b style={{ color: TEXT }}> {presenters}</b> presenters
                </span>
              </div>
            )}
          </div>

          {/* ── Session log ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={15} style={{ color: AMBER }} />
              <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Sessions held</h2>
            </div>
            <p className="text-[11px] mb-4" style={{ color: MUTED }}>
              Headcount is attendance-confirmed; the bar compares attended against registered.
            </p>

            <div className="space-y-3">
              {byDate.map(r => {
                const s = staffById(r.trainerId);
                const cat = catStyle(r.topic);
                const showRate = Math.round((r.headcount / r.registered) * 100);
                return (
                  <div key={r.sessionId} className="rounded-lg border px-3.5 py-3" style={{ borderColor: BORDER }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold truncate" style={{ color: TEXT }}>{r.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                              style={{ backgroundColor: s?.color ?? MUTED }}>{s?.initials}</span>
                            <span className="text-[10px]" style={{ color: "#6B7280" }}>{s?.name}</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ color: cat.color, backgroundColor: cat.bg }}>
                            {cat.name}
                          </span>
                          <span className="text-[10px]" style={{ color: MUTED }}>{fmtDate(r.date)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[15px] font-extrabold leading-none" style={{ color: "#1D4ED8" }}>{r.headcount}</p>
                        <p className="text-[9px] mt-1" style={{ color: MUTED }}>staff involved</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, backgroundColor: "#F3F4F6" }}>
                        <div className="rounded-full" style={{ height: 5, width: `${showRate}%`, backgroundColor: "#3B82F6" }} />
                      </div>
                      <span className="text-[10px] shrink-0" style={{ color: MUTED }}>
                        {r.headcount}/{r.registered} attended · {showRate}%
                      </span>
                      <span className="text-[11px] font-bold shrink-0" style={{ color: scoreColor(r.avgQuizScore), minWidth: 34, textAlign: "right" }}>
                        {r.avgQuizScore}%
                      </span>
                    </div>
                  </div>
                );
              })}
              {!byDate.length && (
                <p className="text-[12px] py-6 text-center" style={{ color: MUTED }}>Nothing shared yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Side column ───────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Reach */}
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-2 mb-1">
              <UserCheck size={14} style={{ color: "#1D4ED8" }} />
              <h3 className="text-[13px] font-bold" style={{ color: TEXT }}>Reach</h3>
            </div>
            <p className="text-[11px] mb-3" style={{ color: MUTED }}>
              Total attendances across all sharing sessions, against headcount.
            </p>
            <div className="flex items-end gap-2 mb-2">
              <p className="text-[26px] font-extrabold leading-none" style={{ color: "#1D4ED8" }}>{totalInvolved}</p>
              <p className="text-[12px] font-semibold mb-0.5" style={{ color: MUTED }}>attendances</p>
            </div>
            <div className="rounded-full overflow-hidden mb-2" style={{ height: 6, backgroundColor: "#F3F4F6" }}>
              <div className="rounded-full" style={{ height: 6, width: `${reach}%`, backgroundColor: "#3B82F6" }} />
            </div>
            <p className="text-[10px]" style={{ color: MUTED }}>
              {reach}% of company headcount ({STAFF.length} staff) — counting repeat attendance.
            </p>
          </div>

          {/* Upcoming sharing */}
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays size={14} style={{ color: TEAL }} />
              <h3 className="text-[13px] font-bold" style={{ color: TEXT }}>Upcoming sharing</h3>
            </div>
            <p className="text-[11px] mb-3" style={{ color: MUTED }}>Registrations so far.</p>

            <div className="space-y-2.5">
              {upcoming.map(s => {
                const presenter = staffById(s.trainerId);
                const seats = seatCount(s.id);
                return (
                  <Link key={s.id} to={`/register/${s.id}`} className="block rounded-lg border px-3 py-2.5 transition-colors hover:bg-gray-50"
                    style={{ borderColor: BORDER }}>
                    <p className="text-[12px] font-semibold leading-snug mb-1" style={{ color: TEXT }}>{s.title}</p>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                        style={{ backgroundColor: presenter?.color ?? MUTED }}>{presenter?.initials}</span>
                      <span className="text-[10px] truncate" style={{ color: "#6B7280" }}>{presenter?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: MUTED }}>
                        <CalendarDays size={9} /> {fmtDate(s.date)} · in {daysUntil(s.date)}d
                      </span>
                      <span className="text-[10px] font-bold" style={{ color: TEAL }}>{seats}/{s.capacity}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px]" style={{ color: MUTED }}>
                      <MapPin size={9} /> {s.venue}
                    </div>
                  </Link>
                );
              })}
              {!upcoming.length && (
                <p className="text-[12px] py-3 text-center" style={{ color: MUTED }}>None scheduled.</p>
              )}
            </div>

            <Link to="/calendar" className="flex items-center justify-center gap-1 mt-3 py-2 rounded-lg text-[11px] font-bold"
              style={{ backgroundColor: "#F4F6F9", color: TEAL }}>
              Schedule a sharing session <ChevronRight size={11} />
            </Link>
          </div>

          {/* How it is counted */}
          <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: "#FFFBEB" }}>
            <div className="flex items-start gap-2">
              <Sparkles size={13} className="mt-0.5 shrink-0" style={{ color: AMBER }} />
              <p className="text-[10px] leading-relaxed" style={{ color: "#92400E" }}>
                Any staff member may present, whether or not they hold the trainer permission. The presenter is
                recorded as the trainer on the session, and every attendee whose attendance was confirmed is
                counted here and in their own training record.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
