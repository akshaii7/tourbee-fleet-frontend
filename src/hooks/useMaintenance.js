import { useQuery } from '@tanstack/react-query';
import { maintenanceService } from '../services/api';
import { queryKeys } from '../queryKeys';

export const MAINTENANCE_QUERY_KEY = queryKeys.maintenance();

export function useMaintenance(params = {}) {
  const hasParams = params && Object.keys(params).length > 0;
  const key = queryKeys.maintenance(params);
  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const res = await maintenanceService.getAll(hasParams ? params : undefined);
      return res.data;
    },
  });

  return query;
}
