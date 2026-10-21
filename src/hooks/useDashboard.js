import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fleetService } from '../services/api';
import { queryKeys } from '../queryKeys';

export const DASHBOARD_QUERY_KEY = queryKeys.dashboard();

export function useDashboard(params = {}, { enabled = true } = {}) {
  const hasParams = params && Object.keys(params).length > 0;
  const key = queryKeys.dashboard(params);
  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const res = await fleetService.getFleetDashboard(hasParams ? params : undefined);
      return res.data;
    },
    placeholderData: keepPreviousData,
    enabled,
    // Part D: retry 3 times with backoff to survive Render cold-start (~30s spin-up)
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: 30000,
  });

  return query;
}
