import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from 'firebase/auth';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { ToastModule } from 'primeng/toast';

import { TodoList, TodoStep, TodoStore, TodoTask } from './todo-store';

@Component({
  selector: 'app-todo',
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    PanelModule,
    ToastModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './todo.html',
  styleUrl: './todo.scss',
})
export class Todo {
  readonly user = input.required<User>();
  readonly logout = output<void>();
  protected readonly store = inject(TodoStore);
  private readonly messages = inject(MessageService);
  private readonly confirmations = inject(ConfirmationService);

  protected readonly view = signal('all');
  protected readonly query = signal('');
  protected readonly filter = signal('pending');
  protected readonly sidebarOpen = signal(false);
  protected readonly saving = signal(false);
  protected taskTitle = '';
  protected stepTitles: Record<string, string> = {};
  protected editorVisible = false;
  protected editorTitle = '';
  protected editorHeading = '';
  protected editorTarget: TodoTask | TodoStep | TodoList | null = null;
  protected editorKind: 'list' | 'task' | 'step' = 'list';
  protected readonly today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  protected readonly currentList = computed(() =>
    this.store.lists().find((list) => list.id === this.view()),
  );
  protected readonly heading = computed(
    () =>
      this.currentList()?.title ?? (this.view() === 'important' ? 'Importantes' : 'Minhas tarefas'),
  );
  protected readonly scopedTasks = computed(() =>
    this.store.tasks().filter((task) => {
      if (this.view() === 'important') return task.important;
      return this.view() === 'all' || task.listId === this.view();
    }),
  );
  protected readonly completedCount = computed(
    () => this.scopedTasks().filter((task) => task.completed).length,
  );
  protected readonly importantCount = computed(
    () => this.store.tasks().filter((task) => task.important && !task.completed).length,
  );
  protected readonly pendingCount = computed(
    () => this.store.tasks().filter((task) => !task.completed).length,
  );
  protected readonly visibleTasks = computed(() => {
    const search = this.query().trim().toLocaleLowerCase('pt-BR');
    return this.scopedTasks().filter((task) => {
      const matchesStatus =
        this.filter() === 'all' ||
        (this.filter() === 'completed' ? task.completed : !task.completed);
      const matchesSearch =
        !search ||
        task.title.toLocaleLowerCase('pt-BR').includes(search) ||
        this.stepsFor(task.id).some((step) =>
          step.title.toLocaleLowerCase('pt-BR').includes(search),
        );
      return matchesStatus && matchesSearch;
    });
  });

  constructor() {
    effect((onCleanup) => {
      this.store.connect(this.user().uid);
      onCleanup(() => this.store.disconnect());
    });
  }

  protected selectView(id: string): void {
    this.view.set(id);
    this.query.set('');
    this.sidebarOpen.set(false);
  }

  protected listCount(id: string): number {
    return this.store.tasks().filter((task) => task.listId === id && !task.completed).length;
  }

  protected stepsFor(id: string): TodoStep[] {
    return this.store.steps().filter((step) => step.taskId === id);
  }

  protected completedSteps(id: string): number {
    return this.stepsFor(id).filter((step) => step.completed).length;
  }

  protected async addTask(): Promise<void> {
    if (!this.taskTitle.trim() || this.saving()) return;
    const title = this.taskTitle.trim();
    const listId = this.currentList()?.id ?? 'inbox';
    const saved = await this.perform(() =>
      this.store.createTask(title, listId, this.view() === 'important'),
    );
    if (saved) {
      this.taskTitle = '';
      this.filter.set('pending');
      this.query.set('');
    }
  }

  protected async addStep(taskId: string): Promise<void> {
    const title = this.stepTitles[taskId]?.trim();
    if (!title || this.saving()) return;
    if (await this.perform(() => this.store.createStep(title, taskId)))
      this.stepTitles[taskId] = '';
  }

  protected toggleTask(task: TodoTask): void {
    void this.perform(() => this.store.updateTask(task.id, { completed: !task.completed }));
  }

  protected toggleImportant(task: TodoTask): void {
    void this.perform(() => this.store.updateTask(task.id, { important: !task.important }));
  }

  protected toggleStep(step: TodoStep): void {
    void this.perform(() => this.store.updateStep(step.id, { completed: !step.completed }));
  }

  protected edit(
    kind: 'list' | 'task' | 'step',
    target: TodoList | TodoTask | TodoStep | null = null,
  ): void {
    this.editorKind = kind;
    this.editorTarget = target;
    this.editorTitle = target?.title ?? '';
    this.editorHeading = target
      ? 'Editar ' + { list: 'lista', task: 'tarefa', step: 'etapa' }[kind]
      : 'Nova lista';
    this.editorVisible = true;
  }

  protected async saveEditor(): Promise<void> {
    const title = this.editorTitle.trim();
    if (!title || this.saving()) return;
    const saved = await this.perform(async () => {
      if (!this.editorTarget) {
        const list = await this.store.createList(title);
        this.selectView(list.id);
      } else if (this.editorKind === 'list') {
        await this.store.updateList(this.editorTarget.id, { title });
      } else if (this.editorKind === 'task') {
        await this.store.updateTask(this.editorTarget.id, { title });
      } else {
        await this.store.updateStep(this.editorTarget.id, { title });
      }
    }, 'Alterações salvas');
    if (saved) this.editorVisible = false;
  }

  protected remove(kind: 'list' | 'task' | 'step', target: TodoList | TodoTask | TodoStep): void {
    const name = { list: 'lista', task: 'tarefa', step: 'etapa' }[kind];
    this.confirmations.confirm({
      header: 'Excluir ' + name + '?',
      message:
        kind === 'list'
          ? 'A lista e suas tarefas deixarão de aparecer no seu espaço.'
          : `“${target.title}” deixará de aparecer na lista.`,
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        void this.perform(async () => {
          if (kind === 'list') {
            await this.store.updateList(target.id, { archived: true });
            this.selectView('all');
          } else if (kind === 'task') {
            await this.store.updateTask(target.id, { archived: true });
          } else {
            await this.store.updateStep(target.id, { archived: true });
          }
        }, 'Exclusão concluída');
      },
    });
  }

  private async perform(operation: () => Promise<unknown>, summary?: string): Promise<boolean> {
    if (this.saving()) return false;
    this.saving.set(true);
    try {
      await operation();
      if (summary) this.messages.add({ severity: 'success', summary, life: 2500 });
      return true;
    } catch {
      this.messages.add({
        severity: 'error',
        summary: 'Não foi possível salvar',
        detail: 'Confira sua conexão com o Firebase e tente novamente.',
        sticky: true,
      });
      return false;
    } finally {
      this.saving.set(false);
    }
  }
}
