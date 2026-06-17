const articlesByPublishedDateQuery = /* GraphQL */ `
  query GetRecentArticles(
    $publishedAfter: String! = "2026-01-05T00:00:00.000Z"
    $templateId: String! = "13C90035-4700-4B86-B6CB-1B50F394423A"
    $after: String
  ) {
    search(
      where: {
        AND: [
          { name: "_templates", value: $templateId, operator: CONTAINS }
          { name: "_language", value: "en" }
          {
            name: "_path"
            value: "00030A22-A8A7-4285-A573-090B5A831B54"
            operator: CONTAINS
          }
          { name: "publicationDate", value: $publishedAfter, operator: GTE }
        ]
      }
      orderBy: { name: "publicationDate" }
      first: 50
      after: $after
    ) {
      pageInfo {
        hasNext
        endCursor
      }
      results {
        id
        template {
          name
        }
        name
        ... on IssuePage {
          publicationDate {
            dateValue
            formattedDateValue
          }
          title {
            value
          }
          abstract {
            value
          }
        }
      }
    }
  }
`;

export default articlesByPublishedDateQuery;
