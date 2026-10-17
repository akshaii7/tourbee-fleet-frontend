import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/api';
import { queryKeys } from '../queryKeys';

export const DEDUCTIONS_QUERY_KEY = queryKeys.deductions;

export function useDeductions(params = {}) {
  const hasParams = params && Object.keys(params).length > 0;
  return useQuery({
    queryKey: queryKeys.deductions,
    queryFn: async () => {
      const res = await fleetService.getDeductions(hasParams ? params : undefined);
      return res.data;
    },
  });
}
