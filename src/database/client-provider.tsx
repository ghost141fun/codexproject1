'use client';

import React, { useMemo, type ReactNode } from 'react';
import { DatabaseProvider } from '@/database/provider';
import { initializeDatabase } from '@/database';

interface DatabaseClientProviderProps {
  children: ReactNode;
}

export function DatabaseClientProvider({ children }: DatabaseClientProviderProps) {
  const databaseServices = useMemo(() => {
    // Initialize Database on the client side, once per component mount.
    return initializeDatabase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <DatabaseProvider
      databaseApp={databaseServices.databaseApp}
      auth={databaseServices.auth}
      firestore={databaseServices.firestore}
    >
      {children}
    </DatabaseProvider>
  );
}