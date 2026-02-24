import { gql } from "graphql-request";

export const CREATE_CHART = gql`
  mutation CreateChart($input: CreateChartInput!) {
    createChart(input: $input) {
      id
      title
      author
      root
      sections
      plan
      tags
      links
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_CHART = gql`
  query GetChart($chartId: ID!, $tenantId: String!) {
    getChart(chartId: $chartId, tenantId: $tenantId) {
      id
      title
      author
      root
      sections
      plan
      tags
      links
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const LIST_CHARTS = gql`
  query ListCharts($tenantId: String!) {
    listCharts(tenantId: $tenantId) {
      id
      title
      author
      root
      tags
      isActive
      createdAt
      updatedAt
    }
  }
`;
