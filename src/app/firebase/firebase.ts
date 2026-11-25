import { inject, InjectionToken } from '@angular/core';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';

import { firebaseOptions, useFirebaseEmulators } from '../../environments/environment';

export const FIREBASE_APP = new InjectionToken<FirebaseApp | null>('FirebaseApp', {
  providedIn: 'root',
  factory: () => (firebaseOptions ? initializeApp(firebaseOptions) : null),
});

export const FIREBASE_AUTH = new InjectionToken<Auth | null>('Firebase Auth', {
  providedIn: 'root',
  factory: () => {
    const app = inject(FIREBASE_APP);
    if (!app) return null;

    const auth = getAuth(app);
    if (useFirebaseEmulators) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    }

    return auth;
  },
});
