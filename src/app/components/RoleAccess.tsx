import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ShieldCheck, Check, Minus, Users, Handshake, Sparkles, Eye,
  UserCog, Lock, Info,
} from "lucide-react";
import {
  ACCESS, FEATURE_META, ROLE_META, ROLES, SCOPE_LABEL, SCOPE_STYLE,
  READ_ONLY, useRole, canEdit, ROLE_TO_AUTH, type Feature, type Role,
} from "../access";
import { SAMPLE_ACCOUNTS, signIn } from "../auth";
import { STAFF, grantTrainer, useStoreVersion } from "../trainingStore";

const TEAL = "#00C9A7";
const TEXT = "#1A1F2E";
const MUTED = "#9CA3AF";
const BORDER = "#E5E7EB";

const FEATURE_ORDER = Object.keys(FEATURE_META) as Feature[];

export function RoleAccess() {
  const role = useRole();
  const navigate = useNavigate();
  useStoreVersion();
  const isSuperAdmin = role === "admin";
  const mayGrant = canEdit(role, "users");

  const groups = useMemo(() => {
    const out: Record<string, Feature[]> = {};
    FEATURE_ORDER.forEach(f => {
      const g = FEATURE_META[f].group;
      (out[g] ??= []).push(f);
    });
    return out;
  }, []);

  const [preview, setPreview] = useState<Role>(role);

  /** Demo helper — signs in as the sample account for that role so each view can be checked. */
  function applyPreview(r: Role) {
    const account = SAMPLE_ACCOUNTS.find(a => a.role === ROLE_TO_AUTH[r]);
    if (!account) return;
    setPreview(r);
    signIn(account);
    window.dispatchEvent(new Event("userRoleChange"));
    navigate("/portal");
  }

  return (
    <div className="p-6" style={{ backgroundColor: "#F4F6F9", minHeight: "calc(100vh - 56px)" }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[19px] font-extrabold" style={{ color: TEXT }}>Role Access Matrix</h1>
          <p className="text-[12px] mt-1" style={{ color: MUTED }}>
            Every feature, and exactly how much each role may act on — the reference for confirming setup
          </p>
        </div>
      </div>

      {/* ── Role cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {ROLES.map(r => {
          const m = ROLE_META[r];
          const count = FEATURE_ORDER.filter(f => ACCESS[f][r] !== "none").length;
          return (
            <div key={r} className="bg-white rounded-xl p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-extrabold"
                  style={{ backgroundColor: m.bg, color: m.color }}>
                  {m.short}
                </div>
                <p className="text-[12px] font-bold" style={{ color: TEXT }}>{m.label}</p>
              </div>
              <p className="text-[10px] leading-relaxed mb-2.5" style={{ color: MUTED, minHeight: 42 }}>{m.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold" style={{ color: m.color }}>{count}/{FEATURE_ORDER.length} features</span>
                <button onClick={() => applyPreview(r)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-colors"
                  style={preview === r
                    ? { backgroundColor: m.color, color: "white" }
                    : { backgroundColor: "#F4F6F9", color: "#6B7280" }}>
                  <Eye size={9} /> View as
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── The two answers the business asked for ───────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl px-5 py-4 flex items-start gap-2.5" style={{ backgroundColor: "#ECFEFF" }}>
          <Handshake size={15} className="mt-0.5 shrink-0" style={{ color: "#0891B2" }} />
          <div>
            <p className="text-[12px] font-bold mb-1" style={{ color: "#155E75" }}>
              HR and Manager both set up IDPs
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: "#0E7490" }}>
              HR owns plans company-wide; each Manager/Superior owns their own team&apos;s. A goal needs
              both approvals before it becomes Agreed. Staff and trainers get read-only access to their own plan.
            </p>
          </div>
        </div>
        <div className="rounded-xl px-5 py-4 flex items-start gap-2.5" style={{ backgroundColor: "#F0FDFA" }}>
          <Users size={15} className="mt-0.5 shrink-0" style={{ color: "#047857" }} />
          <div>
            <p className="text-[12px] font-bold mb-1" style={{ color: "#065F46" }}>
              HR and Manager both assign learning paths
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: "#047857" }}>
              HR maintains the role-based templates and assigns them to large departments. Managers assign
              to their own department and to individuals in small teams.
            </p>
          </div>
        </div>
      </div>

      {/* ── Matrix ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl overflow-hidden mb-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <div className="px-5 py-3.5 border-b flex items-center gap-2 flex-wrap" style={{ borderColor: "#F3F4F6" }}>
          <ShieldCheck size={15} style={{ color: TEAL }} />
          <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Feature access by role</h2>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {(["all", "team", "own", "none"] as const).map(s => (
              <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ color: SCOPE_STYLE[s].color, backgroundColor: SCOPE_STYLE[s].bg }}>
                {SCOPE_LABEL[s]}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 760 }}>
            <thead>
              <tr style={{ backgroundColor: "#F9FAFB" }}>
                <th className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider border-b"
                  style={{ color: MUTED, borderColor: "#F3F4F6", width: "34%" }}>Feature</th>
                {ROLES.map(r => (
                  <th key={r} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider border-b text-center"
                    style={{ color: ROLE_META[r].color, borderColor: "#F3F4F6" }}>
                    {ROLE_META[r].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groups).map(([group, features]) => (
                <Fragment key={group}>
                  <tr>
                    <td colSpan={ROLES.length + 1} className="px-5 py-2 text-[10px] font-extrabold uppercase tracking-wider"
                      style={{ color: "#B0B8C8", backgroundColor: "#FCFCFD" }}>
                      {group}
                    </td>
                  </tr>
                  {features.map(f => (
                    <tr key={f} className="hover:bg-gray-50 border-b" style={{ borderColor: "#F9FAFB" }}>
                      <td className="px-5 py-2.5">
                        <p className="text-[12px] font-semibold" style={{ color: TEXT }}>{FEATURE_META[f].label}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>{FEATURE_META[f].note}</p>
                      </td>
                      {ROLES.map(r => {
                        const scope = ACCESS[f][r];
                        const readOnly = (READ_ONLY[f] ?? []).includes(r);
                        return (
                          <td key={r} className="px-3 py-2.5 text-center">
                            {scope === "none" ? (
                              <Minus size={13} className="mx-auto" style={{ color: "#E5E7EB" }} />
                            ) : (
                              <div className="inline-flex flex-col items-center gap-0.5">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
                                  style={{ color: SCOPE_STYLE[scope].color, backgroundColor: SCOPE_STYLE[scope].bg }}>
                                  {SCOPE_LABEL[scope]}
                                </span>
                                {readOnly && (
                                  <span className="flex items-center gap-0.5 text-[9px]" style={{ color: MUTED }}>
                                    <Lock size={7} /> view only
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Trainer permission grants ────────────────────────────────────── */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ borderColor: "#F3F4F6" }}>
          <UserCog size={15} style={{ color: "#7C3AED" }} />
          <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Volunteer trainer permission</h2>
          <span className="text-[11px] ml-1" style={{ color: MUTED }}>
            Granted by Super Admin · a trainer can still only touch their own materials
          </span>
        </div>

        <div className="p-4 grid grid-cols-3 gap-2.5">
          {STAFF.map(s => (
            <div key={s.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border"
              style={{ borderColor: s.isTrainer ? "#A7F3D0" : BORDER, backgroundColor: s.isTrainer ? "#F0FDFA" : "white" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: s.color }}>{s.initials}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold truncate" style={{ color: TEXT }}>{s.name}</p>
                <p className="text-[10px] truncate" style={{ color: MUTED }}>
                  {s.isTrainer ? `Trainer since ${s.trainerSince}` : s.position}
                </p>
              </div>
              <button
                disabled={!mayGrant}
                onClick={() => grantTrainer(s.id, !s.isTrainer)}
                className="px-2.5 py-1 rounded-md text-[10px] font-bold shrink-0 transition-colors"
                style={{
                  backgroundColor: s.isTrainer ? TEAL : "#F3F4F6",
                  color: s.isTrainer ? "white" : "#9CA3AF",
                  cursor: mayGrant ? "pointer" : "not-allowed",
                  opacity: mayGrant ? 1 : 0.6,
                }}
              >
                {s.isTrainer ? <span className="flex items-center gap-1"><Check size={9} /> Trainer</span> : "Grant"}
              </button>
            </div>
          ))}
        </div>

        {!isSuperAdmin && (
          <div className="px-5 py-3 border-t flex items-start gap-2" style={{ borderColor: "#F3F4F6", backgroundColor: "#F9FAFB" }}>
            <Info size={12} className="mt-0.5 shrink-0" style={{ color: MUTED }} />
            <p className="text-[11px]" style={{ color: MUTED }}>
              {mayGrant
                ? "HR can grant trainer permission alongside Super Admin."
                : "Only Super Admin and HR can change trainer permission."}
            </p>
          </div>
        )}
      </div>

      <p className="flex items-center justify-center gap-1.5 text-[11px] mt-4" style={{ color: MUTED }}>
        <Sparkles size={11} style={{ color: TEAL }} />
        Use <b style={{ color: "#6B7280" }}>View as</b> on any role card to load the app exactly as that role sees it.
      </p>
    </div>
  );
}
