type ConfluencePage = {
  id: string;
  title: string;
  body: { storage: { value: string } };
  _links: { webui: string };
};

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export type PageVideo =
  | { type: "youtube"; embedUrl: string }
  | { type: "vimeo"; embedUrl: string }
  | { type: "attachment"; pageId: string; filename: string };

export function extractVideos(html: string, pageId: string): PageVideo[] {
  const videos: PageVideo[] = [];
  const seen = new Set<string>();

  const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/gi;
  for (const match of html.matchAll(youtubeRegex)) {
    const id = match[1];
    if (seen.has(`yt:${id}`)) continue;
    seen.add(`yt:${id}`);
    videos.push({ type: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` });
  }

  const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/gi;
  for (const match of html.matchAll(vimeoRegex)) {
    const id = match[1];
    if (seen.has(`vm:${id}`)) continue;
    seen.add(`vm:${id}`);
    videos.push({ type: "vimeo", embedUrl: `https://player.vimeo.com/video/${id}` });
  }

  // Native Confluence video attachments embedded via the multimedia/view-file macro
  const attachmentRegex =
    /<ac:structured-macro ac:name="(?:multimedia|view-file)"[\s\S]*?<ri:attachment ri:filename="([^"]+\.(?:mp4|mov|webm|m4v))"/gi;
  for (const match of html.matchAll(attachmentRegex)) {
    const filename = match[1];
    if (seen.has(`att:${filename}`)) continue;
    seen.add(`att:${filename}`);
    videos.push({ type: "attachment", pageId, filename });
  }

  return videos;
}

export function chunkText(text: string, maxLength = 1200): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  let current: string[] = [];

  for (const word of words) {
    current.push(word);
    if (current.join(" ").length >= maxLength) {
      chunks.push(current.join(" "));
      current = [];
    }
  }
  if (current.length) chunks.push(current.join(" "));

  return chunks.filter((c) => c.length > 20);
}

export type ConfluenceCredentials = {
  baseUrl: string;
  email: string;
  apiToken: string;
  spaceKey: string;
};

export async function fetchConfluencePages(
  credentials: ConfluenceCredentials
): Promise<{ id: string; title: string; url: string; text: string; videos: PageVideo[] }[]> {
  const { baseUrl, email, apiToken, spaceKey } = credentials;

  const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const pages: { id: string; title: string; url: string; text: string; videos: PageVideo[] }[] =
    [];

  let start = 0;
  const limit = 25;

  while (true) {
    const res = await fetch(
      `${baseUrl}/wiki/rest/api/content?spaceKey=${encodeURIComponent(spaceKey)}&expand=body.storage&limit=${limit}&start=${start}`,
      { headers: { Authorization: `Basic ${auth}`, Accept: "application/json" } }
    );

    if (!res.ok) {
      throw new Error(`Confluence API error: ${res.status} ${await res.text()}`);
    }

    const data: { results: ConfluencePage[]; size: number } = await res.json();

    for (const page of data.results) {
      const rawHtml = page.body.storage.value;
      pages.push({
        id: page.id,
        title: page.title,
        url: `${baseUrl}/wiki${page._links.webui}`,
        text: stripHtml(rawHtml),
        videos: extractVideos(rawHtml, page.id),
      });
    }

    if (data.results.length < limit) break;
    start += limit;
  }

  return pages;
}
