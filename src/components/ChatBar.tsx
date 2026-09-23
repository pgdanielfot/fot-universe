"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Video = { title: string; src: string; embed: boolean };
type Answer = { text: string; sources: { url: string; title: string }[]; videos: Video[]; fast?: boolean };

function FOTSpark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-sky-300">
      <path d="M12 2.5 14 10l7.5 2-7.5 2-2 7.5-2-7.5-7.5-2 7.5-2 2-7.5Z" fill="currentColor" opacity=".95" />
      <circle cx="19.5" cy="4.5" r="1.2" fill="currentColor" opacity=".7" />
    </svg>
  );
}

const markdownComponents = {
  p: (props: React.ComponentProps<"p">) => <p className="mb-2 last:mb-0" {...props} />,
  strong: (props: React.ComponentProps<"strong">) => <strong className="font-semibold text-white" {...props} />,
  ul: (props: React.ComponentProps<"ul">) => <ul className="my-3 space-y-2" {...props} />,
  li: (props: React.ComponentProps<"li">) => <li className="rounded-lg bg-white/[0.035] px-3 py-2" {...props} />,
  a: (props: React.ComponentProps<"a">) => <a className="font-medium text-sky-200 underline decoration-sky-300/40 underline-offset-4 hover:text-white" target="_blank" rel="noopener noreferrer" {...props} />,
};

const suggestions = ["Where can I find the brief form?", "How do I create a listing?", "Show training videos"];

export default function ChatBar() {
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(query = input) {
    const text = query.trim();
    if (!text || loading) return;

    setQuestion(text);
    setInput("");
    setAnswer(null);
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to search right now.");
      setAnswer({ text: data.answer, sources: data.sources ?? [], videos: data.videos ?? [], fast: data.fast });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to search right now.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setAnswer(null);
    setError(null);
    setQuestion("");
    setInput("");
  }

  return (
    <div className="w-full">
      <form onSubmit={(event) => { event.preventDefault(); search(); }} className="search-shell flex items-center gap-3 rounded-2xl px-4 py-3">
        <FOTSpark />
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question about FOT…" className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none" />
        <button type="submit" disabled={loading || !input.trim()} className="rounded-xl bg-sky-300 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-40">
          {loading ? "Searching" : "Search"}
        </button>
      </form>

      {!answer && !loading && !error && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => <button key={suggestion} onClick={() => search(suggestion)} className="rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-100">{suggestion}</button>)}
        </div>
      )}

      {(loading || answer || error) && (
        <section className="glass-panel mt-4 rounded-2xl p-4 text-left sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-4 border-b border-white/10 pb-3">
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{loading ? "Searching FOT knowledge" : answer?.fast ? "Quick result" : "FOT answer"}</p><p className="mt-1 text-sm font-medium text-slate-100">{question}</p></div>
            {!loading && <button onClick={reset} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-400 hover:border-white/20 hover:text-white">New search</button>}
          </div>

          {loading && <div className="flex items-center gap-2 py-2 text-sm text-slate-400"><span className="h-2 w-2 animate-pulse rounded-full bg-sky-300" /><span>Looking through FOT tools and knowledge…</span></div>}
          {error && <p className="text-sm text-rose-300">{error}</p>}

          {answer && <>
            <div className="text-sm leading-6 text-slate-200"><ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{answer.text}</ReactMarkdown></div>
            {answer.videos.length > 0 && <div className="mt-5 space-y-3">{answer.videos.map((video, index) => <div key={index} className="overflow-hidden rounded-xl border border-white/10">{video.embed ? <iframe src={video.src} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="aspect-video w-full" /> : <video src={video.src} controls className="aspect-video w-full bg-black" />}</div>)}</div>}
            {answer.sources.length > 0 && <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">{answer.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-400 hover:border-sky-300/30 hover:text-sky-100">{source.title} ↗</a>)}</div>}
          </>}
        </section>
      )}
    </div>
  );
}
