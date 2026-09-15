import { useCallback, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { ApexSidebar } from "./ApexSidebar";
import { ApexHeader } from "./ApexHeader";
import { getCurrentAccount, pathIsAllowed } from "../auth";

export function ApexLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const account = getCurrentAccount();

  // Stable reference — prevents ApexSidebar from re-rendering on every collapse toggle
  const handleToggle = useCallback(() => setCollapsed(c => !c), []);

  if (!account) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!pathIsAllowed(account.role, location.pathname)) {
    return <Navigate to={account.landingPath} replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <ApexSidebar collapsed={collapsed} onToggle={handleToggle} />
      <div
        className="flex-1 flex flex-col min-h-screen"
        style={{ marginLeft: collapsed ? 64 : 220, transition: "margin-left 0.2s ease" }}
      >
        <ApexHeader />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
