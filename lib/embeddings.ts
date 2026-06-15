/**
 * lib/embeddings.ts
 *
 * Uses the official openai package with AzureOpenAI class.
 * This targets the classic Azure OpenAI endpoint:
 *   /openai/deployments/{deployment}/embeddings?api-version=2024-02-01
 *
 * The @ai-sdk/azure provider currently routes to the new Foundry unified
 * endpoint (/openai/v1/) which does not yet support embedding models,
 * causing "unavailable_model" errors.
 *
 * Environment variables:
 *   AZURE_OPENAI_ENDPOINT    — full URL e.g. https://my-resource.openai.azure.com
 *   AZURE_OPENAI_API_KEY     — KEY 1 from Azure portal
 *   AZURE_OPENAI_API_VERSION — e.g. 2024-02-01 (optional, defaults below)
 *   AZURE_OPENAI_EMBEDDING_DEPLOYMENT — deployment name e.g. text-embedding-3-small
 */

import { AzureOpenAI } from "openai";

const client = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? "2024-02-01",
  deployment:
    process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT ?? "text-embedding-3-small",
});

const DEPLOYMENT =
  process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT ?? "text-embedding-3-small";
const DIMENSIONS = 1024;
const BATCH_SIZE = 100;

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const slice = texts
      .slice(i, i + BATCH_SIZE)
      .map((t) => t.replace(/\s+/g, " ").trim());
    let attempt = 0;

    while (attempt < 3) {
      try {
        const res = await client.embeddings.create({
          model: DEPLOYMENT,
          input: slice,
          dimensions: DIMENSIONS,
        });
        results.push(
          ...res.data.sort((a, b) => a.index - b.index).map((d) => d.embedding),
        );
        break;
      } catch (err) {
        attempt++;
        if (attempt >= 3) throw err;
        await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
      }
    }
  }

  return results;
}

export async function embedOne(text: string): Promise<number[]> {
  const [v] = await embedBatch([text]);
  return v;
}
