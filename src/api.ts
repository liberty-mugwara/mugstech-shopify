import { gql as GQL, GraphQLClient } from "graphql-request";

export const graphqlClient = new GraphQLClient(
  `https://${process.env.SHOPIFY_PASSWORD}:${process.env.SHOPIFY_USERNAME}/admin/api/${process.env.SHOPIFY_API_VERSION}/graphql.json`,
  {
    headers: {
      "Content-Type": "application/json",
    },
  }
);

export const gql = GQL;
