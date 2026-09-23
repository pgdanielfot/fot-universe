"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Video = { title: string; src: string; embed: boolean };
type AssistantMessage = { id: string; role: "assistant"; text: string; sources: { url: string; title: string }[]; videos: Video[]; fast?: boolean };
type UserMessage = { id: string; role: "user"; text: string };
type Message = AssistantMessage | UserMessage;

function FOTSpark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-sky-300"><path d="M12 2.5 14 10l7.5 2-7.5 2-2 7.5-2-7.5-7.5-2 7.5-2 2-7.5Z" fill="currentColor" opacity=".95" /><circle cx="19.5" cy="4.5" r="1.2" fill="currentColor" opacity=".7" /></svg>;
}

const markdownComponents = {
  p: (props: React.ComponentProps<"p">) => <p className="mb-2 last:mb-0" {...props} />,
  strong: (props: React.ComponentProps<"strong">) => <strong className="font-semibold text-white" {...props} />,
  ul: (props: React.ComponentProps<"ul">) => <ul className="my-3 space-y-2" {...props} />,
  li: (props: React.ComponentProps<"li">) => <li className="rounded-lg bg-white/[0.04] px-3 py-2" {...props} />,
  a: (props: React.ComponentProps<"a">) => <a className="font-medium text-sky-200 underline decoration-sky-300/40 underline-offset-4 hover:text-white" target="_blank" rel="noopener noreferrer" {...props} />,
};

const suggestions = ["Where can I find the brief form?", "How do I create a listing?", "Show training videos"];

export default function ChatBar() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(prompt = input) {
    const text = prompt.trim();
    if (!text || loading) return;

    const userMessage: UserMessage = { id: crypto.randomUUID(), role: "user", text };
    const history = messages.slice(-6).map((message) => ({ role: message.role, text: message.text }));
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, history }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to answer right now.");
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: data.answer, sources: data.sources ?? [], videos: data.videos ?? [], fast: data.fast }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to answer right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {messages.length > 0 && (
        <div className="mb-4 max-h-[29rem] space-y-4 overflow-y-auto pr-1">
          {messages.map((message) => message.role === "user" ? (
            <div key={message.id} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-sky-300 px-4 py-3 text-sm leading-6 text-slate-950">{message.text}</div>
          ) : (
            <article key={message.id} className="rounded-2xl rounded-tl-md border border-white/10 bg-slate-950/35 p-4 text-sm leading-6 text-slate-200">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200"><FOTSpark /> {message.fast ? "FOT tool result" : "FOT assistant"}</div>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{message.text}</ReactMarkdown>
              {message.videos.length > 0 && <div className="mt-4 space-y-3">{message.videos.map((video, index) => <div key={index} className="overflow-hidden rounded-xl border border-white/10">{video.embed ? <iframe src={video.src} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="aspect-video w-full" /> : <video src={video.src} controls className="aspect-video w-full bg-black" />}</div>)}</div>}
              {message.sources.length > 0 && <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3">{message.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-400 hover:border-sky-300/30 hover:text-sky-100">{source.title} ↗</a>)}</div>}
            </article>
          ))}
          {loading && <div className="flex items-center gap-2 text-sm text-slate-400"><span className="h-2 w-2 animate-pulse rounded-full bg-sky-300" /><span>FOT Assistant is thinking…</span></div>}
        </div>
      )}

      {error && <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-200"><span>{error}</span><button onClick={() => setError(null)} className="font-medium">Dismiss</button></div>}

      <form onSubmit={(event) => { event.preventDefault(); send(); }} className="search-shell flex items-center gap-3 rounded-2xl px-4 py-3">
        <FOTSpark />
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={messages.length ? "Ask a follow-up question…" : "Ask a question about FOT…"} className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none" />
        <button type="submit" disabled={loading || !input.trim()} className="rounded-xl bg-sky-300 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-40">Send</button>
      </form>

      {!messages.length && !loading && <div className="mt-3 flex flex-wrap gap-2">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => send(suggestion)} className="rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-100">{suggestion}</button>)}</div>}
      {messages.length > 0 && <button onClick={() => { setMessages([]); setError(null); }} className="mt-3 text-xs text-slate-500 hover:text-slate-200">Clear conversation</button>}
    </div>
  );
}
