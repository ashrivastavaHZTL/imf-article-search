const articlesByPublishedDateQuery = /* GraphQL */ `
  query GetRecentArticles(
    $publishedAfter: String!
    $publishedBefore: String
    $path: String!
    $after: String
  ) {
    search(
      where: {
        AND: [
          { name: "_path", value: $path, operator: CONTAINS }
          { name: "publicationDate", value: $publishedAfter, operator: GTE }
          { name: "publicationDate", value: $publishedBefore, operator: LTE }
        ]
      }
      orderBy: { name: "publicationDate" }
      first: 100
      after: $after
    ) {
      total
      pageInfo {
        hasNext
        endCursor
      }
      results {
        id
        name
        language {
          name
        }
        url {
          url
        }
        template {
          id
        }
        ... on _Abstract {
          abstract {
            value
          }
        }
        ... on _PublicationBase {
          publicationTitle {
            value
          }
          publicationShortDescription {
            value
          }
        }
        ... on _PublicationDate {
          publicationDate {
            dateValue
            formattedDateValue
          }
        }
        ... on _Subtitle {
          subtitle_348d48e267c343cf940d63c46c3ccf87 {
            value
          }
        }
        ... on _TitleAndBody {
          title {
            value
          }
          content {
            value
          }
        }
      }
    }
  }
`;

export default articlesByPublishedDateQuery;
