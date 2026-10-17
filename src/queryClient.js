import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,            // 30 seconds fresh
      gcTime: 1800000,             // 30 minutes cache persistence
      refetchOnMount: true,        // Always refetch on mount if data is stale
      refetchOnWindowFocus: false, // Do not refetch when switching browser tabs
      refetchOnReconnect: true,    // Refetch when reconnecting
      retry: 1,                    // Maximum 1 retry on network failures
    },
  },
});
