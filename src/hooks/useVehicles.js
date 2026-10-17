import { useQuery } from '@tanstack/react-query';
import { vehicleService } from '../services/api';

export const VEHICLES_QUERY_KEY = ['vehicles'];

export function useVehicles(params = {}) {
  return useQuery({
    queryKey: [...VEHICLES_QUERY_KEY, params],
    queryFn: async () => {
      const res = await vehicleService.getAll(params);
      return res.data;
    },
  });
}
