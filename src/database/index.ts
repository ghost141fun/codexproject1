'use client';

import { databaseConfig } from '@/database/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeDatabase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let databaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      databaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the databaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to database config object.', e);
      }
      databaseApp = initializeApp(databaseConfig);
    }

    return getSdks(databaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(databaseApp: FirebaseApp) {
  return {
    databaseApp,
    auth: getAuth(databaseApp),
    firestore: getFirestore(databaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './db/use-collection';
export * from './db/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
