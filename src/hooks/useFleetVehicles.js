import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/api';

export const FLEET_VEHICLES_QUERY_KEY = ['fleetVehicles'];

export function useFleetVehicles(params = {}) {
  return useQuery({
    queryKey: [...FLEET_VEHICLES_QUERY_KEY, params],
    queryFn: async () => {
      const res = await fleetService.getFleetVehicles(params);
      return res.data;
    },
  });
}
