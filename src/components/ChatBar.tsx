"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Video = { title: string; src: string; embed: boolean };

type Answer = {
  text: string;
  sources: { url: string; title: string }[];
  videos: Video[];
};

const markdownComponents = {
  p: (props: React.ComponentProps<"p">) => <p className="mb-2 last:mb-0" {...props} />,
  strong: (props: React.ComponentProps<"strong">) => (
    <strong className="font-semibold text-white" {...props} />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0" {...props} />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0" {...props} />
  ),
  li: (props: React.ComponentProps<"li">) => <li className="pl-1" {...props} />,
  h1: (props: React.ComponentProps<"h1">) => (
    <h3 className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-widest text-zinc-300 first:mt-0" {...props} />
  ),
  h2: (props: React.ComponentProps<"h2">) => (
    <h3 className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-widest text-zinc-300 first:mt-0" {...props} />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h3 className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-widest text-zinc-300 first:mt-0" {...props} />
  ),
  code: (props: React.ComponentProps<"code">) => (
    <code className="rounded bg-white/10 px-1 py-0.5 text-[13px] text-zinc-100" {...props} />
  ),
  a: (props: React.ComponentProps<"a">) => (
    <a
      className="text-zinc-100 underline underline-offset-2 hover:text-white"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  hr: () => <hr className="my-3 border-white/10" />,
};

export default function ChatBar() {
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(prompt = input) {
    const text = prompt.trim();
    if (!text || loading) return;

    setQuestion(text);
    setAnswer(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      setAnswer({ text: data.answer, sources: data.sources ?? [], videos: data.videos ?? [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="hero-panel flex items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.16)] sm:rounded-full sm:px-5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="Ask the FOT Universe assistant anything..."
          className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
        />
        <button
          onClick={() => ask()}
          disabled={loading}
          className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-medium text-zinc-900 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Asking..." : "Ask"}
        </button>
      </div>

      {!loading && !answer && !error && (
        <div className="mt-3 flex flex-wrap gap-2">
          {["Where can I find the brief form?", "How do I create a listing?", "Show training videos"].map((prompt) => (
            <button
              key={prompt}
              onClick={() => { setInput(prompt); ask(prompt); }}
              className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-400 transition hover:border-white/25 hover:bg-white/[0.06] hover:text-zinc-100"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {(loading || answer || error) && (
        <div className="glass-panel mt-3 max-h-[28rem] overflow-y-auto rounded-2xl px-5 py-4 text-left">
          <div className="mb-3 flex items-start justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">{question}</p>
            {!loading && <button onClick={() => { setAnswer(null); setError(null); setQuestion(""); }} className="shrink-0 text-xs text-zinc-500 hover:text-zinc-200">Clear</button>}
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:300ms]" />
              <span className="ml-1">Thinking…</span>
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}

          {answer && (
            <>
              <div className="text-sm leading-relaxed text-zinc-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {answer.text}
                </ReactMarkdown>
              </div>

              {answer.videos.length > 0 && (
                <div className="mt-4 flex flex-col gap-3">
                  {answer.videos.map((v, i) => (
                    <div key={i} className="overflow-hidden rounded-xl border border-white/10">
                      {v.embed ? (
                        <iframe
                          src={v.src}
                          title={v.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="aspect-video w-full"
                        />
                      ) : (
                        <video src={v.src} controls className="aspect-video w-full bg-black" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {answer.sources.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3">
                  {answer.sources.map((s) => (
                    <a
                      key={s.url}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-zinc-400 hover:border-white/30 hover:text-zinc-200"
                    >
                      {s.title}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
