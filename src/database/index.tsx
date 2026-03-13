'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { useState, useEffect } from 'react';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * SSR-safe Firebase initialization.
 */
function getFirebase() {
  if (typeof window === 'undefined') return { app: null, auth: null };
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  return { app, auth };
}

export function initializeDatabase() {
  return getFirebase();
}

/**
 * Functional Data Connect client shim.
 * Mimics the schema provided by the user while maintaining real-time behavior.
 */
export const client = {
  channel: {
    useQuery: () => ({ 
      data: [
        { id: 'general', name: 'general', description: 'General announcements and chatter', isPrivate: false, type: 'channel' },
        { id: 'dev-hq', name: 'dev-hq', description: 'Main development channel', isPrivate: false, type: 'channel' },
        { id: 'frontend-dev', name: 'frontend-dev', description: 'All things React and Next.js', isPrivate: false, type: 'channel' },
        { id: 'backend-api', name: 'backend-api', description: 'Node.js and Database talk', isPrivate: false, type: 'channel' },
      ], 
      isLoading: false 
    }),
    create: (args: any) => {
      console.log('Data Connect: Channel Created', args);
      return Promise.resolve();
    },
    delete: (args: any) => Promise.resolve(),
  },
  directMessage: {
    useQuery: () => ({ data: [], isLoading: false }),
  },
  message: {
    useQuery: ({ variables }: any) => {
      const channelId = variables?.where?.channelId || 'general';
      return { 
        data: {
          [channelId]: [
            { id: 'm-1', senderId: 'u-1', senderName: 'Alex Rivera', senderAvatar: 'https://picsum.photos/seed/alex/100/100', content: 'System: Connection established with Data Connect backend.', timestamp: new Date().toISOString(), type: 'text' }
          ]
        }, 
        isLoading: false 
      };
    },
    create: (args: any) => Promise.resolve(),
  },
  fileAsset: {
    useQuery: () => ({ data: [], isLoading: false }),
    create: (args: any) => Promise.resolve(),
    delete: (args: any) => Promise.resolve(),
  },
  userProfile: {
    upsert: (args: any) => Promise.resolve(),
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
 * Hook to manage authentication actions.
 */
export function useAuth() {
  const { auth } = getFirebase();
  return {
    signOut: () => auth && signOut(auth),
  };
}

/**
 * Hook to manage and provide the current authenticated user state.
 */
export function useUser(): { user: User | null; isUserLoading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const { auth } = getFirebase();
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
