import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';

import { useFirebaseEmulators } from '../environments/environment';
import { FIREBASE_AUTH } from './firebase/firebase';
import { Todo } from './todo/todo';

@Component({
  selector: 'app-root',
  imports: [ButtonModule, Todo],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(FIREBASE_AUTH);

  protected readonly authConfigured = this.auth !== null;
  protected readonly localMode = useFirebaseEmulators;
  protected readonly user = signal<User | null>(null);
  protected readonly restoringSession = signal(this.authConfigured);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  constructor() {
    if (!this.auth) return;

    const unsubscribe = onAuthStateChanged(this.auth, (user) => {
      this.user.set(user);
      this.restoringSession.set(false);
    });
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  protected async updateSession(): Promise<void> {
    if (!this.auth || this.busy()) return;

    this.error.set('');
    this.busy.set(true);
    const wasSignedIn = this.user() !== null;

    try {
      if (wasSignedIn) {
        await signOut(this.auth);
      } else {
        await signInWithPopup(this.auth, new GoogleAuthProvider());
      }
    } catch (error) {
      const code = error instanceof FirebaseError ? error.code : undefined;
      if (code === 'auth/popup-blocked') {
        this.error.set('Permita a abertura de pop-ups neste site e tente novamente.');
      } else if (code === 'auth/network-request-failed' && this.localMode) {
        this.error.set('Confira se o emulador de Authentication está rodando e tente novamente.');
      } else if (code !== 'auth/popup-closed-by-user') {
        this.error.set(
          wasSignedIn ? 'Não foi possível sair da conta.' : 'Não foi possível entrar.',
        );
      }
    } finally {
      this.busy.set(false);
    }
  }
}
