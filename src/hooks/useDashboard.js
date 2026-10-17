import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/api';

export const DASHBOARD_QUERY_KEY = ['dashboard'];

export function useDashboard(params = {}, { enabled = true } = {}) {
  const hasParams = params && Object.keys(params).length > 0;
  return useQuery({
    queryKey: hasParams ? [...DASHBOARD_QUERY_KEY, params] : DASHBOARD_QUERY_KEY,
    queryFn: async () => {
      const res = await fleetService.getFleetDashboard(hasParams ? params : undefined);
      return res.data;
    },
    staleTime: 60000,
    enabled,
  });
}
