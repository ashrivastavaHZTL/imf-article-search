import axios from "axios";
import articlesByPublishedDateQuery from "@/lib/graphql/sitecore/articles/articles-by-publish-date.graphql";
import { ErrorResponse } from "../../models/api/response/error-response.model";
import { EdgeResponse } from "@/lib/models/api/response/graphql/base.model";
import { SearchResponse } from "@/lib/models/api/response/graphql/search.model";
import { ArticleResult } from "@/lib/models/api/response/graphql/articles/article.model";
import { getpublishedAfterDate } from "@/lib/utils/date/published-after";
import { isEmptyString } from "@/lib/utils/string/string";

// Maps to the GraphQL variables in GetRecentArticles
export interface ArticlesVariables {
  publishedAfter: string;
  publishedBefore?: string; // omit for open-ended upper bound
  path: string;
  after?: string; // pagination cursor
}

export type ArticlesResponse = NonNullable<
  EdgeResponse<SearchResponse<ArticleResult>>
>;

// const GQL_URL = process.env.DOWNSTREAM_API_URL;
const GQL_URL = process.env.EDGE_URL;
const GQL_EP = process.env.EDGE_GRAPHQL_END_POINT;
const GQL_API_TOKEN = process.env.EDGE_API_TOKEN;
const ARTICLE_BUCKET_ID = process.env.ARTICLE_BUCKET_ID;

export interface FetchArticlesOptions {
  publishedAfter?: string; // override the default lookback date
  publishedBefore?: string; // upper bound — omit for no upper limit
  path?: string; // override ARTICLE_BUCKET_ID env var
  after?: string; // pagination cursor from previous page's endCursor
}

export async function fetchArticles(
  options: FetchArticlesOptions = {},
): Promise<ArticlesResponse> {
  if (isEmptyString(GQL_URL) || isEmptyString(GQL_EP))
    throw new Error("EDGE_URL is not configured");
  if (isEmptyString(GQL_API_TOKEN))
    throw new Error("EDGE_API_TOKEN is not configured");
  if (isEmptyString(ARTICLE_BUCKET_ID) && isEmptyString(options.path))
    throw new Error("ARTICLE_BUCKET_ID is not configured");

  const variables: ArticlesVariables = {
    publishedAfter: options.publishedAfter ?? getpublishedAfterDate(),
    publishedBefore: options.publishedBefore,
    path: !isEmptyString(options.path) ? options.path : ARTICLE_BUCKET_ID!,
    after: options.after,
  };

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

  //TODO we should handle this in a more elegant way. This was put in place by claude.
  if (body.errors?.length) {
    throw new Error(body.errors[0].message);
  }
  if (!body.data) {
    throw new Error("Downstream API returned no data");
  }

  return body;
}
