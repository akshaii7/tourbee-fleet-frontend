import { useQuery } from '@tanstack/react-query';
import { authService } from '../services/api';

export const ME_QUERY_KEY = ['me'];

export function useMe() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tourbee_access_token') : null;
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      const res = await authService.getProfile();
      if (res.data) {
        localStorage.setItem('tourbee_user', JSON.stringify(res.data));
      }
      return res.data;
    },
    enabled: !!token,
    staleTime: Infinity, // Ensures the "me" profile call happens only once on initial load
  });
}
