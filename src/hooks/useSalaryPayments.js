import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/api';

export const SALARY_PAYMENTS_QUERY_KEY = ['salaryPayments'];

export function useSalaryPayments(params = {}) {
  return useQuery({
    queryKey: [...SALARY_PAYMENTS_QUERY_KEY, params],
    queryFn: async () => {
      const res = await fleetService.getSalaryPayments(params);
      return res.data;
    },
  });
}
