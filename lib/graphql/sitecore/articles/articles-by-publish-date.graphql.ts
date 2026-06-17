const articlesByPublishedDateQuery = /* GraphQL */ `
  query GetRecentArticles(
    $publishedAfter: String!
    $templateId: String!
    $path: String!
    $after: String
  ) {
    search(
      where: {
        AND: [
          { name: "_templates", value: $templateId, operator: CONTAINS }
          { name: "_language", value: "en" }
          { name: "_path", value: $path, operator: CONTAINS }
          { name: "publicationDate", value: $publishedAfter, operator: GTE }
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
