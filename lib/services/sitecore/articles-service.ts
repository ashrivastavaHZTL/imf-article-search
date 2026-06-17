import axios from "axios";
import articlesByPublishedDateQuery from "@/lib/graphql/sitecore/articles/articles-by-publish-date.graphql";
import { ErrorResponse } from "../../models/api/response/error-response.model";
import { EdgeResponse } from "@/lib/models/api/response/graphql/base.model";
import { SearchResponse } from "@/lib/models/api/response/graphql/search.model";
import { ArticleResult } from "@/lib/models/api/response/graphql/articles/article.model";
import { getpublishedAfterDate } from "@/lib/utils/date/published-after";
import { isEmptyString } from "@/lib/utils/string/string";

// Maps to the three GraphQL variables in GetRecentArticles
export interface ArticlesVariables {
  publishedAfter: string;
  templateId: string;
  path: string;
  after?: string; // pagination cursor
}

export type ArticlesResponse =
  | NonNullable<EdgeResponse<SearchResponse<ArticleResult>>>
  | ErrorResponse;

// const GQL_URL = process.env.DOWNSTREAM_API_URL;
const GQL_URL = process.env.EDGE_URL;
const GQL_EP = process.env.EDGE_GRAPHQL_END_POINT;
const GQL_API_TOKEN = process.env.EDGE_API_TOKEN;

export async function fetchArticles(): Promise<ArticlesResponse> {
  if (isEmptyString(GQL_URL) || isEmptyString(GQL_EP))
    throw new Error("EDGE URL is not configured");
  if (isEmptyString(GQL_API_TOKEN))
    throw new Error("EDGE API TOKEN is not configured");

  const variables: ArticlesVariables = {
    publishedAfter: getpublishedAfterDate(),
    //Issues Template ID
    templateId: "13C90035-4700-4B86-B6CB-1B50F394423A",
    // Right now I have included path as hard coded to only the /sitecore/content/IMF/IMF/Home/Publications/CR node
    path: "00030A22-A8A7-4285-A573-090B5A831B54",
  };
  // after is from the response in the EndCursor prop
  //const variables: ArticlesVariables = {publishedAfter: '', templateId: "", after}

  const { data: body } = await axios.post<
    EdgeResponse<SearchResponse<ArticleResult>>
  >(
    GQL_URL + GQL_EP,
    { query: articlesByPublishedDateQuery, variables },
    {
      headers: {
        "Content-Type": "application/json",
        "X-GQL-Token": GQL_API_TOKEN,
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
