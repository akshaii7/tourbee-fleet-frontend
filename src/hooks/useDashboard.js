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
    // Part D: retry twice with increasing delay to survive Render cold-start (~15s spin-up)
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });

  return query;
}
