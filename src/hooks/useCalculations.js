import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/api';

export const CALCULATIONS_QUERY_KEY = ['calculations'];

export function useCalculations() {
  return useQuery({
    queryKey: CALCULATIONS_QUERY_KEY,
    queryFn: async () => {
      const res = await fleetService.getCalculations();
      return res.data;
    },
    staleTime: 60000,
  });
}
