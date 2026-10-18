import React from 'react'
import ReactDOM from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { queryClient } from './queryClient'
import App from './App.jsx'
import './index.css'

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'tourbee-cache',
  throttleTime: 1000,
});

const persistOptions = {
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
  buster: '1.3.0',
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Exclude auth/user info from persisted storage
      const key = query.queryKey?.[0];
      if (key === 'me' || key === 'auth') return false;
      // Only persist successful queries with valid, non-empty data
      if (query.state.status !== 'success') return false;
      const data = query.state.data;
      if (data === undefined || data === null) return false;
      // Don't persist empty arrays — preserve previously cached valid data
      if (Array.isArray(data) && data.length === 0) return false;
      if (data && typeof data === 'object' && Array.isArray(data.results) && data.results.length === 0) return false;
      return true;
    },
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <App />
    </PersistQueryClientProvider>
  </React.StrictMode>,
)

