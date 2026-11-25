import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
} from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  deleteField,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  setLogLevel,
  terminate,
  updateDoc,
} from 'firebase/firestore/lite';

const app = initializeApp({ apiKey: 'demo-api-key', projectId: 'demo-grd-todo' });
const auth = getAuth(app);
const firestore = getFirestore(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFirestoreEmulator(firestore, '127.0.0.1', 8180);
setLogLevel('silent');

const document = doc(firestore, 'configuration-check', 'private');
const denied = { code: 'permission-denied' };

try {
  const response = await fetch(
    'http://127.0.0.1:8180/v1/projects/demo-grd-todo/databases/(default)/documents/configuration-check/private',
  );
  assert.ok([401, 403].includes(response.status), 'Acesso sem autenticação deve ser recusado.');

  const credential = GoogleAuthProvider.credential(
    JSON.stringify({
      sub: 'firebase-configuration-check',
      email: 'firebase-check@example.test',
      email_verified: true,
    }),
  );
  const result = await signInWithCredential(auth, credential);
  assert.equal(result.user.email, 'firebase-check@example.test');
  assert.equal(result.user.providerData[0].providerId, 'google.com');

  await assert.rejects(getDoc(document), denied);
  await assert.rejects(setDoc(document, { title: 'Teste local' }), denied);
  const root = `users/${result.user.uid}`;
  const list = doc(firestore, root, 'lists', 'test-list');
  const task = doc(firestore, root, 'tasks', 'test-task');
  const step = doc(firestore, root, 'steps', 'test-step');
  const timestamps = () => ({ createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await setDoc(list, { title: 'Lista de teste', archived: false, ...timestamps() });
  await setDoc(task, {
    title: 'Tarefa de teste',
    listId: list.id,
    completed: false,
    important: false,
    archived: false,
    ...timestamps(),
  });
  await setDoc(step, {
    title: 'Primeira etapa',
    taskId: task.id,
    completed: false,
    archived: false,
    ...timestamps(),
  });
  await updateDoc(step, { completed: true, updatedAt: serverTimestamp() });
  assert.equal((await getDoc(step)).data().completed, true);
  assert.equal((await getDoc(task)).data().completed, false);
  await updateDoc(task, { title: 'Tarefa editada', important: true, updatedAt: serverTimestamp() });
  assert.equal((await getDoc(task)).data().title, 'Tarefa editada');
  assert.equal((await getDocs(collection(firestore, root, 'tasks'))).size, 1);
  await assert.rejects(updateDoc(task, { title: '', updatedAt: serverTimestamp() }), denied);
  await assert.rejects(updateDoc(task, { title: '   ', updatedAt: serverTimestamp() }), denied);
  await assert.rejects(
    updateDoc(task, { title: 'a'.repeat(241), updatedAt: serverTimestamp() }),
    denied,
  );
  await assert.rejects(
    updateDoc(task, { completed: deleteField(), updatedAt: serverTimestamp() }),
    denied,
  );
  await assert.rejects(updateDoc(task, { role: 'admin', updatedAt: serverTimestamp() }), denied);
  await assert.rejects(updateDoc(task, { listId: 'inbox', updatedAt: serverTimestamp() }), denied);
  await assert.rejects(
    setDoc(doc(firestore, root, 'steps', 'orphan'), {
      title: 'Sem tarefa',
      taskId: 'missing',
      completed: false,
      archived: false,
      ...timestamps(),
    }),
    denied,
  );
  await signInWithCredential(
    auth,
    GoogleAuthProvider.credential(
      JSON.stringify({
        sub: 'another-configuration-user',
        email: 'another-check@example.test',
        email_verified: true,
      }),
    ),
  );
  await assert.rejects(getDoc(task), denied);
  await assert.rejects(getDocs(collection(firestore, root, 'tasks')), denied);
  await assert.rejects(updateDoc(step, { completed: false, updatedAt: serverTimestamp() }), denied);
  await signInWithCredential(auth, credential);
  await updateDoc(task, { completed: true, updatedAt: serverTimestamp() });
  await updateDoc(task, { completed: false, updatedAt: serverTimestamp() });
  assert.equal((await getDoc(step)).data().completed, true);
  await updateDoc(step, { archived: true, updatedAt: serverTimestamp() });
  await assert.rejects(updateDoc(step, { archived: false, updatedAt: serverTimestamp() }), denied);
  await updateDoc(list, { archived: true, updatedAt: serverTimestamp() });
  await assert.rejects(
    updateDoc(task, { title: 'Lista excluída', updatedAt: serverTimestamp() }),
    denied,
  );
  await signOut(auth);
  assert.equal(auth.currentUser, null);
  console.log(
    'PASSOU: login, listas, tarefas, etapas, edição, exclusão lógica e isolamento entre contas.',
  );
} finally {
  await terminate(firestore);
  await deleteApp(app);
}
