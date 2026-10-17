import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/api';

export const DASHBOARD_QUERY_KEY = ['dashboard'];

export function useDashboard(params = {}) {
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, params],
    queryFn: async () => {
      const res = await fleetService.getFleetDashboard(params);
      return res.data;
    },
  });
}
