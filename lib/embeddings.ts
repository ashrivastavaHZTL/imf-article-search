import { AzureOpenAI } from "openai";

const client = new AzureOpenAI({
  endpoint:   process.env.AZURE_OPENAI_ENDPOINT!,
  apiKey:     process.env.AZURE_OPENAI_API_KEY!,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? "2024-02-01",
  deployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT ?? "text-embedding-3-large",
});

const DEPLOYMENT = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT ?? "text-embedding-3-large";
const DIMENSIONS = 3072;
const BATCH_SIZE = 100;

export async function embedBatch(texts: string[]): Promise<number[][]> {
  // Guard: catch undefined/empty values before they reach the API
  texts.forEach((t, i) => {
    if (t == null || t.trim() === "") {
      throw new Error(
        `embedBatch: texts[${i}] is ${JSON.stringify(t)}. ` +
        `Every document must have a non-empty chunkText.`
      );
    }
  });

  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const slice = texts
      .slice(i, i + BATCH_SIZE)
      .map(t => t.replace(/\s+/g, " ").trim());

    let attempt = 0;
    while (attempt < 3) {
      try {
        const res = await client.embeddings.create({
          model:      DEPLOYMENT,
          input:      slice,
          dimensions: DIMENSIONS,
        });
        results.push(
          ...res.data.sort((a, b) => a.index - b.index).map(d => d.embedding)
        );
        break;
      } catch (err) {
        attempt++;
        if (attempt >= 3) throw err;
        await new Promise(r => setTimeout(r, 1000 * 2 ** (attempt - 1)));
      }
    }
  }

  return results;
}

export async function embedOne(text: string): Promise<number[]> {
  const [v] = await embedBatch([text]);
  return v;
}
