import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fleetService } from '../services/api';
import { queryKeys } from '../queryKeys';

export const DASHBOARD_QUERY_KEY = queryKeys.dashboard();

export function useDashboard(params = {}, { enabled = true } = {}) {
  const hasParams = params && Object.keys(params).length > 0;
  return useQuery({
    queryKey: queryKeys.dashboard(params),
    queryFn: async () => {
      const res = await fleetService.getFleetDashboard(hasParams ? params : undefined);
      return res.data;
    },
    placeholderData: keepPreviousData,
    enabled,
  });
}
