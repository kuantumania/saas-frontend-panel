"use client";

import { useState } from "react";
import {
  Layers, ArrowRight, Check, Shield, Zap, Box, Upload,
  Users, Eye, GitBranch, Gamepad2, ChevronRight, Star,
} from "lucide-react";

// ═══════════════════════════════════════════════════
// KUANTUM STUDIO — Landing Page
// ═══════════════════════════════════════════════════

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For indie devs & small teams getting started",
    features: ["5 team members", "100 assets", "1 GB storage", "Basic review workflow", "Unity plugin"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For growing studios shipping real games",
    features: ["25 team members", "1,000 assets", "10 GB storage", "Advanced review queues", "SLA tracking", "Asset rules engine", "QA guidance"],
    cta: "Start Pro Trial",
    highlight: true,
  },
  {
    name: "Studio",
    price: "$79",
    period: "/mo",
    description: "For mid-size studios with complex pipelines",
    features: ["Unlimited members", "Unlimited assets", "100 GB storage", "Auto-routing", "Version control", "3D preview & annotations", "Priority support"],
    cta: "Start Studio Trial",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "$499",
    period: "/mo",
    description: "For AAA studios and large organizations",
    features: ["Everything in Studio", "SSO (Google, Microsoft, SAML)", "Audit log export", "Department-based RBAC", "Migration wizard", "Dedicated support", "Custom integrations"],
    cta: "Contact Sales",
    highlight: false,
  },
];

