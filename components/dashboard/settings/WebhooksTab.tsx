"use client";

import { Check, Loader2, Send, Webhook, X } from "lucide-react";

type WebhookType = "webhook" | "slack";

type WebhooksTabProps = {
  webhookUrl: string;
  slackUrl: string;
  webhookEvents: Record<string, boolean>;
  webhookLoading: boolean;
  webhookSaving: boolean;
  webhookTesting: WebhookType | null;
  webhookTestResult: { type: string; ok: boolean } | null;
  onWebhookUrlChange: (url: string) => void;
  onSlackUrlChange: (url: string) => void;
  onToggleWebhookEvent: (eventKey: string, enabled: boolean) => void;
  onTestWebhook: (type: WebhookType) => void;
  onSaveWebhooks: () => void;
};

export default function WebhooksTab({
  webhookUrl,
  slackUrl,
  webhookEvents,
  webhookLoading,
  webhookSaving,
  webhookTesting,
  webhookTestResult,
  onWebhookUrlChange,
  onSlackUrlChange,
  onToggleWebhookEvent,
  onTestWebhook,
  onSaveWebhooks,
}: WebhooksTabProps) {
  if (webhookLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 text-[#52525B] animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Webhook className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold text-[#EDEDED]">Webhook Endpoint</h2>
        </div>
        <p className="text-xs text-[#52525B] mb-4">
          Receive HTTP POST notifications when events occur in your workspace.
        </p>

        <div>
          <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#52525B] mb-1.5">
            Webhook URL
          </label>
          <input
            type="url"
            placeholder="https://your-server.com/webhook"
            value={webhookUrl}
            onChange={(e) => onWebhookUrlChange(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] placeholder:text-[#52525B] focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
          />
        </div>

        <div className="mt-5">
          <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#52525B] mb-2">
            Events
          </label>
          <div className="space-y-2">
            {[
              {
                key: "asset.uploaded",
                label: "Asset Uploaded",
                desc: "When a new asset is uploaded",
              },
              {
                key: "asset.approved",
                label: "Asset Approved",
                desc: "When an asset passes review",
              },
              {
                key: "asset.rejected",
                label: "Asset Rejected",
                desc: "When an asset is rejected",
              },
            ].map(({ key, label, desc }) => (
              <label
                key={key}
                className="flex items-start gap-3 p-3 rounded-lg border border-[#27272A] bg-[#0A0A0A] hover:border-[#3F3F46] transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={webhookEvents[key] ?? true}
                  onChange={(e) => onToggleWebhookEvent(key, e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-[#3F3F46] bg-[#121212] text-blue-500 focus:ring-0 focus:ring-offset-0"
                />
                <div>
                  <p className="text-xs font-medium text-[#EDEDED]">{label}</p>
                  <p className="text-[10px] text-[#52525B]">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {webhookUrl && (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => onTestWebhook("webhook")}
              disabled={webhookTesting === "webhook"}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.06] text-xs font-medium text-[#EDEDED] hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
            >
              {webhookTesting === "webhook" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              Send Test
            </button>
            {webhookTestResult?.type === "webhook" && (
              <span
                className={`text-[10px] font-medium flex items-center gap-1 ${
                  webhookTestResult.ok ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {webhookTestResult.ok ? (
                  <>
                    <Check className="w-3 h-3" /> Delivered
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3" /> Failed
                  </>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 rounded bg-[#4A154B] flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">#</span>
          </div>
          <h2 className="text-sm font-semibold text-[#EDEDED]">Slack Integration</h2>
        </div>
        <p className="text-xs text-[#52525B] mb-4">
          Send notifications to a Slack channel using an Incoming Webhook URL.
        </p>

        <div>
          <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#52525B] mb-1.5">
            Slack Webhook URL
          </label>
          <input
            type="url"
            placeholder="https://hooks.slack.com/services/T.../B.../..."
            value={slackUrl}
            onChange={(e) => onSlackUrlChange(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] placeholder:text-[#52525B] focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
          />
        </div>

        {slackUrl && (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => onTestWebhook("slack")}
              disabled={webhookTesting === "slack"}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.06] text-xs font-medium text-[#EDEDED] hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
            >
              {webhookTesting === "slack" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              Send Test Message
            </button>
            {webhookTestResult?.type === "slack" && (
              <span
                className={`text-[10px] font-medium flex items-center gap-1 ${
                  webhookTestResult.ok ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {webhookTestResult.ok ? (
                  <>
                    <Check className="w-3 h-3" /> Sent
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3" /> Failed
                  </>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onSaveWebhooks}
        disabled={webhookSaving}
        className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors"
      >
        {webhookSaving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Check className="w-3.5 h-3.5" />
        )}
        Save Configuration
      </button>
    </>
  );
}
