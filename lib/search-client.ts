/**
 * lib/search-client.ts — confirmed against SDK v13 mapper source
 *
 * Key SDK v13 facts (from mapper inspection):
 *   vectorSearchDimensions  → wire name "dimensions"        ✓
 *   vectorSearchProfileName → wire name "vectorSearchProfile" ✓
 *   retrievable             → wire name "retrievable"       ✓ (not "hidden")
 *   SemanticField           → { name: string }              ✓
 *   SemanticPrioritizedFields → { titleField, contentFields, keywordsFields } ✓
 *   All Semantic types are plain interfaces (not classes)   ✓
 */

import {
  SearchClient,
  SearchIndexClient,
  AzureKeyCredential,
  SearchIndex,
} from "@azure/search-documents";
import type { SearchDocument } from "@/types";

const endpoint = process.env.AZURE_SEARCH_ENDPOINT!;
const apiKey = process.env.AZURE_SEARCH_API_KEY!;
export const INDEX_NAME =
  process.env.AZURE_SEARCH_INDEX_NAME ?? "imf-articles-ml";
const credential = new AzureKeyCredential(apiKey);

export const indexClient = new SearchIndexClient(endpoint, credential);
export const searchClient = new SearchClient<SearchDocument>(
  endpoint,
  INDEX_NAME,
  credential,
);

export const INDEX_SCHEMA: SearchIndex = {
  name: INDEX_NAME,

  fields: [
    {
      name: "id",
      type: "Edm.String",
      key: true,
      retrievable: true,
      filterable: true,
    },
    // articleId: the GUID from the source CMS (e.g. Sitecore item GUID).
    // filterable: true — allows querying by exact GUID (e.g. find all chunks for an article).
    // searchable: false — GUIDs are not meaningful for full-text or semantic search.
    {
      name: "articleId",
      type: "Edm.String",
      filterable: true,
      retrievable: true,
      searchable: false,
    },
    {
      name: "title",
      type: "Edm.String",
      searchable: true,
      retrievable: true,
      analyzerName: "standard.lucene",
    },
    {
      name: "subtitle",
      type: "Edm.String",
      searchable: true,
      retrievable: true,
      analyzerName: "standard.lucene",
    },
    {
      name: "abstract",
      type: "Edm.String",
      searchable: true,
      retrievable: true,
      analyzerName: "standard.lucene",
    },
    {
      name: "description",
      type: "Edm.String",
      searchable: true,
      retrievable: true,
      analyzerName: "standard.lucene",
    },
    {
      name: "pageTitle",
      type: "Edm.String",
      searchable: true,
      retrievable: true,
      analyzerName: "standard.lucene",
    },
    {
      name: "language",
      type: "Edm.String",
      filterable: true,
      facetable: true,
      retrievable: true,
    },
    {
      name: "chunkText",
      type: "Edm.String",
      searchable: false,
      retrievable: false,
    },
    {
      name: "contentVector",
      type: "Collection(Edm.Single)",
      searchable: true,
      retrievable: false,
      vectorSearchDimensions: 1024,
      vectorSearchProfileName: "ml-profile",
    },
  ] as any[],

  vectorSearch: {
    algorithms: [
      {
        name: "ml-hnsw",
        kind: "hnsw",
        parameters: {
          metric: "cosine",
          m: 4,
          efConstruction: 400,
          efSearch: 500,
        },
      },
    ],
    profiles: [{ name: "ml-profile", algorithmConfigurationName: "ml-hnsw" }],
  },

  semanticSearch: {
    defaultConfigurationName: "ml-semantic",
    configurations: [
      {
        name: "ml-semantic",
        prioritizedFields: {
          titleField: { name: "title" },
          contentFields: [{ name: "abstract" }, { name: "description" }],
          keywordsFields: [{ name: "subtitle" }, { name: "pageTitle" }],
        },
      },
    ],
  },
};
