import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/api';
import { queryKeys } from '../queryKeys';

export const SALARY_OVERVIEW_QUERY_KEY = queryKeys.salaryOverview;

export function useSalaryOverview(params = {}) {
  const hasParams = params && Object.keys(params).length > 0;
  return useQuery({
    queryKey: queryKeys.salaryOverview,
    queryFn: async () => {
      const res = await fleetService.getSalaryOverview(hasParams ? params : undefined);
      return res.data;
    },
  });
}
