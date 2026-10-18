import { useQuery } from '@tanstack/react-query';
import { vehicleService } from '../services/api';
import { queryKeys } from '../queryKeys';

export const VEHICLES_QUERY_KEY = queryKeys.vehicles;

export function useVehicles() {
  // Only run the query when a valid access token exists.
  // Prevents unauthenticated requests that could return empty data
  // and overwrite a valid cached vehicle list.
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('tourbee_access_token')
      : null;

  const query = useQuery({
    queryKey: queryKeys.vehicles,
    queryFn: async () => {
      const res = await vehicleService.getAll();
      return res.data;
    },
    enabled: !!token,
    staleTime: 60000,
  });

  return query;
}
