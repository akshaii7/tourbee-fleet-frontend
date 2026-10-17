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
  buster: '1.1.0',
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Exclude auth/user info from persisted storage
      const key = query.queryKey?.[0];
      if (key === 'me' || key === 'auth') return false;
      return query.state.status === 'success';
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

