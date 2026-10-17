import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/api';

export const CALCULATIONS_QUERY_KEY = ['calculations'];

export function useCalculations(params = {}) {
  return useQuery({
    queryKey: [...CALCULATIONS_QUERY_KEY, params],
    queryFn: async () => {
      const res = await fleetService.getCalculations(params);
      return res.data;
    },
  });
}
