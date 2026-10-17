import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { reportService } from '../services/api';
import { queryKeys } from '../queryKeys';

export const FINANCIAL_QUERY_KEY = queryKeys.financial();

export function useFinancialReport(params = {}) {
  const startDate = params?.start_date || '';
  const endDate = params?.end_date || '';
  return useQuery({
    queryKey: queryKeys.financial(startDate, endDate),
    queryFn: async () => {
      const res = await reportService.getFinancialReport(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}
