import axios from "axios";
import articlesByPublishedDateQuery from "@/lib/graphql/sitecore/articles/articles-by-publish-date.graphql";
import { ErrorResponse } from "../../models/api/response/error-response.model";
import { EdgeResponse } from "@/lib/models/api/response/graphql/base.model";
import { SearchResponse } from "@/lib/models/api/response/graphql/search.model";
import { ArticleResult } from "@/lib/models/api/response/graphql/articles/article.model";

// Maps to the three GraphQL variables in GetRecentArticles
export interface ArticlesVariables {
  publishedAfter?: string;
  templateId?: string;
  after?: string; // pagination cursor
}

export type ArticlesResponse =
  | NonNullable<EdgeResponse<SearchResponse<ArticleResult>>>
  | ErrorResponse;

// const GQL_URL = process.env.DOWNSTREAM_API_URL;
const GQL_URL = process.env.EDGE_URL ?? "";
const GQL_EP = process.env.EDGE_GRAPHQL_END_POINT ?? "";

export async function fetchArticles(): Promise<ArticlesResponse> {
  if (!GQL_URL) throw new Error("EDGE URL is not configured");
  // add funciton to build publish after

  const variables: ArticlesVariables = { publishedAfter: "", templateId: "" };
  // after is from the response in the EndCursor prop
  //const variables: ArticlesVariables = {publishedAfter: '', templateId: "", after}
  console.log(GQL_URL);
  console.log(articlesByPublishedDateQuery);

  const { data: body } = await axios.post<
    EdgeResponse<SearchResponse<ArticleResult>>
  >(
    GQL_URL + GQL_EP,
    //{ query: articlesByPublishedDateQuery, variables },
    { query: articlesByPublishedDateQuery },
    {
      headers: {
        "Content-Type": "application/json",
        "X-GQL-Token": process.env.EDGE_API_TOKEN ?? "",
      },
    },
  );

  if (body.errors?.length) {
    throw new Error(body.errors[0].message);
  }
  if (!body.data) {
    throw new Error("Downstream API returned no data");
  }

  return body;
}
