import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fleetService } from '../services/api';
import { queryKeys } from '../queryKeys';

export const SALARY_PAYMENTS_QUERY_KEY = queryKeys.salaryPayments();

export function useSalaryPayments(params = {}) {
  const hasParams = params && Object.keys(params).length > 0;
  return useQuery({
    queryKey: queryKeys.salaryPayments(params),
    queryFn: async () => {
      const res = await fleetService.getSalaryPayments(hasParams ? params : undefined);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}
