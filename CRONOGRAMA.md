# Cronograma de implementação do grd.todo

## Objetivo e escopo

Criar um gerenciador pessoal de tarefas com interface própria, inspirado no fluxo de listas, tarefas e etapas do Microsoft To Do. A primeira versão terá listas pessoais, tarefas com título e estado de conclusão e subtarefas de um nível, chamadas **Etapas**. O uso começa no Windows durante o desenvolvimento, com publicação posterior para acessar e sincronizar os dados no computador e no celular.

O projeto local já tem Angular 21.2, Node.js 24.12.0 e SCSS configurado para os componentes. A base atual será aproveitada, incluindo a adoção de SCSS nos estilos globais quando a interface inicial for criada. [Compatibilidade do Angular](https://angular.dev/reference/versions)

## Armazenamento e sincronização

Para a primeira versão, a opção aprovada é **Firebase Authentication com login Google e Cloud Firestore no plano gratuito Spark**. Cada conta terá suas próprias listas, tarefas e etapas. A mesma conta poderá ver e editar os dados nos dois dispositivos, com indicação de gravação pendente ou falha. O Firestore oferece 1 GiB de armazenamento, 50 mil leituras e 20 mil gravações por dia na cota gratuita. [Cotas do Firestore](https://firebase.google.com/docs/firestore/quotas) · [Login com Google](https://firebase.google.com/docs/auth/web/google-signin) · [Plano Spark](https://firebase.google.com/pricing)

| Alternativa | Quando faz sentido |
| --- | --- |
| Google Drive | Pode guardar um backup JSON visível no Drive mediante autorização por arquivo (`drive.file`). A sincronização de tarefas via arquivos exigiria implementar controle de versões e conciliação de edições. O `appDataFolder` serve para arquivos que ficam ocultos na interface do Drive. [Permissões do Drive](https://developers.google.com/workspace/drive/api/guides/api-specific-auth) · [Pasta de dados do app](https://developers.google.com/workspace/drive/api/guides/appdata) |
| Supabase Free | Alternativa se houver preferência por PostgreSQL. A cota gratuita inclui 500 MB de banco por projeto, com possibilidade de pausa após uma semana de baixa atividade. [Plano e cotas do Supabase](https://supabase.com/pricing) |

Os primeiros fluxos usarão dados de demonstração. A integração será validada com os emuladores locais de Authentication e Firestore, usando contas de teste e persistindo os dados de desenvolvimento entre sessões. O acesso a dados reais na nuvem fica para a fase de publicação. [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite/install_and_configure)

## Fases e estimativas

As estimativas são em dias úteis de trabalho a partir do início da implementação. A meta é deixar a primeira versão pronta para publicar em **11 a 16 dias úteis**. A data da publicação fica a seu critério.

| Fase | Esforço | Entrega e critério de aceite |
| --- | --- | --- |
| 1. Base visual e navegação | 1 a 2 dias | Aproveitar o Angular existente, definir a identidade visual e montar a navegação entre listas e tarefas. No desktop, pode haver navegação lateral. No celular, a lista principal ocupa a largura da tela. O fluxo deve funcionar a partir de 320 px, sem rolagem horizontal. |
| 2. Listas, tarefas e etapas | 3 a 4 dias | Criar, editar e excluir listas e tarefas, concluir e reabrir tarefas. Adicionar, editar, excluir, marcar e desmarcar etapas. O acordeão exibe as etapas na lista principal, com contagem de progresso na tarefa. |
| 3. Persistência e conta | 3 a 4 dias | Integrar Firebase Auth e Firestore aos emuladores. Validar que os dados persistem após reinício, alterações aparecem em duas sessões da mesma conta e outra conta tem acesso recusado pelas regras do Firestore. Testar falhas de gravação e mostrar o estado da sincronização. [Teste de regras no emulador](https://firebase.google.com/docs/firestore/security/test-rules-emulator) |
| 4. Preparação para mobile | 2 a 3 dias | Preparar a PWA Angular com manifesto, ícones e service worker. Validar em ambiente de teste local com HTTPS a instalação pelo Chrome no Android e a adição à tela de início pelo Safari no iPhone. Conferir toque, teclado virtual, textos longos e etapas expandidas em telas estreitas. [PWA no Angular](https://angular.dev/ecosystem/service-workers/getting-started) · [Instalação em Android e iOS](https://web.dev/learn/pwa/installation/) |
| 5. Validação local para publicação | 2 a 3 dias | Rodar o build de produção e conferir os fluxos completos em desktop e mobile com os emuladores, incluindo login de teste, criação de tarefa, atualização de etapas, reabertura da tela e isolamento entre contas. Preparar a configuração do ambiente publicado e o checklist de liberação. |
| 6. Publicação sob demanda | 1 a 2 dias após a decisão | Publicar em HTTPS com Firebase Hosting como opção inicial. Validar o login Google no domínio publicado, a instalação no celular e a sincronização entre o celular e o computador. Enviar o código ao GitHub e publicar o app são ações separadas, realizadas quando você solicitar cada uma. [Firebase Hosting](https://firebase.google.com/docs/hosting) |

## Aceite do acordeão de etapas

- Ao expandir uma tarefa, as etapas aparecem logo abaixo dela, dentro da lista principal. É possível adicionar, marcar e desmarcar etapas nessa mesma tela.
- O controle de expansão funciona por toque e teclado, anuncia se a tarefa está expandida e funciona de forma independente da caixa de conclusão.
- A linha da tarefa mostra o progresso, como “2 de 3 etapas”. A proposta inicial mantém a conclusão da tarefa como ação explícita do usuário.
- Ao recarregar a tela ou abrir a mesma conta em outro dispositivo após sincronizar, títulos, estados e totais continuam consistentes.

## Evolução após a primeira versão

- **Google Play e App Store** entram em uma etapa própria se você escolher distribuir pelas lojas. Avaliar o empacotamento do Angular com Capacitor, validar login e sincronização nas versões móveis e levantar requisitos de conta, assinatura e revisão antes de estimar a submissão. [Documentação do Capacitor](https://capacitorjs.com/docs)
- **Backup no Google Drive** pode começar com a exportação e restauração de um arquivo JSON visível no Drive. Edição offline das tarefas também pode ser tratada em etapa própria.
