"use client";

import { useState } from "react";
import { Layers, ArrowRight, Loader2 } from "lucide-react";

const API = "https://saas-asset-backend.onrender.com";

// Debug: Log when page loads
if (typeof window !== 'undefined') {
  console.log('Login page loaded, API:', API);
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          <p className="text-xs text-[#52525B] mb-6">Enter your studio credentials</p>

          <form onSubmit={handleLogin} className="space-y-4">
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

            {error && (
              <p className="text-xs text-[#F43F5E] bg-rose-500/10 px-3 py-2 rounded-md ring-1 ring-rose-500/20">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-white/[0.08] text-sm font-medium text-[#EDEDED] hover:bg-white/[0.12] disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> : <ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
              {loading ? "Signing in..." : "Continue"}
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
