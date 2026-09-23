import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embedText, answerWithContext } from "@/lib/gemini";
import { getDirectory } from "@/lib/directory";

const STOP_WORDS = new Set(["about", "and", "are", "can", "for", "from", "get", "how", "i", "in", "is", "me", "my", "of", "please", "show", "the", "to", "where", "with"]);

function words(value: string) {
  return value.toLowerCase().match(/[a-z0-9]{3,}/g)?.filter((word) => !STOP_WORDS.has(word)) ?? [];
}

function quickDirectoryAnswer(question: string, categories: Awaited<ReturnType<typeof getDirectory>>) {
  const terms = words(question);
  const ranked = categories
    .flatMap((category) => category.links.map((link) => ({ category: category.name, link })))
    .map((entry) => {
      const searchable = `${entry.link.name} ${entry.link.description ?? ""} ${entry.category}`.toLowerCase();
      const score = terms.reduce((total, term) => total + (searchable.includes(term) ? 1 : 0), 0);
      return { ...entry, score };
    })
    .filter((entry) => entry.score >= 2 || (terms.length === 1 && entry.link.name.toLowerCase().includes(terms[0])))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (ranked.length === 0) return null;

  const answer = `Here ${ranked.length === 1 ? "is" : "are"} the most relevant tool${ranked.length === 1 ? "" : "s"} in FOT Universe:\n\n${ranked
    .map(({ category, link }) => `- **[${link.name}](${link.url})** · ${category}${link.description ? ` — ${link.description}` : ""}`)
    .join("\n")}`;

  return { answer, sources: [], videos: [], fast: true };
}

export async function POST(request: Request) {
  const { message } = await request.json();
  const question = String(message ?? "").trim();

  if (!question) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const categories = await getDirectory();
    const quickAnswer = quickDirectoryAnswer(question, categories);
    if (quickAnswer) return NextResponse.json(quickAnswer);

    const supabase = await createClient();
    const embeddingResult = await embedText(question);

    const { data: matches, error } = await supabase.rpc("match_kb_chunks", {
      query_embedding: embeddingResult,
      match_count: 4,
    });

    if (error) throw error;

    const directoryContext = categories
      .flatMap((c) =>
        c.links.map(
          (l) =>
            `- ${l.name} (${c.name}): ${l.url}${l.description ? ` — ${l.description}` : ""}`
        )
      )
      .join("\n");

    const confluenceContext = (matches ?? [])
      .map((m: { page_title: string; content: string }) => `[${m.page_title}]\n${m.content.slice(0, 900)}`)
      .join("\n\n---\n\n");

    if (!directoryContext && !confluenceContext) {
      return NextResponse.json({
        answer:
          "I don't have any content synced yet, so I can't answer that. Ask an admin to add some links or run a Confluence sync first.",
        sources: [],
      });
    }

    const context = `Portal directory (internal tools and links):\n${directoryContext || "(none)"}\n\nConfluence knowledge base:\n${confluenceContext || "(none)"}`;

    const answer = await answerWithContext(question, context);

    const sources = Array.from(
      new Map(
        (matches ?? []).map((m: { page_title: string; page_url: string }) => [
          m.page_url,
          m.page_title,
        ])
      ).entries()
    ).map(([url, title]) => ({ url, title }));

    type MatchVideo =
      | { type: "youtube" | "vimeo"; embedUrl: string }
      | { type: "attachment"; pageId: string; filename: string };

    const seenVideos = new Set<string>();
    const videos = (matches ?? [])
      .flatMap((m: { page_id: string; page_title: string; videos: MatchVideo[] }) =>
        (m.videos ?? []).map((v) => ({ ...v, pageTitle: m.page_title }))
      )
      .filter((v: MatchVideo & { pageTitle: string }) => {
        const key = v.type === "attachment" ? `${v.pageId}:${v.filename}` : v.embedUrl;
        if (seenVideos.has(key)) return false;
        seenVideos.add(key);
        return true;
      })
      .map((v: MatchVideo & { pageTitle: string }) => ({
        title: v.pageTitle,
        src:
          v.type === "attachment"
            ? `/api/confluence-media?pageId=${encodeURIComponent(v.pageId)}&filename=${encodeURIComponent(v.filename)}`
            : v.embedUrl,
        embed: v.type !== "attachment",
      }));

    return NextResponse.json({ answer, sources, videos, fast: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 }
    );
  }
}
