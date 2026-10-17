import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/api';
import { queryKeys } from '../queryKeys';

export const CALCULATIONS_QUERY_KEY = queryKeys.calculations;

export function useCalculations(options = {}) {
  const select = typeof options === 'function' ? options : options?.select;
  const query = useQuery({
    queryKey: queryKeys.calculations,
    queryFn: async () => {
      const res = await fleetService.getCalculations();
      return res.data;
    },
    select,
  });

  return query;
}
