import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fleetService } from '../services/api';
import { queryKeys } from '../queryKeys';

export const MY_SALARY_QUERY_KEY = queryKeys.mySalary();

export function useMySalary(params = {}) {
  const hasParams = params && Object.keys(params).length > 0;
  return useQuery({
    queryKey: queryKeys.mySalary(params),
    queryFn: async () => {
      const res = await fleetService.getMySalary(hasParams ? params : undefined);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}
