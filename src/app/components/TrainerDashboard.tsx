import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Users, Award, Star, TrendingUp, Sparkles, CalendarDays, ClipboardCheck,
  BookOpen, Lock, ChevronRight, UserCheck, Presentation,
} from "lucide-react";
import { useRole, ROLE_META, scopeOf } from "../access";
import {
  STAFF, SESSIONS, PAST_RESULTS, ROLE_IDENTITY, catStyle,
  staffById, trainerStats, coursesOwnedBy, seatCount, waitCount,
  fmtDate, daysUntil, useStoreVersion,
} from "../trainingStore";

const TEAL = "#00C9A7";
const TEXT = "#1A1F2E";
const MUTED = "#9CA3AF";
const BORDER = "#E5E7EB";

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

/** Score bar — green above 85, amber 70-84, red below 70. */
function scoreColor(n: number) {
  return n >= 85 ? "#059669" : n >= 70 ? "#D97706" : "#DC2626";
}

export function TrainerDashboard({ embedded = false }: { embedded?: boolean } = {}) {
  const role = useRole();
  useStoreVersion();
  const myId = ROLE_IDENTITY[role] ?? "E001";
  const scope = scopeOf(role, "trainer-dashboard");

  // Who this viewer is allowed to look at.
  const visibleTrainers = useMemo(() => {
    const all = STAFF.filter(s => s.isTrainer);
    if (scope === "none") return [];
    if (scope === "all")  return all;
    if (scope === "team") return all.filter(s => s.superiorId === myId || s.id === myId);
    return all.filter(s => s.id === myId);
  }, [scope, myId]);

  const [selectedId, setSelectedId] = useState(
    () => (visibleTrainers.some(t => t.id === myId) ? myId : visibleTrainers[0]?.id ?? myId),
  );

  const trainer = scope === "none" ? undefined : staffById(selectedId);
  const stats = trainerStats(selectedId);
  const history = PAST_RESULTS.filter(r => r.trainerId === selectedId).sort((a, b) => b.date.localeCompare(a.date));
  const upcoming = SESSIONS
    .filter(s => s.trainerId === selectedId && daysUntil(s.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const myMaterials = coursesOwnedBy(selectedId);
  const isSelf = selectedId === myId;

  if (!trainer) {
    return (
      <div className={embedded ? "" : "p-6"}>
        <div className="bg-white rounded-xl p-8 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <Presentation size={28} className="mx-auto mb-3" style={{ color: "#D1D5DB" }} />
          <p className="text-[14px] font-bold" style={{ color: TEXT }}>
            {scope === "none" ? "Trainer dashboard not available for your role" : "No trainer record"}
          </p>
          <p className="text-[12px] mt-1" style={{ color: MUTED }}>
            {scope === "none"
              ? `${ROLE_META[role].label} accounts do not have trainer access. Super Admin grants the volunteer trainer permission from User Management.`
              : "Super Admin grants the trainer permission from User Management."}
          </p>
        </div>
      </div>
    );
  }

  const best = history.reduce((a, r) => (r.avgQuizScore > (a?.avgQuizScore ?? 0) ? r : a), history[0]);
  const worst = history.reduce((a, r) => (r.avgQuizScore < (a?.avgQuizScore ?? 100) ? r : a), history[0]);

  return (
    <div className={embedded ? "" : "p-6"}
      style={embedded ? undefined : { backgroundColor: "#F4F6F9", minHeight: "calc(100vh - 56px)" }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-[14px] font-extrabold shrink-0"
            style={{ backgroundColor: trainer.color }}>
            {trainer.initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[19px] font-extrabold" style={{ color: TEXT }}>
                {embedded ? trainer.name : isSelf ? "My Trainer Dashboard" : trainer.name}
              </h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ color: "#047857", backgroundColor: "#E8FAF7" }}>
                <Sparkles size={9} /> Volunteer trainer
              </span>
            </div>
            <p className="text-[12px] mt-1" style={{ color: MUTED }}>
              {trainer.position} · {trainer.dept} · trainer since {trainer.trainerSince ?? "—"}
            </p>
          </div>
        </div>

        {visibleTrainers.length > 1 && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: MUTED }}>
              Viewing ({ROLE_META[role].label} · {scope === "all" ? "all trainers" : "your team"})
            </label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="px-3 py-2 rounded-lg text-[12px] bg-white focus:outline-none"
              style={{ border: `1px solid ${BORDER}`, color: TEXT, minWidth: 220 }}
            >
              {visibleTrainers.map(t => (
                <option key={t.id} value={t.id}>{t.name} — {t.dept}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Headline numbers ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <Tile icon={Presentation} label="Sessions run"   value={stats.sessions}  sub={`${stats.sharingSessions} staff sharing`}  color="#7C3AED" bg="#F3E8FF" />
        <Tile icon={Users}        label="Participants"   value={stats.headcount} sub="attendance-confirmed headcount"           color="#1D4ED8" bg="#EFF6FF" />
        <Tile icon={Award}        label="Avg quiz score" value={`${stats.avgQuiz}%`} sub="training effectiveness"               color={scoreColor(stats.avgQuiz)} bg="#ECFDF5" />
        <Tile icon={UserCheck}    label="Show-up rate"   value={`${stats.showRate}%`} sub="attended vs registered"              color="#0891B2" bg="#ECFEFF" />
        <Tile icon={Star}         label="Avg rating"     value={stats.avgRating} sub="participant feedback"                     color="#D97706" bg="#FFFBEB" />
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4 items-start">

        {/* ── Effectiveness by session ──────────────────────────────────── */}
        <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} style={{ color: TEAL }} />
              <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Training effectiveness</h2>
            </div>
            <span className="text-[11px]" style={{ color: MUTED }}>Average quiz score per session</span>
          </div>
          <p className="text-[11px] mb-4" style={{ color: MUTED }}>
            Scores come from the post-session quiz taken by participants whose attendance was recorded.
          </p>

          <div className="space-y-3">
            {history.map(r => (
              <div key={r.sessionId}>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-[12px] font-semibold truncate" style={{ color: TEXT }}>{r.title}</p>
                    {r.kind === "Sharing Session" && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                        style={{ color: "#B45309", backgroundColor: "#FEF3C7" }}>
                        <Sparkles size={8} /> Sharing
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: MUTED }}>
                      <Users size={10} /> {r.headcount}/{r.registered}
                    </span>
                    <span className="text-[12px] font-extrabold" style={{ color: scoreColor(r.avgQuizScore), minWidth: 34, textAlign: "right" }}>
                      {r.avgQuizScore}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "#F3F4F6" }}>
                    <div className="rounded-full transition-all" style={{ height: 6, width: `${r.avgQuizScore}%`, backgroundColor: scoreColor(r.avgQuizScore) }} />
                  </div>
                  <span className="text-[10px] shrink-0" style={{ color: MUTED, minWidth: 74 }}>{fmtDate(r.date)}</span>
                </div>
              </div>
            ))}
            {!history.length && (
              <p className="text-[12px] py-6 text-center" style={{ color: MUTED }}>No completed sessions yet.</p>
            )}
          </div>

          {history.length > 1 && (
            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t" style={{ borderColor: "#F3F4F6" }}>
              <div className="px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#ECFDF5" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#047857" }}>Most effective</p>
                <p className="text-[12px] font-semibold truncate" style={{ color: "#065F46" }}>{best.title}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#059669" }}>{best.avgQuizScore}% avg · {best.headcount} participants</p>
              </div>
              <div className="px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#FFFBEB" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#B45309" }}>Needs review</p>
                <p className="text-[12px] font-semibold truncate" style={{ color: "#92400E" }}>{worst.title}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#D97706" }}>{worst.avgQuizScore}% avg · consider reworking the material</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Upcoming sessions */}
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays size={15} style={{ color: "#1D4ED8" }} />
              <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Sessions I am running</h2>
            </div>
            <p className="text-[11px] mb-3.5" style={{ color: MUTED }}>Record attendance on the day to close the record.</p>

            <div className="space-y-2.5">
              {upcoming.map(s => {
                const seats = seatCount(s.id);
                const wait = waitCount(s.id);
                const topic = catStyle(s.topic);
                return (
                  <Link key={s.id} to="/attendance" className="block rounded-lg border px-3 py-2.5 transition-colors hover:bg-gray-50"
                    style={{ borderColor: BORDER }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ color: topic.color, backgroundColor: topic.bg }}>
                        {catStyle(s.topic).name}
                      </span>
                      <span className="text-[10px]" style={{ color: MUTED }}>{fmtDate(s.date)}</span>
                    </div>
                    <p className="text-[12px] font-semibold leading-snug mb-1.5" style={{ color: TEXT }}>{s.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: MUTED }}>
                        {seats}/{s.capacity} registered{wait > 0 ? ` · ${wait} waitlisted` : ""}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: TEAL }}>
                        <ClipboardCheck size={10} /> Attendance
                      </span>
                    </div>
                  </Link>
                );
              })}
              {!upcoming.length && <p className="text-[12px] py-3 text-center" style={{ color: MUTED }}>Nothing scheduled.</p>}
            </div>
          </div>

          {/* Own materials — permission rule made visible */}
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={15} style={{ color: "#7C3AED" }} />
              <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>My materials</h2>
            </div>
            <div className="flex items-start gap-1.5 mb-3.5 mt-1.5 px-2.5 py-2 rounded-lg" style={{ backgroundColor: "#F9FAFB" }}>
              <Lock size={11} className="mt-0.5 shrink-0" style={{ color: MUTED }} />
              <p className="text-[10px] leading-relaxed" style={{ color: MUTED }}>
                Trainers can edit and assign only the materials they created. Everything else is read-only.
              </p>
            </div>

            <div className="space-y-2">
              {myMaterials.map(c => (
                <div key={c.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg" style={{ backgroundColor: "#F9FAFB" }}>
                  <span className="text-[15px]">{c.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold truncate" style={{ color: TEXT }}>{c.title}</p>
                    <p className="text-[10px]" style={{ color: MUTED }}>{catStyle(c.categoryIds[0]).name} · {c.duration}</p>
                  </div>
                </div>
              ))}
              {!myMaterials.length && <p className="text-[12px] py-2 text-center" style={{ color: MUTED }}>No materials created yet.</p>}
            </div>

            <Link to="/assign-training" className="flex items-center justify-center gap-1 mt-3 py-2 rounded-lg text-[11px] font-bold"
              style={{ backgroundColor: "#F4F6F9", color: TEAL }}>
              Assign my materials <ChevronRight size={11} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
