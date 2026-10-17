import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/api';

export const DEDUCTIONS_QUERY_KEY = ['deductions'];

export function useDeductions(params = {}) {
  return useQuery({
    queryKey: [...DEDUCTIONS_QUERY_KEY, params],
    queryFn: async () => {
      const res = await fleetService.getDeductions(params);
      return res.data;
    },
  });
}
