import { useQuery } from '@tanstack/react-query';
import { driverService } from '../services/api';
import { queryKeys } from '../queryKeys';

export const DRIVERS_QUERY_KEY = queryKeys.drivers;

/**
 * Normalise the API response into a plain array of driver objects.
 * Supports both paginated { results: [] } and flat array [] responses.
 * Throws on non-2xx / malformed payloads so React Query treats them as errors
 * rather than silently returning an empty list.
 *
 * Exported so other callers (e.g. prefetchQuery in AuthContext) can use
 * the exact same normalisation and avoid cache-shape mismatches.
 */
export function normalizeDriversResponse(data) {
  // { results: [...] }  — DRF paginated response
  if (data && typeof data === 'object' && Array.isArray(data.results)) {
    return data.results;
  }
  // Direct array response
  if (Array.isArray(data)) {
    return data;
  }
  // Unexpected shape — treat as error so we don't persist bad data
  throw new Error('Unexpected drivers API response format');
}

/**
 * Do not retry permanent HTTP errors (client errors that won't resolve on retry).
 * Retry transient failures (5xx, network errors) with exponential backoff up to 3 times.
 */
function shouldRetry(failureCount, error) {
  if (failureCount >= 3) return false;
  const status = error?.response?.status;
  // Don't retry client errors that are permanent
  if (status && [400, 401, 403, 404].includes(status)) return false;
  return true;
}

function retryDelay(attemptIndex) {
  // Exponential backoff: 1s, 2s, 4s
  return Math.min(1000 * 2 ** attemptIndex, 8000);
}

export function useDrivers() {
  // Only run the query when a valid access token exists.
  // This prevents a race condition where the query fires before auth
  // is established, receives a 401, triggers the refresh interceptor,
  // potentially fails the refresh, logs the user out, and stores an
  // empty/error result in the cache that overwrites valid driver data.
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('tourbee_access_token')
      : null;

  const query = useQuery({
    queryKey: queryKeys.drivers,
    queryFn: async () => {
      const res = await driverService.getAll();
      return normalizeDriversResponse(res.data);
    },
    // *** FIX: Only fetch when authenticated ***
    enabled: !!token,
    staleTime: 60000,          // Data considered fresh for 60 seconds
    refetchOnMount: true,      // Refetch on mount if stale
    retry: shouldRetry,
    retryDelay: retryDelay,
  });

  return query;
}
