import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embedText, answerWithContext } from "@/lib/gemini";

export async function POST(request: Request) {
  const { message } = await request.json();
  const question = String(message ?? "").trim();

  if (!question) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    const [{ data: categories }, embeddingResult] = await Promise.all([
      supabase.from("categories").select("name, links(name, url, description)"),
      embedText(question),
    ]);

    const { data: matches, error } = await supabase.rpc("match_kb_chunks", {
      query_embedding: embeddingResult,
      match_count: 6,
    });

    if (error) throw error;

    const directoryContext = (categories ?? [])
      .flatMap((c) =>
        c.links.map(
          (l: { name: string; url: string; description: string | null }) =>
            `- ${l.name} (${c.name}): ${l.url}${l.description ? ` — ${l.description}` : ""}`
        )
      )
      .join("\n");

    const confluenceContext = (matches ?? [])
      .map((m: { page_title: string; content: string }) => `[${m.page_title}]\n${m.content}`)
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

    return NextResponse.json({ answer, sources, videos });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 }
    );
  }
}
