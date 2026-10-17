import { useQuery } from '@tanstack/react-query';
import { vehicleService } from '../services/api';
import { queryKeys } from '../queryKeys';

export const VEHICLES_QUERY_KEY = queryKeys.vehicles;

export function useVehicles() {
  const query = useQuery({
    queryKey: queryKeys.vehicles,
    queryFn: async () => {
      const res = await vehicleService.getAll();
      return res.data;
    },
  });

  return query;
}
