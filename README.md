# GrdTodo

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.31.

## Firebase local

Authentication e Firestore usam o projeto de demonstração `demo-grd-todo`.

Authentication usa a porta 9099 e Firestore usa a porta 8180.

No primeiro terminal, inicie os emuladores.

```powershell
npm run firebase:emulators
```

No segundo terminal, inicie o Angular.

```powershell
npm start
```

Abra [o aplicativo](http://localhost:4200) e clique em **Entrar com Google** para usar uma conta de teste na tela do emulador. O [painel dos emuladores](http://127.0.0.1:4000) mostra as contas e os dados locais. Encerre os emuladores com Ctrl+C para exportar os dados em `.firebase/data`. A próxima inicialização importa esse conteúdo automaticamente.

A configuração usa Node.js 24.12 e Java 21. Um Java 21 portátil já foi preparado em `.firebase/tools` neste computador. Em outro computador, instale Java 21 ou coloque um runtime com pasta `bin` dentro de `.firebase/tools`. O comando do projeto detecta esse runtime automaticamente.

Para validar o login de teste, logout e bloqueio de acesso pelas regras, com os emuladores de desenvolvimento encerrados, execute o comando abaixo. Ele inicia e encerra uma sessão isolada de validação.

```powershell
npm run firebase:check
```

As regras do Firestore permitem que cada conta acesse suas listas, tarefas e etapas. Os documentos validam título, estado, campos permitidos, vínculo com a lista ou tarefa e datas do servidor. As exclusões são lógicas via `archived`, preservando os registros e ocultando os itens relacionados. No Angular, `FIREBASE_AUTH` e `FIRESTORE` fornecem as instâncias por injeção de dependência.

## Lista de tarefas

A interface usa PrimeNG 21 com tema Aura e SCSS. Permite criar e renomear listas, criar, editar, concluir, reabrir e excluir tarefas e etapas. As etapas são exibidas em painéis expansíveis na lista principal. A conclusão da tarefa é independente da conclusão das etapas.

Também há favoritos, busca por título de tarefa ou etapa, filtros de conclusão e navegação adaptada ao celular. As alterações são sincronizadas entre sessões da mesma conta conectadas ao mesmo Firebase local. O teste `firebase:check` valida gravações, edição, exclusões lógicas, rejeição de documentos inválidos e isolamento entre contas.

O desenvolvimento usa `src/environments/environment.development.ts`. A configuração de produção em `src/environments/environment.ts` aguarda os dados do aplicativo Web de um projeto Firebase real. O login Google real também precisa estar habilitado nesse projeto. A conexão com a nuvem será configurada quando você decidir ativá-la.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
