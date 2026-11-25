import { computed, inject, Injectable, signal, WritableSignal } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  updateDoc,
} from 'firebase/firestore';

import { FIRESTORE } from '../firebase/firestore';

interface RecordData {
  id: string;
  title: string;
  archived: boolean;
  createdAt: Timestamp | null;
}

export interface TodoList extends RecordData {}

export interface TodoTask extends RecordData {
  listId: string;
  completed: boolean;
  important: boolean;
}

export interface TodoStep extends RecordData {
  taskId: string;
  completed: boolean;
}

@Injectable({ providedIn: 'root' })
export class TodoStore {
  private readonly db = inject(FIRESTORE);
  private uid = '';
  private listeners: Unsubscribe[] = [];
  private readonly allLists = signal<TodoList[]>([]);
  private readonly allTasks = signal<TodoTask[]>([]);
  private readonly allSteps = signal<TodoStep[]>([]);
  private readonly pendingCollections = signal<string[]>([]);
  private readonly connectedCollections = signal<string[]>([]);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly lists = computed(() => this.allLists().filter((list) => !list.archived));
  readonly tasks = computed(() => {
    const listIds = new Set(this.lists().map((list) => list.id));
    return this.allTasks().filter(
      (task) => !task.archived && (task.listId === 'inbox' || listIds.has(task.listId)),
    );
  });
  readonly steps = computed(() => this.allSteps().filter((step) => !step.archived));
  readonly syncing = computed(() => this.pendingCollections().length > 0);
  readonly connected = computed(() => this.connectedCollections().length === 3);

  connect(uid: string): void {
    this.disconnect();
    this.uid = uid;
    if (!this.db) {
      this.error.set('Configure o Firebase para carregar suas tarefas.');
      this.loading.set(false);
      return;
    }

    this.watch('lists', this.allLists);
    this.watch('tasks', this.allTasks);
    this.watch('steps', this.allSteps);
  }

  disconnect(): void {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners = [];
    this.uid = '';
    this.allLists.set([]);
    this.allTasks.set([]);
    this.allSteps.set([]);
    this.pendingCollections.set([]);
    this.connectedCollections.set([]);
    this.loading.set(true);
    this.error.set('');
  }

  createList(title: string) {
    return this.create('lists', { title: title.trim(), archived: false });
  }

  createTask(title: string, listId: string, important = false) {
    return this.create('tasks', {
      title: title.trim(),
      listId,
      completed: false,
      important,
      archived: false,
    });
  }

  createStep(title: string, taskId: string) {
    return this.create('steps', { title: title.trim(), taskId, completed: false, archived: false });
  }

  updateList(id: string, changes: Partial<Pick<TodoList, 'title' | 'archived'>>) {
    return this.update('lists', id, changes);
  }

  updateTask(
    id: string,
    changes: Partial<Pick<TodoTask, 'title' | 'completed' | 'important' | 'archived'>>,
  ) {
    return this.update('tasks', id, changes);
  }

  updateStep(id: string, changes: Partial<Pick<TodoStep, 'title' | 'completed' | 'archived'>>) {
    return this.update('steps', id, changes);
  }

  private reference(name: string) {
    if (!this.db || !this.uid) throw new Error('Entre na sua conta para salvar as alterações.');
    return collection(this.db, 'users', this.uid, name);
  }

  private create(name: string, data: object) {
    return addDoc(this.reference(name), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  private update(name: string, id: string, changes: object) {
    return updateDoc(doc(this.reference(name), id), {
      ...changes,
      updatedAt: serverTimestamp(),
    });
  }

  private watch<T extends RecordData>(name: string, target: WritableSignal<T[]>): void {
    const unsubscribe = onSnapshot(
      this.reference(name),
      { includeMetadataChanges: true },
      (snapshot) => {
        target.set(
          snapshot.docs
            .map((entry) => ({ ...entry.data(), id: entry.id }) as T)
            .sort(
              (a, b) =>
                (a.createdAt?.toMillis() ?? Infinity) - (b.createdAt?.toMillis() ?? Infinity),
            ),
        );
        this.pendingCollections.update((names) => {
          const others = names.filter((entry) => entry !== name);
          return snapshot.metadata.hasPendingWrites ? [...others, name] : others;
        });
        this.connectedCollections.update((names) => {
          const others = names.filter((entry) => entry !== name);
          return snapshot.metadata.fromCache ? others : [...others, name];
        });
        if (this.connected()) this.loading.set(false);
      },
      () => {
        this.error.set(
          'Não foi possível carregar as tarefas. Confira o Firebase e recarregue a página.',
        );
        this.loading.set(false);
      },
    );
    this.listeners.push(unsubscribe);
  }
}
