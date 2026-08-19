import { GoogleGenerativeAI } from "@google/generative-ai";

function client() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(message: string): boolean {
  return (
    message.includes("429") ||
    message.includes("Too Many Requests") ||
    message.includes("503") ||
    message.includes("Service Unavailable") ||
    message.includes("overloaded")
  );
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!isRetryable(message) || attempt === attempts - 1) throw error;

      const retryMatch = message.match(/"retryDelay":"(\d+)s"/);
      const delayMs = retryMatch ? Number(retryMatch[1]) * 1000 + 500 : 1500 * (attempt + 1);
      await sleep(delayMs);
    }
  }
  throw new Error("Unreachable");
}

async function embedOne(text: string): Promise<number[]> {
  const model = client().getGenerativeModel({ model: EMBEDDING_MODEL });

  return withRetry(async () => {
    const result = await model.embedContent({
      content: { role: "user", parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    } as Parameters<typeof model.embedContent>[0]);
    return result.embedding.values;
  }, 5);
}

export async function embedText(text: string): Promise<number[]> {
  return embedOne(text);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embedOne(text));
    await sleep(700); // stay under the free tier's 100 requests/minute cap
  }
  return results;
}

export async function answerWithContext(question: string, context: string): Promise<string> {
  const model = client().getGenerativeModel({ model: "gemini-3.6-flash" });

  const prompt = `You are the FOT Universe assistant. FOT Universe is the team's central portal: a directory of internal tools/links, plus a Confluence knowledge base.

Use ONLY the context below to answer. Two kinds of context are given:
1. "Portal directory" — the internal tools and links available on this portal. If the question is about where to find or do something (e.g. "how do I get X"), and one of these links is the right place, name it AND include its exact URL from the context so it can be clicked.
2. "Confluence knowledge base" — documentation content for detailed how-to answers.

Prefer combining both when relevant: point to the right link, and if Confluence explains the process, summarize the key steps too.
If the context doesn't contain the answer, say you don't have that information yet and suggest checking with the team or Confluence directly.
Keep answers concise and practical.

Context:
${context}

Question: ${question}`;

  const result = await withRetry(() => model.generateContent(prompt), 3);
  return result.response.text();
}
