import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Shield } from "lucide-react";
import tbmLogo from "../../imports/TBM_logo-removebg-preview.png";
import { SAMPLE_ACCOUNTS, signIn, signOut } from "../auth";

const TEAL = "#00C9A7";

const inputCls =
  "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-md text-[13px] text-[#1A1A2E] placeholder-[#C4C9D4] focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/30 focus:border-[#00C9A7] transition-all";

const labelCls = "block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-1.5";

export function Login() {
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPw, setShowPw]           = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState("");
  const navigate                       = useNavigate();

  // Clear any existing session so the login screen is always accessible
  useEffect(() => {
    signOut();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      const account = SAMPLE_ACCOUNTS.find(
        candidate => candidate.email.toLowerCase() === email.trim().toLowerCase() && candidate.password === password,
      );
      setIsLoading(false);
      if (!account) {
        setError("Use one of the sample accounts below. The demo password is demo1234.");
        return;
      }
      setError("");
      signIn(account);
      navigate(account.landingPath, { replace: true });
    }, 800);
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo1234");
    setError("");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#F4F6F9" }}
    >
      {/* ── Card ────────────────────────────────────────────────────── */}
      <div
        className="w-full max-w-[400px] bg-white rounded-lg px-10 py-10"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
      >

        {/* ── Company Logo ─────────────────────────────────────────── */}
        <div className="flex justify-center mb-6">
          <img
            src={tbmLogo}
            alt="TBM"
            className="h-10 object-contain"
          />
        </div>

        {/* ── Divider ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[10px] font-bold text-[#C4C9D4] uppercase tracking-widest">
            Powered by
          </span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* ── APEX Branding ────────────────────────────────────────── */}
        <div className="flex flex-col items-center mb-7">
          <div className="flex items-center gap-2.5 mb-1">
            {/* Teal accent square — matches sidebar */}
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: TEAL }}
            >
              <span className="text-white text-[10px] font-extrabold tracking-tight">A</span>
            </div>
            <span className="text-[22px] font-extrabold tracking-widest text-[#1A1A2E]">
              APEX
            </span>
          </div>
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[2px]">
            Career &amp; Learning
          </p>
        </div>

        {/* ── Heading ──────────────────────────────────────────────── */}
        <div className="text-center mb-6">
          <h1 className="text-[22px] font-bold text-[#1A1A2E] leading-tight mb-1">
            Welcome back
          </h1>
          <p className="text-[13px] text-[#9CA3AF]">Sign in to your account</p>
        </div>

        {/* ── Form ─────────────────────────────────────────────────── */}
        <form onSubmit={handleLogin} className="space-y-4">

          {/* Email */}
          <div>
            <label className={labelCls}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className={inputCls}
            />
          </div>

          {/* Password */}
          <div>
            <label className={labelCls}>Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4C9D4] hover:text-[#9CA3AF] transition-colors"
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="flex justify-end -mt-1">
            <button
              type="button"
              className="text-[12px] font-semibold transition-colors hover:opacity-80"
              style={{ color: TEAL }}
            >
              Forgot password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-md text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: TEAL }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Signing in…
              </>
            ) : (
              "Login"
            )}
          </button>
          {error && <p className="text-[11px] text-[#E2183D] text-center">{error}</p>}
        </form>

        {/* ── Role detection note ───────────────────────────────────── */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <Shield size={12} className="text-[#C4C9D4] shrink-0" />
          <p className="text-[11px] text-[#C4C9D4] text-center leading-tight">
            Access is assigned from your organisational account
          </p>
        </div>

        {/* ── Divider ──────────────────────────────────────────────── */}
        <div className="h-px bg-gray-100 my-5" />

        {/* ── Admin contact ─────────────────────────────────────────── */}
        <p className="text-[11px] text-[#9CA3AF] text-center">
          Don't have access?{" "}
          <button
            type="button"
            className="font-semibold transition-colors hover:opacity-80"
            style={{ color: TEAL }}
          >
            Contact your administrator
          </button>
        </p>

        {/* ── Demo accounts (subtle) ────────────────────────────────── */}
        <div className="mt-5 rounded-md border border-dashed border-gray-200 bg-[#FAFAFA] px-4 py-3">
          <p className="text-[10px] font-bold text-[#C4C9D4] uppercase tracking-widest mb-2.5 text-center">
            Demo Accounts
          </p>
          <div className="space-y-1.5">
            {SAMPLE_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => fillDemo(a.email)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all group"
              >
                <span className="text-[11px] text-[#9CA3AF] group-hover:text-[#6B7280] transition-colors truncate">
                  {a.name} · {a.email}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2"
                  style={{ color: a.role === "super_admin" ? "#7C3AED" : a.role === "manager_hod" ? "#3B82F6" : a.role === "hr" ? "#E2183D" : a.role === "trainer" ? TEAL : "#6B7280", backgroundColor: a.role === "super_admin" ? "#F3E8FF" : a.role === "manager_hod" ? "#EFF6FF" : a.role === "hr" ? "#FFF1F2" : a.role === "trainer" ? "#E8FAF7" : "#F3F4F6" }}
                >
                  {a.roleLabel}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <p className="text-center text-[10px] text-[#D1D5DB] mt-5">
          © 2026 TBM · APEX Career &amp; Learning · v3.2
        </p>
      </div>
    </div>
  );
}
