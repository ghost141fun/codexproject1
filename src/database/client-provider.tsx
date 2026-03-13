'use client';

import { createContext, useContext, type ReactNode, useMemo } from 'react';
import { initializeDatabase } from '@/database';

const DatabaseContext = createContext<ReturnType<typeof initializeDatabase> | null>(null);

export function DatabaseClientProvider({ children }: { children: ReactNode }) {
  // Use useMemo to ensure initialization only happens on the client after mounting
  const db = useMemo(() => initializeDatabase(), []);

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
