import { useQuery } from '@tanstack/react-query';
import { maintenanceService } from '../services/api';

export const MAINTENANCE_QUERY_KEY = ['maintenance'];

export function useMaintenance(params = {}) {
  return useQuery({
    queryKey: [...MAINTENANCE_QUERY_KEY, params],
    queryFn: async () => {
      const res = await maintenanceService.getAll(params);
      return res.data;
    },
  });
}
