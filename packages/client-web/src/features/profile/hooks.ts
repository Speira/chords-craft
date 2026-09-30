'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@clerk/nextjs';

import {
  getGraphQLClient,
  type GraphQLFailure,
  queries,
  readGraphQLFailure,
} from '#client-web/lib/graphql';

import type {
  ProfileView,
  SaveProfileInput,
  UnavailabilityInput,
  UnavailabilityView,
} from './types';

/** A GraphQL client carrying the current Clerk session token. */
function useAuthorizedRequest() {
  const { getToken } = useAuth();
  return useCallback(
    async <T>(document: string, variables?: Record<string, unknown>): Promise<T> => {
      const token = await getToken();
      return getGraphQLClient(token ?? undefined).request<T>(document, variables);
    },
    [getToken],
  );
}

export function useMyProfile() {
  const request = useAuthorizedRequest();
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<GraphQLFailure | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await request<{ myProfile: ProfileView | null }>(queries.MY_PROFILE);
      setProfile(data.myProfile);
    } catch (err) {
      setError(readGraphQLFailure(err));
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { profile, isLoading, error, reload };
}

export function useSaveMyProfile() {
  const request = useAuthorizedRequest();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<GraphQLFailure | null>(null);

  /** Resolves with the saved profile; rejects after setting `error`. */
  const saveProfile = async (input: SaveProfileInput): Promise<ProfileView> => {
    setIsSaving(true);
    setError(null);
    try {
      const data = await request<{ saveMyProfile: ProfileView }>(queries.SAVE_MY_PROFILE, {
        input,
      });
      return data.saveMyProfile;
    } catch (err) {
      const failure = readGraphQLFailure(err);
      setError(failure);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveProfile, isSaving, error };
}

export function useMyUnavailability(range: { from: string; to: string }) {
  const request = useAuthorizedRequest();
  const [entries, setEntries] = useState<Array<UnavailabilityView>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<GraphQLFailure | null>(null);
  const { from, to } = range;

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await request<{ myUnavailability: Array<UnavailabilityView> }>(
        queries.MY_UNAVAILABILITY,
        { from, to },
      );
      setEntries(data.myUnavailability);
    } catch (err) {
      setError(readGraphQLFailure(err));
    } finally {
      setIsLoading(false);
    }
  }, [request, from, to]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const add = async (input: UnavailabilityInput): Promise<boolean> => {
    setError(null);
    try {
      await request(queries.ADD_UNAVAILABILITY, { input });
      await reload();
      return true;
    } catch (err) {
      setError(readGraphQLFailure(err));
      return false;
    }
  };

  const remove = async (id: string) => {
    setError(null);
    try {
      await request(queries.REMOVE_UNAVAILABILITY, { id });
      await reload();
    } catch (err) {
      setError(readGraphQLFailure(err));
    }
  };

  return { entries, isLoading, error, add, remove };
}
