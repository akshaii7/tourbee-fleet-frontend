import { useQuery } from '@tanstack/react-query';
import { financeService } from '../services/api';
import { queryKeys } from '../queryKeys';

export function useFinanceSalaryPayments() {
  return useQuery({
    queryKey: queryKeys.financeSalaryPayments,
    queryFn: async () => {
      const res = await financeService.getSalaryPayments();
      return res.data?.results || res.data || [];
    },
  });
}

export function useFinanceRentPayments() {
  return useQuery({
    queryKey: queryKeys.financeRentPayments,
    queryFn: async () => {
      const res = await financeService.getRentPayments();
      return res.data?.results || res.data || [];
    },
  });
}
