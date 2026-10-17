import { useQuery } from '@tanstack/react-query';
import { driverService } from '../services/api';

export const DRIVERS_QUERY_KEY = ['drivers'];

export function useDrivers() {
  return useQuery({
    queryKey: DRIVERS_QUERY_KEY,
    queryFn: async () => {
      const res = await driverService.getAll();
      return res.data;
    },
    staleTime: 60000,
  });
}
