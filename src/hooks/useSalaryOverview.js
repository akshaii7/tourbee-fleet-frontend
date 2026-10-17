import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/api';

export const SALARY_OVERVIEW_QUERY_KEY = ['salaryOverview'];

export function useSalaryOverview(params = {}) {
  return useQuery({
    queryKey: [...SALARY_OVERVIEW_QUERY_KEY, params],
    queryFn: async () => {
      const res = await fleetService.getSalaryOverview(params);
      return res.data;
    },
  });
}
