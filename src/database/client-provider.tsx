'use client';

import { createContext, useContext, type ReactNode, useState, useEffect } from 'react';
import { initializeDatabase } from '@/database';

const DatabaseContext = createContext<ReturnType<typeof initializeDatabase> | null>(null);

export function DatabaseClientProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<ReturnType<typeof initializeDatabase>>({ app: null, auth: null });

  useEffect(() => {
    // This runs only on the client after mount, preventing SSR errors
    setDb(initializeDatabase());
  }, []);

  return (
    <DatabaseContext.Provider value={db}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseClient() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabaseClient must be used within DatabaseClientProvider');
  return ctx;
}
