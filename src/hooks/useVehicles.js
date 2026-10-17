import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/api';
import { queryKeys } from '../queryKeys';

export const VEHICLES_QUERY_KEY = queryKeys.vehicles;

export function useVehicles() {
  return useQuery({
    queryKey: queryKeys.vehicles,
    queryFn: async () => {
      const res = await fleetService.getFleetVehicles();
      return res.data;
    },
  });
}
