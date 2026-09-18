import { useLocation } from "react-router";
import { Bell, Search, ChevronRight, Menu } from "lucide-react";
import { getCurrentAccount } from "../auth";

const BREADCRUMBS: Record<string, string[]> = {
  "/": ["Performance", "SOP Management"],
  "/upload": ["Performance", "SOP Management"],
  "/dashboard": ["Performance", "Team Dashboard"],
  "/review": ["Learning", "Training Review"],
  "/portal": ["Learning", "My Learning"],
  "/calendar": ["Learning", "Training Calendar"],
  "/profile": ["Learning", "My Profile"],
  "/users": ["Administration", "User Management"],
  "/performance/review-periods": ["Staff Performance", "Review Periods"],
  "/performance/my-kpi-plan": ["Staff Performance", "My KPI Plan"],
  "/performance/my-assessments": ["Staff Performance", "My Assessments"],
  "/performance/team-reviews": ["Staff Performance", "Team Reviews"],
  "/performance/final-appraisals": ["Staff Performance", "Team Appraisals"],
  "/performance/hr-appraisals": ["Staff Performance", "HR Appraisal Review"],
};

export function ApexHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();
  // Resolve breadcrumbs — exact match first, then prefix match for dynamic setup routes
  const crumbs = BREADCRUMBS[location.pathname]
    ?? (location.pathname.startsWith("/performance/final-appraisals/") ? ["Staff Performance", "Team Appraisals", "Final Appraisal Recommendation"]
    :  location.pathname.startsWith("/performance/hr-appraisals/")     ? ["Staff Performance", "HR Appraisal Review", "Appraisal Detail"]
    :  location.pathname.endsWith("/edit") ? ["Staff Performance", "Edit Review Period"]
    :  location.pathname.endsWith("/view") ? ["Staff Performance", "Review Period"]
    :  location.pathname === "/performance/review-periods/new" ? ["Staff Performance", "New Review Period"]
    :  ["APEX", "Home"]);

  const account = getCurrentAccount();
  const userName = account?.name ?? "APEX User";
  const userRole = account?.roleLabel ?? "Employee";
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <header className="apex-header h-[56px] bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Left – Breadcrumb */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          aria-label="Open navigation"
          aria-controls="apex-navigation"
          onClick={onMenuClick}
          className="apex-menu-button hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#6B7280] hover:bg-gray-50"
        >
          <Menu size={20} />
        </button>
      <nav className="flex min-w-0 items-center gap-1.5 text-[13px]">
        {crumbs.map((c, i) => (
          <span key={i} className={`items-center gap-1.5 ${i === crumbs.length - 1 ? "flex min-w-0" : "flex apex-optional-crumb"}`}>
            {i > 0 && <ChevronRight size={13} className="text-[#D1D5DB]" />}
            <span className={`${i === crumbs.length - 1 ? "font-semibold text-[#1A1F2E] truncate" : "text-[#9CA3AF]"}`}>
              {c}
            </span>
          </span>
        ))}
      </nav>
      </div>

      {/* Right – Actions */}
      <div className="flex items-center gap-1.5">
        <button aria-label="Search" className="apex-header-search p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <Search size={17} className="text-[#9CA3AF]" />
        </button>
        <button aria-label="Notifications" className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <Bell size={17} className="text-[#9CA3AF]" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#EF4444] ring-2 ring-white" />
        </button>

        <div className="w-px h-5 bg-gray-100 mx-1.5" />

        <div className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
          <div className="apex-user-copy text-right">
            <p className="text-[12px] font-semibold text-[#1A1F2E] leading-tight">{userName}</p>
            <p className="text-[10px] text-[#9CA3AF] leading-tight">{userRole}</p>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ backgroundColor: "#00C9A7" }}>
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
