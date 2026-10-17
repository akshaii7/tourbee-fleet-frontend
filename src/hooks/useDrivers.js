import { useQuery } from '@tanstack/react-query';
import { driverService } from '../services/api';

export const DRIVERS_QUERY_KEY = ['drivers'];

export function useDrivers(params = {}) {
  return useQuery({
    queryKey: [...DRIVERS_QUERY_KEY, params],
    queryFn: async () => {
      const res = await driverService.getAll(params);
      return res.data;
    },
  });
}
