import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/api';

export const VEHICLES_QUERY_KEY = ['vehicles'];

export function useVehicles() {
  return useQuery({
    queryKey: VEHICLES_QUERY_KEY,
    queryFn: async () => {
      const res = await fleetService.getFleetVehicles();
      return res.data;
    },
    staleTime: 60000,
  });
}
