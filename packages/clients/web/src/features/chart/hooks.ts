"use client";

import { useState } from "react";

import { useAuth } from "@clerk/nextjs";

import { getGraphQLClient, queries } from "~/lib/graphql";

export function useCreateChart() {
  const client = getGraphQLClient();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createChart = async (input: {
    title: string;
    author?: string;
    root: string;
    sections: any;
    plan: Array<string>;
    tags?: Array<string>;
    links?: Array<string>;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const data = await client.request(queries.CREATE_CHART, {
        input: {
          ...input,
          tenantId: userId, // Using Clerk userId as tenantId
        },
      });
      return data.createChart;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { createChart, loading, error };
}

export function useGetChart() {
  const client = getGraphQLClient();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getChart = async (chartId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.request(queries.GET_CHART, {
        chartId,
        tenantId: userId,
      });
      return data.getChart;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { getChart, loading, error };
}

export function useListCharts() {
  const client = getGraphQLClient();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listCharts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.request(queries.LIST_CHARTS, {
        tenantId: userId,
      });
      return data.listCharts;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { listCharts, loading, error };
}
