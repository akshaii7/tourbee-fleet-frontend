import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300000,          // 5 minutes data freshness
      gcTime: 1800000,             // 30 minutes garbage collection / cache persistence
      refetchOnMount: false,       // Do not refetch when components mount if data is in cache
      refetchOnWindowFocus: false, // Do not refetch when switching browser tabs
      refetchOnReconnect: false,   // Do not refetch on network reconnect
      retry: 1,                    // Maximum 1 retry on network failures
    },
  },
});
