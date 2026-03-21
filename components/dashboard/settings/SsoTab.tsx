"use client";

import { Check, Globe, Key, Loader2, Shield } from "lucide-react";

type SsoTabProps = {
  ssoConfig: any;
  ssoLoading: boolean;
  ssoProvider: string;
  ssoIdpUrl: string;
  ssoSaving: boolean;
  onSsoProviderChange: (provider: string) => void;
  onSsoIdpUrlChange: (url: string) => void;
  onSaveSso: () => void;
};

export default function SsoTab({
  ssoConfig,
  ssoLoading,
  ssoProvider,
  ssoIdpUrl,
  ssoSaving,
  onSsoProviderChange,
  onSsoIdpUrlChange,
  onSaveSso,
}: SsoTabProps) {
  return (
    <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
        <h2 className="text-sm font-semibold text-[#EDEDED]">
          Single Sign-On Configuration
        </h2>
      </div>
      <p className="text-xs text-[#52525B] mb-6">
        Allow your team to log in via your identity provider. Supports Google
        Workspace, Microsoft Entra, and SAML 2.0.
      </p>

      {ssoLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 text-[#52525B] animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#52525B] mb-2">
              Provider
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "google", label: "Google Workspace", icon: Globe },
                { key: "microsoft", label: "Microsoft Entra", icon: Key },
                { key: "saml", label: "SAML 2.0", icon: Shield },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => onSsoProviderChange(key)}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border transition-colors ${
                    ssoProvider === key
                      ? "border-blue-500/50 bg-blue-500/5 text-[#EDEDED]"
                      : "border-[#27272A] bg-[#0A0A0A] text-[#71717A] hover:border-[#3F3F46]"
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {ssoProvider && (
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#52525B] mb-2">
                {ssoProvider === "saml"
                  ? "SAML Metadata URL"
                  : "Identity Provider URL"}
              </label>
              <input
                type="text"
                placeholder={
                  ssoProvider === "google"
                    ? "accounts.google.com"
                    : ssoProvider === "microsoft"
                      ? "login.microsoftonline.com/tenant-id"
                      : "https://idp.example.com/saml/metadata"
                }
                value={ssoIdpUrl}
                onChange={(e) => onSsoIdpUrlChange(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] placeholder:text-[#52525B] focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onSaveSso}
              disabled={ssoSaving || !ssoProvider}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {ssoSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Save Configuration
            </button>
            {ssoConfig?.sso_enabled && (
              <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> SSO is active
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
