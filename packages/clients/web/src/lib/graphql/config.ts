import { GraphQLClient } from "graphql-request";

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL;

export function getGraphQLClient(token?: string) {
  if (!GRAPHQL_ENDPOINT) throw new Error("No graphql endpoint defined");
  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
}
