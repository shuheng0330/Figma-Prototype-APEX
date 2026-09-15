import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { User, Upload, FileCheck, GraduationCap, BarChart3, Users, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("User");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const name = localStorage.getItem("userName");
    if (!role) {
      navigate("/login", { replace: true });
    } else {
      setUserRole(role);
      setUserName(name || "User");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/" || path === "/upload") {
      return location.pathname === "/" || location.pathname === "/upload";
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-[#1A1A2E] border-b border-[#2a2a3e] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#00D4AA] rounded flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <span className="text-white text-xl font-semibold">APEX</span>
              </Link>

              <div className="flex gap-1">
                <Link
                  to="/upload"
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isActive("/upload")
                      ? "bg-[#2a2a3e] text-[#00D4AA]"
                      : "text-gray-300 hover:text-white hover:bg-[#2a2a3e]"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload SOP
                </Link>
                <Link
                  to="/review"
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isActive("/review")
                      ? "bg-[#2a2a3e] text-[#00D4AA]"
                      : "text-gray-300 hover:text-white hover:bg-[#2a2a3e]"
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  Review
                </Link>
                <Link
                  to="/portal"
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isActive("/portal")
                      ? "bg-[#2a2a3e] text-[#00D4AA]"
                      : "text-gray-300 hover:text-white hover:bg-[#2a2a3e]"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Learning Portal
                </Link>
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isActive("/dashboard")
                      ? "bg-[#2a2a3e] text-[#00D4AA]"
                      : "text-gray-300 hover:text-white hover:bg-[#2a2a3e]"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </Link>
                {userRole === "admin" && (
                  <Link
                    to="/users"
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      isActive("/users")
                        ? "bg-[#2a2a3e] text-[#00D4AA]"
                        : "text-gray-300 hover:text-white hover:bg-[#2a2a3e]"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    User Management
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-300 text-sm capitalize">{userName}</span>
              <div className="w-10 h-10 bg-[#00D4AA] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-2 text-gray-300 hover:text-white hover:bg-[#2a2a3e] rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
