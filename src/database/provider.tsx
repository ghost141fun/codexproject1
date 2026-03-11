'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { DatabaseErrorListener } from '@/components/DatabaseErrorListener'

interface DatabaseProviderProps {
  children: ReactNode;
  databaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Database context
export interface DatabaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  databaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useDatabase()
export interface DatabaseServicesAndUser {
  databaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const DatabaseContext = createContext<DatabaseContextState | undefined>(undefined);

/**
 * DatabaseProvider manages and provides Database services and user authentication state.
 */
export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({
  children,
  databaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Database auth state changes
  useEffect(() => {
    if (!auth) { // If no Auth service instance, cannot determine user state
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null }); // Reset on auth instance change

    const unsubscribe = onAuthStateChanged(
      auth,
      (databaseUser) => { // Auth state determined
        setUserAuthState({ user: databaseUser, isUserLoading: false, userError: null });
      },
      (error) => { // Auth listener error
        console.error("DatabaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); // Cleanup
  }, [auth]); // Depends on the auth instance

  // Memoize the context value
  const contextValue = useMemo((): DatabaseContextState => {
    const servicesAvailable = !!(databaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      databaseApp: servicesAvailable ? databaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [databaseApp, firestore, auth, userAuthState]);

  return (
    <DatabaseContext.Provider value={contextValue}>
      <DatabaseErrorListener />
      {children}
    </DatabaseContext.Provider>
  );
};

/**
 * Hook to access core Database services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useDatabase = (): DatabaseServicesAndUser => {
  const context = useContext(DatabaseContext);

  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider.');
  }

  if (!context.areServicesAvailable || !context.databaseApp || !context.firestore || !context.auth) {
    throw new Error('Database core services not available. Check DatabaseProvider props.');
  }

  return {
    databaseApp: context.databaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Database Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useDatabase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useDatabase();
  return firestore;
};

/** Hook to access Database App instance. */
export const useDatabaseApp = (): FirebaseApp => {
  const { databaseApp } = useDatabase();
  return databaseApp;
};

type MemoDatabase <T> = T & {__memo?: boolean};

export function useMemoDatabase<T>(factory: () => T, deps: DependencyList): T | (MemoDatabase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoDatabase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { // Renamed from useAuthUser
  const { user, isUserLoading, userError } = useDatabase(); // Leverages the main hook
  return { user, isUserLoading, userError };
};