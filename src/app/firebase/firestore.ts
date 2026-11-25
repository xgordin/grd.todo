import { inject, InjectionToken } from '@angular/core';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';

import { useFirebaseEmulators } from '../../environments/environment';
import { FIREBASE_APP, FIREBASE_AUTH } from './firebase';

export const FIRESTORE = new InjectionToken<Firestore | null>('Cloud Firestore', {
  providedIn: 'root',
  factory: () => {
    const app = inject(FIREBASE_APP);
    if (!app) return null;

    inject(FIREBASE_AUTH);
    const firestore = getFirestore(app);
    if (useFirebaseEmulators) {
      connectFirestoreEmulator(firestore, '127.0.0.1', 8180);
    }

    return firestore;
  },
});
