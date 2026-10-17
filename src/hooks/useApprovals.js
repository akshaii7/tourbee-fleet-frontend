import { useQuery } from '@tanstack/react-query';
import { submissionService } from '../services/api';
import { queryKeys } from '../queryKeys';

export function useApprovals() {
  return useQuery({
    queryKey: queryKeys.approvals,
    queryFn: async () => {
      const [eRes, xRes, allRes] = await Promise.all([
        submissionService.getEarnings({ status: 'PENDING' }),
        submissionService.getExpenses({ status: 'PENDING' }),
        submissionService.getEarnings(),
      ]);
      return {
        pendingEarnings: eRes.data?.results || eRes.data || [],
        pendingExpenses: xRes.data?.results || xRes.data || [],
        allEarnings: allRes.data?.results || allRes.data || [],
      };
    },
  });
}
