'use client';
import React, { createContext, useContext } from 'react';

// Define the shape of the context data
interface DatabaseContextValue {
  databaseApp: any;
  auth: any;
  firestore: any;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export const DatabaseProvider = ({ children, databaseApp, auth, firestore }: { children: React.ReactNode } & DatabaseContextValue) => {
  const value = { databaseApp, auth, firestore };
  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
