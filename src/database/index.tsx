'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged, Auth, type User } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { firebaseConfig } from '@/firebase/config';

// Global instances to ensure singleton behavior on the client side
let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;

/**
 * SSR-safe Firebase initialization helper.
 * This ensures we don't attempt to access Firebase services on the server
 * or before the app is fully registered.
 */
export function initializeDatabase() {
  if (typeof window === 'undefined') {
    return { app: null, auth: null };
  }
  
  if (!firebaseApp) {
    try {
      firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    } catch (e) {
      console.error('Firebase App initialization failed', e);
    }
  }
  
  if (firebaseApp && !firebaseAuth) {
    try {
      // Calling getAuth registers the auth component if it's the first time
      firebaseAuth = getAuth(firebaseApp);
    } catch (e) {
      // Fallback removed to prevent "No Firebase App" error reported in logs
      console.warn('Firebase Auth registration issue:', e);
    }
  }
  
  return { app: firebaseApp, auth: firebaseAuth };
}

/**
 * Data Connect Client Shim
 * Provides a mock interface for the application to interact with
 * the Data Connect schema provided: User, Channel, Message, etc.
 */
export const client = {
  user: {
    useQuery: () => ({ 
      data: [
        { id: 'u-1', username: 'alex', email: 'alex@devtalk.app', displayName: 'Alex Rivera', profilePictureUrl: 'https://picsum.photos/seed/alex/100/100' },
        { id: 'u-2', username: 'sarah', email: 'sarah@devtalk.app', displayName: 'Sarah Chen', profilePictureUrl: 'https://picsum.photos/seed/sarah/100/100' },
        { id: 'u-3', username: 'marcus', email: 'marcus@devtalk.app', displayName: 'Marcus Bell', profilePictureUrl: 'https://picsum.photos/seed/marcus/100/100' },
        { id: 'u-4', username: 'elena', email: 'elena@devtalk.app', displayName: 'Elena Rodriguez', profilePictureUrl: 'https://picsum.photos/seed/elena/100/100' },
        { id: 'u-5', username: 'david', email: 'david@devtalk.app', displayName: 'David Kim', profilePictureUrl: 'https://picsum.photos/seed/david/100/100' },
      ], 
      isLoading: false 
    }),
    upsert: (args: any) => Promise.resolve(),
  },
  channel: {
    useQuery: () => ({ 
      data: [
        { id: 'general', name: 'general', description: 'General announcements and chatter', isPrivate: false, type: 'channel' },
        { id: 'dev-hq', name: 'dev-hq', description: 'Main development channel', isPrivate: false, type: 'channel' },
        { id: 'frontend-dev', name: 'frontend-dev', description: 'All things React and Next.js', isPrivate: false, type: 'channel' },
      ], 
      isLoading: false 
    }),
    create: (args: any) => {
      if (args.onSuccess) args.onSuccess();
      return Promise.resolve();
    },
    delete: (args: any) => Promise.resolve(),
  },
  message: {
    useQuery: ({ variables }: any) => {
      const channelId = variables?.where?.channelId || 'general';
      const mockMsgs = [
        { id: 'm-1', senderId: 'u-1', senderName: 'Alex Rivera', senderAvatar: 'https://picsum.photos/seed/alex/100/100', content: 'Connection established with Data Connect.', timestamp: new Date().toISOString(), type: 'text' }
      ];
      return { 
        data: { [channelId]: mockMsgs }, 
        isLoading: false 
      };
    },
    create: (args: any) => Promise.resolve(),
  },
  directMessage: {
    useQuery: () => ({ data: [], isLoading: false }),
  },
  fileAsset: {
    useQuery: () => ({ 
      data: [
        { id: 'f-1', name: 'design-spec.pdf', size: '1.2 MB', type: 'document', ownerName: 'Alex Rivera', ownerAvatar: 'https://picsum.photos/seed/alex/100/100', uploadedAt: new Date().toISOString(), url: '#' }
      ], 
      isLoading: false 
    }),
    create: (args: any) => {
      if (args.onSuccess) args.onSuccess();
      return Promise.resolve();
    },
    delete: (args: any) => {
      if (args.onSuccess) args.onSuccess();
      return Promise.resolve();
    },
  },
  huddlePresence: {
    useQuery: ({ variables }: any) => ({ 
      data: [
        { userId: 'u-1', channelId: variables?.channelId, joinedAt: new Date().toISOString() }
      ], 
      isLoading: false 
    }),
    join: (args: any) => Promise.resolve(),
    leave: (args: any) => Promise.resolve(),
  },
  userProfile: {
    upsert: (args: any) => Promise.resolve(),
  }
} as any;

/**
 * Hook to manage and provide the current authenticated user state.
 */
export function useUser(): { user: User | null; isUserLoading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const { auth } = initializeDatabase();
    if (!auth) {
      setIsUserLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsUserLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, isUserLoading };
}

export function useAuth() {
  const { auth } = initializeDatabase();
  return {
    signOut: () => auth && signOut(auth),
    auth,
  };
}
