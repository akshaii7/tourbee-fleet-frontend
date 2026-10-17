import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../services/api';

export const MY_SALARY_QUERY_KEY = ['mySalary'];

export function useMySalary(params = {}) {
  return useQuery({
    queryKey: [...MY_SALARY_QUERY_KEY, params],
    queryFn: async () => {
      const res = await fleetService.getMySalary(params);
      return res.data;
    },
  });
}
