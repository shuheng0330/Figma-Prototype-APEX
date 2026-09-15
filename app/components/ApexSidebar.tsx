import { Link, useLocation } from "react-router";
import {
  BarChart3, Globe, BookOpen, FileCheck, Upload, Settings, LogOut,
  CalendarDays, CalendarRange, User, ClipboardCheck, ClipboardList,
  HelpCircle, UserPlus, Users, Target, Award, ShieldCheck,
  ChevronLeft, ChevronRight, Layers, Building2, SlidersHorizontal,
} from "lucide-react";
import { getCurrentAccount, pathIsAllowed, type OrganisationalRole } from "../auth";

const T = "#00C9A7";

const ROUTE_ACTIVE_ID: Record<string, string> = {
  "/": "upload-sop",
  "/upload": "upload-sop",
  "/review": "training-review",
  "/training-score": "training-score",
  "/assign-training": "assign-training",
  "/portal": "my-learning",
  "/calendar": "calendar",
  "/profile": "my-profile",
  "/dashboard": "team-eval",
  "/performance": "staff-perf",
  "/org-eval": "org-eval",
  "/users": "admin-users",
  "/performance/review-periods": "review-periods",
  "/performance/my-kpi-plan":     "kpi-plan",
  "/performance/department-kpis": "dept-kpis",
  "/performance/company-kpis":    "company-kpis",
  "/performance/attitude-setup":  "attitude-setup",
  "/performance/my-assessments": "assessments",
  "/performance/team-reviews": "team-reviews",
  "/performance/final-appraisals": "final-appraisals",
  "/performance/hr-appraisals": "hr-appraisals",
};

interface NavItem { id: string; label: string; path: string; icon: React.ElementType; }
interface Section { title: string; items: NavItem[]; }

const MY_PERFORMANCE: Section = { title: "MY PERFORMANCE", items: [
  { id: "kpi-plan", label: "My KPI Plan", path: "/performance/my-kpi-plan", icon: Target },
  { id: "assessments", label: "My Assessments", path: "/performance/my-assessments", icon: ClipboardList },
  { id: "staff-perf", label: "My Performance", path: "/performance", icon: User },
] };

const APPRAISAL_MANAGEMENT: Section = { title: "APPRAISAL MANAGEMENT", items: [
  { id: "hr-appraisals", label: "Appraisal Reviews", path: "/performance/hr-appraisals", icon: ShieldCheck },
] };

const ORGANISATION: Section = { title: "ORGANISATION", items: [
  { id: "org-eval", label: "Organisation Performance", path: "/org-eval", icon: Globe },
] };

const MY_LEARNING: Section = { title: "MY LEARNING", items: [
  { id: "my-learning", label: "Learning Portal", path: "/portal", icon: BookOpen },
  { id: "calendar", label: "Training Calendar", path: "/calendar", icon: CalendarDays },
  { id: "my-profile", label: "My Profile", path: "/profile", icon: User },
] };

const TRAINING_MANAGEMENT: Section = { title: "TRAINING MANAGEMENT", items: [
  { id: "upload-sop", label: "Upload SOP", path: "/upload", icon: Upload },
  { id: "training-review", label: "Review Materials", path: "/review", icon: FileCheck },
  { id: "quiz-review", label: "Review Quizzes", path: "/quiz-review", icon: HelpCircle },
  { id: "assign-training", label: "Assign Training", path: "/assign-training", icon: UserPlus },
  { id: "training-score", label: "Training Scoreboard", path: "/training-score", icon: ClipboardCheck },
] };

const ADMINISTRATION: Section = { title: "ADMINISTRATION", items: [
  { id: "admin-users", label: "User Management", path: "/users", icon: Settings },
] };

const NAV_BY_ROLE: Record<OrganisationalRole, Section[]> = {
  employee: [MY_PERFORMANCE, MY_LEARNING],
  manager_hod: [MY_PERFORMANCE, {
    title: "KPI MANAGEMENT", items: [
      { id: "dept-kpis", label: "Department KPIs", path: "/performance/department-kpis", icon: Layers },
      { id: "team-reviews", label: "Team Reviews", path: "/performance/team-reviews", icon: Users },
    ],
  }, {
    title: "TEAM PERFORMANCE", items: [
      { id: "team-eval", label: "Team Performance", path: "/dashboard", icon: BarChart3 },
      { id: "final-appraisals", label: "Team Appraisals", path: "/performance/final-appraisals", icon: Award },
    ],
  }, MY_LEARNING],
  hr: [MY_PERFORMANCE, APPRAISAL_MANAGEMENT, ORGANISATION, MY_LEARNING],
  super_admin: [{
    title: "KPI ADMINISTRATION", items: [
      { id: "review-periods", label: "Review Period", path: "/performance/review-periods", icon: CalendarRange },
      { id: "company-kpis", label: "Company KPIs", path: "/performance/company-kpis", icon: Building2 },
      { id: "attitude-setup", label: "Attitude Setup", path: "/performance/attitude-setup", icon: SlidersHorizontal },
    ],
  }, ORGANISATION, TRAINING_MANAGEMENT, ADMINISTRATION],
  trainer: [TRAINING_MANAGEMENT, MY_LEARNING],
};

