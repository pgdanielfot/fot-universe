import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId");
  const filename = searchParams.get("filename");

  if (!pageId || !filename) {
    return NextResponse.json({ error: "pageId and filename are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("settings")
    .select("confluence_base_url, confluence_email, confluence_api_token")
    .eq("id", "default")
    .single();

  if (!settings?.confluence_base_url || !settings.confluence_email || !settings.confluence_api_token) {
    return NextResponse.json({ error: "Confluence credentials are not set" }, { status: 400 });
  }

  const auth = Buffer.from(`${settings.confluence_email}:${settings.confluence_api_token}`).toString(
    "base64"
  );
  const headers = { Authorization: `Basic ${auth}` };

  const attachmentsRes = await fetch(
    `${settings.confluence_base_url}/wiki/rest/api/content/${pageId}/child/attachment?filename=${encodeURIComponent(filename)}`,
    { headers: { ...headers, Accept: "application/json" } }
  );

  if (!attachmentsRes.ok) {
    return NextResponse.json({ error: "Attachment lookup failed" }, { status: 502 });
  }

  const attachmentsData = await attachmentsRes.json();
  const download = attachmentsData.results?.[0]?._links?.download;

  if (!download) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  const fileRes = await fetch(`${settings.confluence_base_url}/wiki${download}`, { headers });

  if (!fileRes.ok || !fileRes.body) {
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 502 });
  }

  return new NextResponse(fileRes.body, {
    headers: {
      "Content-Type": fileRes.headers.get("content-type") ?? "video/mp4",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
