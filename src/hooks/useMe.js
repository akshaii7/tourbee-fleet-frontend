import { useQuery } from '@tanstack/react-query';
import { authService } from '../services/api';
import { queryKeys } from '../queryKeys';

export const ME_QUERY_KEY = queryKeys.me;

export function useMe() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tourbee_access_token') : null;
  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const res = await authService.getProfile();
      if (res.data) {
        localStorage.setItem('tourbee_user', JSON.stringify(res.data));
      }
      return res.data;
    },
    enabled: !!token,
    staleTime: Infinity,
  });

  return query;
}
