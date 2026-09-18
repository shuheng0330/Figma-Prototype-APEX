import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";

export function Root() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Always start at login — redirect root "/" to "/login"
    if (location.pathname === "/") {
      navigate("/login", { replace: true });
    }
  }, [navigate, location.pathname]);

  return <Outlet />;
}
