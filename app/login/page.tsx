"use client";

import { useState } from "react";
import { Layers, ArrowRight, Loader2 } from "lucide-react";

const API = "https://saas-asset-backend.onrender.com";

// Debug: Log when page loads
if (typeof window !== 'undefined') {
  console.log('Login page loaded, API:', API);
}

export default function LoginPage() {
  const [mode, setMode] = useState<"lead" | "member">("lead");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
    } catch (err) {
      console.error('Login error:', err);
      setError("Server unavailable");
    }
    setLoading(false);
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
    } catch (err) {
      console.error("PIN login error:", err);
      setError("Server unavailable");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-sm px-6">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <Layers className="w-6 h-6 text-[#3B82F6]" strokeWidth={1.5} />
          <span className="text-base font-semibold tracking-tight text-[#EDEDED]">Kuantum Studio</span>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-6">
          <h1 className="text-sm font-semibold text-[#EDEDED] mb-1">Sign in</h1>
          <p className="text-xs text-[#52525B] mb-4">Lead: email/password · Team member: PIN</p>

          <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-lg bg-[#0A0A0A] border border-[#27272A] p-1">
            <button
              onClick={() => setMode("lead")}
              className={`h-8 rounded-md text-xs font-medium transition-colors ${
                mode === "lead" ? "bg-[#3B82F6]/15 text-[#60A5FA]" : "text-[#71717A] hover:text-[#A1A1AA]"
              }`}
            >
              Lead Login
            </button>
            <button
              onClick={() => setMode("member")}
              className={`h-8 rounded-md text-xs font-medium transition-colors ${
                mode === "member" ? "bg-[#3B82F6]/15 text-[#60A5FA]" : "text-[#71717A] hover:text-[#A1A1AA]"
              }`}
            >
              Team Member (PIN)
            </button>
          </div>

          <form onSubmit={mode === "lead" ? handleLogin : handleMemberLogin} className="space-y-4">
            {mode === "lead" ? (
              <>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#52525B] mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-sm text-[#EDEDED] placeholder:text-[#3F3F46] focus:border-[#3F3F46] focus:ring-0 focus:outline-none transition-colors"
                    placeholder="you@studio.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#52525B] mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-sm text-[#EDEDED] placeholder:text-[#3F3F46] focus:border-[#3F3F46] focus:ring-0 focus:outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#52525B] mb-1.5">Studio PIN</label>
                  <input
                    type="text"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    required
                    maxLength={8}
                    className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-sm text-[#EDEDED] placeholder:text-[#3F3F46] focus:border-[#3F3F46] focus:ring-0 focus:outline-none transition-colors font-mono uppercase tracking-[0.1em]"
                    placeholder="AB12"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#52525B] mb-1.5">Name (first claim only)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-sm text-[#EDEDED] placeholder:text-[#3F3F46] focus:border-[#3F3F46] focus:ring-0 focus:outline-none transition-colors"
                    placeholder="Batuhan"
                  />
                </div>
              </>
            )}

            {error && (
              <p className="text-xs text-[#F43F5E] bg-rose-500/10 px-3 py-2 rounded-md ring-1 ring-rose-500/20">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-white/[0.08] text-sm font-medium text-[#EDEDED] hover:bg-white/[0.12] disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> : <ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
              {loading ? "Signing in..." : mode === "lead" ? "Continue" : "Login with PIN"}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-[#3F3F46] mt-6">
          Kuantum Studio Asset Pipeline
        </p>
      </div>
    </div>
  );
}
