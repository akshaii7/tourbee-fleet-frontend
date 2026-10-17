import { useQuery } from '@tanstack/react-query';
import { driverService } from '../services/api';
import { queryKeys } from '../queryKeys';

export const DRIVERS_QUERY_KEY = queryKeys.drivers;

export function useDrivers() {
  const query = useQuery({
    queryKey: queryKeys.drivers,
    queryFn: async () => {
      const res = await driverService.getAll();
      return res.data;
    },
  });

  return query;
}
