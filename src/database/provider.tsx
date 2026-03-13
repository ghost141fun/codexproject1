'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';

interface DatabaseProviderProps {
  children: ReactNode;
  databaseApp: FirebaseApp;
  auth: Auth;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface DatabaseContextState {
  areServicesAvailable: boolean;
  databaseApp: FirebaseApp | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface DatabaseServicesAndUser {
  databaseApp: FirebaseApp;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const DatabaseContext = createContext<DatabaseContextState | undefined>(undefined);

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({
  children,
  databaseApp,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (databaseUser) => {
        setUserAuthState({ user: databaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo((): DatabaseContextState => {
    const servicesAvailable = !!(databaseApp && auth);
    return {
      areServicesAvailable: servicesAvailable,
      databaseApp: servicesAvailable ? databaseApp : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [databaseApp, auth, userAuthState]);

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): DatabaseServicesAndUser => {
  const context = useContext(DatabaseContext);

  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider.');
  }

  if (!context.areServicesAvailable || !context.databaseApp || !context.auth) {
    throw new Error('Database core services not available. Check DatabaseProvider props.');
  }

  return {
    databaseApp: context.databaseApp,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = (): Auth => {
  const { auth } = useDatabase();
  return auth;
};

export const useDatabaseApp = (): FirebaseApp => {
  const { databaseApp } = useDatabase();
  return databaseApp;
};

export const useUser = (): UserHookResult => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a DatabaseProvider.');
  }
  return { 
    user: context.user, 
    isUserLoading: context.isUserLoading, 
    userError: context.userError 
  };
};
