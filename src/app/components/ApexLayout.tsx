import { useCallback, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { ApexSidebar } from "./ApexSidebar";
import { ApexHeader } from "./ApexHeader";
import { getCurrentAccount, pathIsAllowed } from "../auth";

export function ApexLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const account = getCurrentAccount();

  // Stable reference — prevents ApexSidebar from re-rendering on every collapse toggle
  const handleToggle = useCallback(() => setCollapsed(c => !c), []);
  const handleMobileOpen = useCallback(() => {
    setCollapsed(false);
    setMobileOpen(true);
  }, []);
  const handleMobileClose = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  if (!account) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!pathIsAllowed(account.role, location.pathname)) {
    return <Navigate to={account.landingPath} replace />;
  }

  return (
    <div className="apex-shell flex min-h-screen bg-[#F4F6F9]">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Dismiss navigation"
          className="apex-mobile-backdrop fixed inset-0 z-[29] bg-black/40 md:hidden"
          onClick={handleMobileClose}
        />
      )}
      <ApexSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={handleToggle}
        onClose={handleMobileClose}
      />
      <div
        className="apex-content min-w-0 flex-1 flex flex-col min-h-screen"
        style={{ marginLeft: collapsed ? 64 : 220, transition: "margin-left 0.2s ease" }}
      >
        <ApexHeader onMenuClick={handleMobileOpen} />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
