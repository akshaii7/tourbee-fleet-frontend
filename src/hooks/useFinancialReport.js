import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/api';

export const FINANCIAL_QUERY_KEY = ['financial'];

export function useFinancialReport(params = {}) {
  return useQuery({
    queryKey: [...FINANCIAL_QUERY_KEY, params],
    queryFn: async () => {
      const res = await reportService.getFinancialReport(params);
      return res.data;
    },
    staleTime: 60000,
  });
}