const FEATURES = [
  {
    icon: Upload,
    title: "Zero-Git Upload",
    description: "Artists drag & drop — no Git, no CLI. Files go straight to cloud with version chains.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Eye,
    title: "Visual Review",
    description: "Side-by-side diff, 3D model preview, audio waveforms. Review assets like you review code.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Gamepad2,
    title: "Unity Delivery",
    description: "One-click sync from cloud to Unity project. Delta sync, cursor tracking, zero manual copy.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Shield,
    title: "QA Gate",
    description: "Automated quality checks before assets reach the engine. File size, naming, texture rules.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: GitBranch,
    title: "Version Control",
    description: "Full version history with instant rollback. Compare any two versions with visual diff.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    icon: Users,
    title: "Team Workflows",
    description: "Review queues with SLA tracking, auto-routing, escalation. Keep your pipeline moving.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
];

const LOGOS = [
  "Unity", "Unreal", "Blender", "Maya", "Substance", "Photoshop",
];

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="min-h-screen bg-[#09090B]">

      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#09090B]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
            <span className="text-sm font-semibold tracking-tight text-[#EDEDED]">Kuantum Studio</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-xs text-[#71717A] hover:text-[#EDEDED] transition-colors">Features</a>
            <a href="#pricing" className="text-xs text-[#71717A] hover:text-[#EDEDED] transition-colors">Pricing</a>
            <a href="#workflow" className="text-xs text-[#71717A] hover:text-[#EDEDED] transition-colors">Workflow</a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="text-xs text-[#A1A1AA] hover:text-white transition-colors"
            >
              Sign in
            </a>
            <a
              href="/login"
              className="h-8 px-4 flex items-center rounded-lg bg-white text-[#09090B] text-xs font-medium hover:bg-white/90 transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-purple-600/6 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[11px] text-blue-400 font-medium">Now with Unity Delta Sync v2</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#EDEDED] mb-6 leading-[1.1]">
            Ship game assets
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              without the chaos
            </span>
          </h1>

          <p className="text-base md:text-lg text-[#71717A] max-w-2xl mx-auto mb-10 leading-relaxed">
            The asset pipeline platform for game studios. Upload, review, approve,
            and sync assets to Unity — zero Git required. Built for artists,
            controlled by tech leads.
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-3">
            <a
              href="/login"
              className="group h-11 px-6 flex items-center gap-2 rounded-xl bg-white text-[#09090B] text-sm font-semibold hover:bg-white/90 transition-all shadow-lg shadow-white/5"
            >
              Start Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="#workflow"
              className="h-11 px-6 flex items-center rounded-xl border border-[#27272A] text-sm text-[#A1A1AA] font-medium hover:text-white hover:border-[#3F3F46] transition-all"
            >
              See how it works
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center justify-center gap-6">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#09090B] bg-gradient-to-br from-[#27272A] to-[#18181B] flex items-center justify-center">
                  <span className="text-[8px] text-[#71717A] font-semibold">{["BK", "AY", "MZ", "TR", "JP"][i]}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-xs text-[#52525B]">Trusted by 50+ game studios</span>
          </div>
        </div>

        {/* Hero visual — Dashboard mockup */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] shadow-2xl shadow-black/50 overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#1E1E1E] bg-[#0A0A0A]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#27272A]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27272A]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27272A]" />
              <span className="ml-3 text-[10px] text-[#3F3F46]">app.kuantum.studio/dashboard</span>
            </div>
            {/* Mockup content */}
            <div className="p-6 space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Assets", value: "2,847", change: "+12%", color: "text-emerald-400" },
                  { label: "In Review", value: "43", change: "SLA OK", color: "text-blue-400" },
                  { label: "Approved", value: "2,681", change: "94.2%", color: "text-emerald-400" },
                  { label: "Unity Synced", value: "1,923", change: "Active", color: "text-purple-400" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-[#1E1E1E] bg-[#0A0A0A] p-3">
                    <p className="text-[9px] text-[#52525B] uppercase tracking-wider mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-[#EDEDED]">{stat.value}</span>
                      <span className={`text-[9px] ${stat.color}`}>{stat.change}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Table mockup */}
              <div className="rounded-lg border border-[#1E1E1E] overflow-hidden">
                <div className="grid grid-cols-[1fr_100px_80px_80px_80px] gap-2 px-4 py-2 bg-[#0A0A0A] border-b border-[#1E1E1E]">
                  {["Asset", "Category", "Size", "Status", "Sync"].map(h => (
                    <span key={h} className="text-[9px] text-[#3F3F46] uppercase tracking-wider font-medium">{h}</span>
                  ))}
                </div>
                {[
                  { name: "hero_character_v3.fbx", cat: "3D Model", size: "24.5 MB", status: "Approved", sync: "Synced", sc: "text-emerald-400", yc: "text-purple-400" },
                  { name: "env_forest_diffuse.png", cat: "Texture", size: "8.2 MB", status: "In Review", sync: "Pending", sc: "text-blue-400", yc: "text-amber-400" },
                  { name: "ui_button_click.wav", cat: "Audio", size: "340 KB", status: "Approved", sync: "Synced", sc: "text-emerald-400", yc: "text-purple-400" },
                  { name: "weapon_sword_epic.fbx", cat: "3D Model", size: "18.1 MB", status: "QA Gate", sync: "Blocked", sc: "text-amber-400", yc: "text-rose-400" },
                ].map((row) => (
                  <div key={row.name} className="grid grid-cols-[1fr_100px_80px_80px_80px] gap-2 px-4 py-2.5 border-b border-[#1E1E1E]/50">
                    <span className="text-xs text-[#EDEDED] truncate">{row.name}</span>
                    <span className="text-[10px] text-[#52525B]">{row.cat}</span>
                    <span className="text-[10px] text-[#52525B]">{row.size}</span>
                    <span className={`text-[10px] ${row.sc}`}>{row.status}</span>
                    <span className={`text-[10px] ${row.yc}`}>{row.sync}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Fade at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#09090B] to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ═══ TOOL COMPATIBILITY ═══ */}
      <section className="py-12 px-6 border-y border-[#1E1E1E]/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[10px] text-[#3F3F46] uppercase tracking-[0.2em] mb-6">Works with your stack</p>
          <div className="flex items-center justify-center gap-10 flex-wrap">
            {LOGOS.map((name) => (
              <span key={name} className="text-sm text-[#27272A] font-semibold tracking-wide hover:text-[#3F3F46] transition-colors cursor-default">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] text-blue-400 uppercase tracking-[0.2em] font-medium mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#EDEDED] mb-4">
              Everything your pipeline needs
            </h2>
            <p className="text-sm text-[#52525B] max-w-lg mx-auto">
              From upload to engine delivery, Kuantum handles every step — so your team ships faster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="group rounded-xl border border-[#1E1E1E] bg-[#121212] p-6 hover:border-[#27272A] hover:bg-[#141414] transition-all"
              >
                <div className={`w-9 h-9 rounded-lg ${feat.bg} flex items-center justify-center mb-4`}>
                  <feat.icon className={`w-4.5 h-4.5 ${feat.color}`} strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-[#EDEDED] mb-2">{feat.title}</h3>
                <p className="text-xs text-[#52525B] leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WORKFLOW ═══ */}
      <section id="workflow" className="py-24 px-6 border-t border-[#1E1E1E]/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] text-purple-400 uppercase tracking-[0.2em] font-medium mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#EDEDED] mb-4">
              From artist to engine in minutes
            </h2>
          </div>

          <div className="space-y-0">
            {[
              {
                step: "01",
                title: "Upload",
                description: "Artists drag & drop files into the web panel. No Git knowledge needed. Auto-categorization and metadata extraction happen instantly.",
                color: "text-blue-400",
                border: "border-blue-500/20",
              },
              {
                step: "02",
                title: "Review",
                description: "Tech leads review assets with 3D preview, QA checks, and side-by-side comparison. SLA-tracked queues keep the pipeline moving.",
                color: "text-emerald-400",
                border: "border-emerald-500/20",
              },
              {
                step: "03",
                title: "Approve",
                description: "One-click approve or reject with reasons. Asset rules engine catches problems before they reach the engine. Quality gate enforced.",
                color: "text-amber-400",
                border: "border-amber-500/20",
              },
              {
                step: "04",
                title: "Sync to Unity",
                description: "Approved assets auto-sync to the Unity project via our plugin. Delta sync ensures only changed files transfer. Zero manual copy.",
                color: "text-purple-400",
                border: "border-purple-500/20",
              },
            ].map((item, i) => (
              <div key={item.step} className="flex gap-6 items-start">
                {/* Step line */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full border ${item.border} bg-[#121212] flex items-center justify-center`}>
                    <span className={`text-xs font-bold ${item.color}`}>{item.step}</span>
                  </div>
                  {i < 3 && <div className="w-px h-16 bg-[#1E1E1E]" />}
                </div>
                {/* Content */}
                <div className="pb-12">
                  <h3 className="text-sm font-semibold text-[#EDEDED] mb-1">{item.title}</h3>
                  <p className="text-xs text-[#52525B] leading-relaxed max-w-md">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-24 px-6 border-t border-[#1E1E1E]/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] text-emerald-400 uppercase tracking-[0.2em] font-medium mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#EDEDED] mb-4">
              Plans for every studio size
            </h2>
            <p className="text-sm text-[#52525B] mb-6">Start free, scale as you grow. All plans include the Unity plugin.</p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-2 p-1 rounded-lg border border-[#27272A] bg-[#0A0A0A]">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  billingCycle === "monthly" ? "bg-white/[0.08] text-[#EDEDED]" : "text-[#52525B] hover:text-[#A1A1AA]"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  billingCycle === "annual" ? "bg-white/[0.08] text-[#EDEDED]" : "text-[#52525B] hover:text-[#A1A1AA]"
                }`}
              >
                Annual <span className="text-emerald-400 ml-1">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => {
              const price = plan.price === "$0"
                ? "$0"
                : billingCycle === "annual"
                ? `$${Math.round(parseInt(plan.price.replace("$", "")) * 0.8)}`
                : plan.price;

              return (
                <div
                  key={plan.name}
                  className={`relative rounded-xl border p-6 transition-all ${
                    plan.highlight
                      ? "border-blue-500/30 bg-blue-500/[0.03] ring-1 ring-blue-500/10"
                      : "border-[#1E1E1E] bg-[#121212] hover:border-[#27272A]"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-[9px] font-semibold text-white uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-sm font-semibold text-[#EDEDED] mb-1">{plan.name}</h3>
                  <p className="text-[10px] text-[#52525B] mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-2xl font-bold text-[#EDEDED]">{price}</span>
                    <span className="text-xs text-[#52525B]">{plan.period}</span>
                  </div>
                  <a
                    href="/login"
                    className={`block w-full py-2 rounded-lg text-xs font-medium text-center transition-colors mb-5 ${
                      plan.highlight
                        ? "bg-blue-600 text-white hover:bg-blue-500"
                        : "bg-white/[0.06] text-[#EDEDED] hover:bg-white/[0.1]"
                    }`}
                  >
                    {plan.cta}
                  </a>
                  <ul className="space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" strokeWidth={2} />
                        <span className="text-[11px] text-[#71717A]">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-24 px-6 border-t border-[#1E1E1E]/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#EDEDED] mb-4">
            Ready to fix your asset pipeline?
          </h2>
          <p className="text-sm text-[#52525B] mb-8 max-w-lg mx-auto">
            Join studios who replaced chaotic Google Drive folders and Git LFS nightmares with a system that actually works.
          </p>
          <a
            href="/login"
            className="group inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-[#09090B] text-sm font-semibold hover:bg-white/90 transition-all shadow-lg shadow-white/5"
          >
            Get Started for Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-[#1E1E1E]/50 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#27272A]" strokeWidth={1.5} />
            <span className="text-xs text-[#27272A] font-medium">Kuantum Studio</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-[10px] text-[#3F3F46] hover:text-[#71717A] transition-colors">Features</a>
            <a href="#pricing" className="text-[10px] text-[#3F3F46] hover:text-[#71717A] transition-colors">Pricing</a>
            <a href="#workflow" className="text-[10px] text-[#3F3F46] hover:text-[#71717A] transition-colors">Workflow</a>
            <a href="/login" className="text-[10px] text-[#3F3F46] hover:text-[#71717A] transition-colors">Sign in</a>
          </div>
          <p className="text-[10px] text-[#27272A]">&copy; 2026 Kuantum Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
