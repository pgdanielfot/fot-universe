"use client";

import { useState } from "react";
import { saveConfluenceSettings } from "./actions";

type Settings = {
  confluence_base_url: string | null;
  confluence_email: string | null;
  confluence_space_key: string | null;
  has_token: boolean;
};

export default function ConfluenceSync({ settings }: { settings: Settings }) {
  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function sync() {
    setStatus("syncing");
    setMessage("");
    try {
      const res = await fetch("/api/confluence-sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setStatus("done");
      setMessage(`Synced ${data.pages} pages (${data.chunks} chunks) into the knowledge base.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Sync failed");
    }
  }

  return (
    <section className="glass-panel mb-10 rounded-2xl p-6">
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">
        Confluence knowledge base
      </h2>
      <p className="mb-4 text-xs text-zinc-500">
        Pulls pages from the configured Confluence space, embeds them, and powers the chatbot on
        the public site.
      </p>

      <form action={saveConfluenceSettings} className="mb-4 flex flex-col gap-2">
        <input
          name="confluence_base_url"
          defaultValue={settings.confluence_base_url ?? ""}
          placeholder="https://your-domain.atlassian.net"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
        />
        <input
          name="confluence_email"
          type="email"
          defaultValue={settings.confluence_email ?? ""}
          placeholder="you@yourcompany.com"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
        />
        <input
          name="confluence_api_token"
          type="password"
          placeholder={settings.has_token ? "API token saved — enter a new one to replace it" : "API token"}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
        />
        <input
          name="confluence_space_key"
          defaultValue={settings.confluence_space_key ?? ""}
          placeholder="Space key, e.g. FOT"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
        />
        <button className="self-start rounded-lg bg-white/10 px-4 py-2 text-xs font-medium text-zinc-100 hover:bg-white/20">
          Save credentials
        </button>
      </form>

      <div className="flex items-center gap-3">
        <button
          onClick={sync}
          disabled={status === "syncing"}
          className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:opacity-90 disabled:opacity-50"
        >
          {status === "syncing" ? "Syncing..." : "Sync now"}
        </button>
        {message && (
          <p className={`text-xs ${status === "error" ? "text-red-400" : "text-zinc-500"}`}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
