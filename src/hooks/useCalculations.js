import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/api';
import { queryKeys } from '../queryKeys';

export const CALCULATIONS_QUERY_KEY = queryKeys.calculations;

export function useCalculations(options = {}) {
  // Support both legacy positional param object and options object
  const select = typeof options === 'function' ? options : options?.select;
  return useQuery({
    queryKey: queryKeys.calculations,
    queryFn: async () => {
      const res = await fleetService.getCalculations();
      return res.data;
    },
    select,
  });
}
