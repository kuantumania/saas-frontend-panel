"use client";

import { useState } from "react";
import { Layers, ArrowRight, Loader2, Shield, KeyRound, UserPlus } from "lucide-react";

const API = "https://saas-asset-backend.onrender.com";

type AuthMode = "lead" | "member" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("lead");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [studioName, setStudioName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/studio/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.session_token) {
        localStorage.setItem("lead_session_token", data.session_token);
        localStorage.setItem("lead_studio", JSON.stringify(data.studio || {}));
        localStorage.setItem("session_user", JSON.stringify({ role: "lead", name: data?.studio?.name || "Lead" }));
        window.location.href = "/dashboard";
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Server unavailable");
    }
    setLoading(false);
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const verifyRes = await fetch(`${API}/api/verify_pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim().toUpperCase() }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData?.success) {
        setError(verifyData?.error || "Invalid PIN");
        setLoading(false);
        return;
      }

      if (verifyData.status === "claimed") {
        localStorage.setItem("lead_session_token", verifyData.session_token);
        localStorage.setItem("lead_studio", JSON.stringify({ slug: verifyData.workspace }));
        localStorage.setItem("session_user", JSON.stringify(verifyData.user || { role: "member" }));
        window.location.href = "/dashboard";
        return;
      }

      if (!name.trim()) {
        setError("Name is required for first-time PIN claim");
        setLoading(false);
        return;
      }

      const claimRes = await fetch(`${API}/api/claim_pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim().toUpperCase(), name: name.trim() }),
      });
      const claimData = await claimRes.json();

      if (claimRes.ok && claimData.session_token) {
        localStorage.setItem("lead_session_token", claimData.session_token);
        localStorage.setItem("lead_studio", JSON.stringify({ slug: verifyData.workspace }));
        localStorage.setItem("session_user", JSON.stringify(claimData.user || { role: "member", name: name.trim() }));
        window.location.href = "/dashboard";
      } else {
        setError(claimData.error || "PIN claim failed");
      }
    } catch {
      setError("Server unavailable");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!studioName.trim() || studioName.trim().length < 2) {
      setError("Studio name must be at least 2 characters.");
      setLoading(false);
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/api/studio/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: studioName.trim(),
          email: regEmail.trim().toLowerCase(),
          password: regPassword,
        }),
      });
      const data = await res.json();

      if (res.ok && data.session_token) {
        localStorage.setItem("lead_session_token", data.session_token);
        localStorage.setItem("lead_studio", JSON.stringify(data.studio || {}));
        localStorage.setItem("session_user", JSON.stringify({ role: "lead", name: data?.studio?.name || studioName.trim() }));
        window.location.href = "/dashboard";
      } else {
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch {
      setError("Server unavailable");
    }
    setLoading(false);
  };

  const getFormHandler = () => {
    if (mode === "lead") return handleLogin;
    if (mode === "member") return handleMemberLogin;
    return handleRegister;
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-purple-600/4 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-[420px] px-6">
        {/* Logo + Nav */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Layers className="w-6 h-6 text-blue-500" strokeWidth={1.5} />
            <span className="text-base font-semibold tracking-tight text-[#EDEDED]">Kuantum Studio</span>
          </a>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#1E1E1E] bg-[#121212]/80 backdrop-blur-sm p-7 shadow-2xl shadow-black/30">
          <h1 className="text-lg font-semibold text-[#EDEDED] mb-1 tracking-tight">
            {mode === "register" ? "Create your studio" : "Welcome back"}
          </h1>
          <p className="text-xs text-[#52525B] mb-6">
            {mode === "register"
              ? "Set up a new workspace in seconds"
              : "Sign in to your workspace"}
          </p>

          {/* Mode toggle */}
          <div className="mb-6 grid grid-cols-3 gap-1 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E] p-1">
            <button
              onClick={() => { setMode("lead"); setError(""); setSuccess(""); }}
              className={`flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-medium transition-all ${
                mode === "lead"
                  ? "bg-white/[0.08] text-[#EDEDED] shadow-sm"
                  : "text-[#52525B] hover:text-[#A1A1AA]"
              }`}
            >
              <Shield className="w-3 h-3" strokeWidth={1.5} />
              Login
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
              className={`flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-medium transition-all ${
                mode === "register"
                  ? "bg-white/[0.08] text-[#EDEDED] shadow-sm"
                  : "text-[#52525B] hover:text-[#A1A1AA]"
              }`}
            >
              <UserPlus className="w-3 h-3" strokeWidth={1.5} />
              Register
            </button>
            <button
              onClick={() => { setMode("member"); setError(""); setSuccess(""); }}
              className={`flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-medium transition-all ${
                mode === "member"
                  ? "bg-white/[0.08] text-[#EDEDED] shadow-sm"
                  : "text-[#52525B] hover:text-[#A1A1AA]"
              }`}
            >
              <KeyRound className="w-3 h-3" strokeWidth={1.5} />
              Team PIN
            </button>
          </div>

          <form onSubmit={getFormHandler()} className="space-y-4">
            {mode === "lead" ? (
              <>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3F3F46] mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full h-10 px-3.5 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E] text-sm text-[#EDEDED] placeholder:text-[#27272A] focus:border-[#3F3F46] focus:ring-0 focus:outline-none transition-colors"
                    placeholder="you@studio.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3F3F46] mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full h-10 px-3.5 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E] text-sm text-[#EDEDED] placeholder:text-[#27272A] focus:border-[#3F3F46] focus:ring-0 focus:outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </>
            ) : mode === "register" ? (
              <>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3F3F46] mb-2">Studio Name</label>
                  <input
                    type="text"
                    value={studioName}
                    onChange={e => setStudioName(e.target.value)}
                    required
                    className="w-full h-10 px-3.5 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E] text-sm text-[#EDEDED] placeholder:text-[#27272A] focus:border-[#3F3F46] focus:ring-0 focus:outline-none transition-colors"
                    placeholder="Awesome Games Studio"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3F3F46] mb-2">Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    required
                    className="w-full h-10 px-3.5 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E] text-sm text-[#EDEDED] placeholder:text-[#27272A] focus:border-[#3F3F46] focus:ring-0 focus:outline-none transition-colors"
                    placeholder="you@studio.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3F3F46] mb-2">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full h-10 px-3.5 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E] text-sm text-[#EDEDED] placeholder:text-[#27272A] focus:border-[#3F3F46] focus:ring-0 focus:outline-none transition-colors"
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3F3F46] mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full h-10 px-3.5 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E] text-sm text-[#EDEDED] placeholder:text-[#27272A] focus:border-[#3F3F46] focus:ring-0 focus:outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3F3F46] mb-2">Studio PIN</label>
                  <input
                    type="text"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    required
                    maxLength={8}
                    className="w-full h-10 px-3.5 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E] text-sm text-[#EDEDED] placeholder:text-[#27272A] focus:border-[#3F3F46] focus:ring-0 focus:outline-none transition-colors font-mono uppercase tracking-[0.15em] text-center text-lg"
                    placeholder="AB12"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3F3F46] mb-2">
                    Display Name <span className="text-[#27272A] normal-case tracking-normal font-normal">(first login only)</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E] text-sm text-[#EDEDED] placeholder:text-[#27272A] focus:border-[#3F3F46] focus:ring-0 focus:outline-none transition-colors"
                    placeholder="Your name"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-rose-500/5 border border-rose-500/15">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <p className="text-xs text-rose-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-400">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg ${
                mode === "register"
                  ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/10"
                  : "bg-white text-[#09090B] hover:bg-white/90 shadow-white/5"
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
              ) : (
                <>
                  {mode === "register" ? "Create Studio" : "Continue"}
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </>
              )}
            </button>
          </form>

          {/* Quick switch link */}
          {mode !== "register" && (
            <p className="text-center text-xs text-[#3F3F46] mt-5">
              Don&apos;t have a studio?{" "}
              <button
                onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Create one free
              </button>
            </p>
          )}
          {mode === "register" && (
            <p className="text-center text-xs text-[#3F3F46] mt-5">
              Already have an account?{" "}
              <button
                onClick={() => { setMode("lead"); setError(""); setSuccess(""); }}
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <a href="/" className="text-[10px] text-[#27272A] hover:text-[#52525B] transition-colors">Home</a>
          <span className="text-[10px] text-[#1E1E1E]">&middot;</span>
          <span className="text-[10px] text-[#27272A]">&copy; 2026 Kuantum Studio</span>
        </div>
      </div>
    </div>
  );
}
