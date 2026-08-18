import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchConfluencePages, chunkText } from "@/lib/confluence";
import { embedTexts } from "@/lib/gemini";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    const { data: settings } = await admin
      .from("settings")
      .select("confluence_base_url, confluence_email, confluence_api_token, confluence_space_key")
      .eq("id", "default")
      .single();

    if (
      !settings?.confluence_base_url ||
      !settings.confluence_email ||
      !settings.confluence_api_token ||
      !settings.confluence_space_key
    ) {
      return NextResponse.json(
        { error: "Confluence credentials are not set. Fill them in above first." },
        { status: 400 }
      );
    }

    const pages = await fetchConfluencePages({
      baseUrl: settings.confluence_base_url,
      email: settings.confluence_email,
      apiToken: settings.confluence_api_token,
      spaceKey: settings.confluence_space_key,
    });
    let totalChunks = 0;

    for (const page of pages) {
      let chunks = chunkText(page.text);

      // Keep pages that are mostly/only a video from being dropped entirely
      if (chunks.length === 0 && page.videos.length > 0) {
        chunks = [page.title];
      }
      if (chunks.length === 0) continue;

      const embeddings = await embedTexts(chunks);

      await admin.from("kb_chunks").delete().eq("page_id", page.id);

      await admin.from("kb_chunks").insert(
        chunks.map((content, i) => ({
          page_id: page.id,
          page_title: page.title,
          page_url: page.url,
          chunk_index: i,
          content,
          embedding: embeddings[i],
          videos: page.videos,
        }))
      );

      totalChunks += chunks.length;
    }

    return NextResponse.json({ pages: pages.length, chunks: totalChunks });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