interface Props { collapsed: boolean; onToggle: () => void; }

function Tooltip({ label }: { label: string }) {
  return (
    <div
      className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white whitespace-nowrap pointer-events-none z-50"
      style={{ backgroundColor: "#1A1F2E", boxShadow: "0 4px 12px rgba(0,0,0,0.18)" }}
    >
      {label}
      <span
        className="absolute right-full top-1/2 -translate-y-1/2"
        style={{ borderWidth: "5px 5px 5px 0", borderStyle: "solid", borderColor: "transparent #1A1F2E transparent transparent" }}
      />
    </div>
  );
}

export function ApexSidebar({ collapsed, onToggle }: Props) {
  const location = useLocation();
  const activeId = ROUTE_ACTIVE_ID[location.pathname]
    ?? (location.pathname.startsWith("/performance/final-appraisals/") ? "final-appraisals"
    :  location.pathname.startsWith("/performance/hr-appraisals/")     ? "hr-appraisals"
    : "");

  const account = getCurrentAccount();
  const filteredNav = account
    ? NAV_BY_ROLE[account.role].map(section => ({
        ...section,
        items: section.items.filter(item => pathIsAllowed(account.role, item.path)),
      })).filter(section => section.items.length > 0)
    : [];

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 bg-white border-r border-gray-100 z-30 flex flex-col overflow-y-auto overflow-x-hidden"
      style={{ width: collapsed ? 64 : 220, transition: "width 0.2s ease" }}
    >
      {/* Logo */}
      <div className="h-[56px] flex items-center border-b border-gray-100 shrink-0 overflow-hidden" style={{ padding: collapsed ? "0 14px" : "0 20px" }}>
        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: T }}>
          <span className="text-white text-xs font-extrabold tracking-widest">A</span>
        </div>
        <div
          className="ml-3 overflow-hidden"
          style={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto", transition: "opacity 0.15s ease, width 0.2s ease" }}
        >
          <p className="text-[13px] font-extrabold text-[#1A1F2E] tracking-wide leading-none whitespace-nowrap">APEX</p>
          <p className="text-[9px] text-[#9CA3AF] uppercase tracking-widest leading-none mt-0.5 whitespace-nowrap">Career &amp; Learning</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {filteredNav.map((section, si) => (
          <div key={section.title} className={si > 0 ? "mt-2" : ""}>
            {collapsed ? (
              <div className="mx-3 my-2 border-t border-gray-100" />
            ) : (
              <p className="px-4 mb-1 text-[10px] font-bold text-[#B0B8C8] uppercase tracking-[0.8px] whitespace-nowrap">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const active = item.id === activeId;
              const Icon = item.icon;
              if (collapsed) {
                return (
                  <div key={item.id} className="relative group flex justify-center my-0.5 px-2">
                    <Link
                      to={item.path}
                      className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
                      style={active ? { backgroundColor: "#E8FAF7" } : { backgroundColor: "transparent" }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#F9FAFB"; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"; }}
                    >
                      <Icon size={17} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? T : "#9CA3AF" }} />
                    </Link>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50">
                      <Tooltip label={item.label} />
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={`${section.title}-${item.id}`}
                  to={item.path}
                  className={`flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-[13px] transition-all duration-100 border-l-[3px] ${
                    active
                      ? "border-l-[#00C9A7] bg-[#E8FAF7] text-[#00C9A7] font-semibold"
                      : "border-l-transparent text-[#6B7280] hover:bg-gray-50 hover:text-[#1A1F2E]"
                  }`}
                >
                  <Icon size={15} className={active ? "text-[#00C9A7]" : "text-[#9CA3AF]"} strokeWidth={active ? 2.2 : 1.8} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 py-2 shrink-0">
        {collapsed ? (
          <>
            <div className="relative group flex justify-center my-0.5 px-2">
              <Link to="/login" className="w-10 h-10 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-gray-50 transition-colors">
                <LogOut size={17} strokeWidth={1.8} />
              </Link>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50">
                <Tooltip label="Sign Out" />
              </div>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-[13px] text-[#6B7280] hover:bg-gray-50 hover:text-[#1A1F2E] border-l-[3px] border-l-transparent transition-all">
              <LogOut size={15} className="text-[#9CA3AF]" strokeWidth={1.8} />
              <span>Sign Out</span>
            </Link>
          </>
        )}
        <div className={`flex ${collapsed ? "justify-center px-2" : "px-3"} mt-1`}>
          <button
            onClick={onToggle}
            className="flex items-center gap-2 py-2 rounded-lg text-[#9CA3AF] hover:text-[#1A1F2E] hover:bg-gray-50 transition-colors text-[12px] font-medium"
            style={{ width: collapsed ? 40 : "100%", justifyContent: collapsed ? "center" : "flex-start", paddingLeft: collapsed ? 0 : 8 }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed
              ? <ChevronRight size={15} strokeWidth={2} />
              : (<><ChevronLeft size={15} strokeWidth={2} /><span>Collapse</span></>)
            }
          </button>
        </div>
      </div>
    </aside>
  );
}
