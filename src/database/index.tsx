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
      // Calling getAuth registers the auth component
      firebaseAuth = getAuth(firebaseApp);
    } catch (e) {
      console.warn('Firebase Auth registration issue:', e);
    }
  }
  
  return { app: firebaseApp || null, auth: firebaseAuth || null };
}

/**
 * Data Connect Client Shim
 * Aligned with the provided schema: User, Channel, Message, etc.
 */
export const client = {
  user: {
    useQuery: () => ({ 
      data: [
        { id: 'u-1', username: 'alex', email: 'alex@devtalk.app', displayName: 'Alex Rivera', profilePictureUrl: 'https://picsum.photos/seed/alex/100/100' },
        { id: 'u-2', username: 'sarah', email: 'sarah@devtalk.app', displayName: 'Sarah Chen', profilePictureUrl: 'https://picsum.photos/seed/sarah/100/100' },
      ], 
      isLoading: false 
    }),
    upsert: (args: any) => {
      console.log('Syncing User Profile to Data Connect:', args.variables);
      return Promise.resolve();
    },
  },
  channel: {
    useQuery: () => ({ 
      data: [
        { id: 'general', name: 'general', description: 'General announcements and chatter', isPrivate: false, type: 'channel' },
        { id: 'dev-hq', name: 'dev-hq', description: 'Main development channel', isPrivate: false, type: 'channel' },
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
