# Bloco 7 — Manifest, Empacotamento & Limpeza

> **Como usar este arquivo:** ele é autocontido. Se você está lendo isto numa sessão nova, sem
> ter visto os blocos anteriores, tudo que você precisa saber sobre eles está resumido abaixo em
> "Depende de". Não precisa reler os outros blocos — só confirmar que o que eles prometem entregar
> de fato está no repo antes de fechar as stories deste arquivo.

## Objetivo

Fechar o port do link-in-bio pra template Masia empacotando o que os Blocos 1–6 construíram:
escrever o manifest `masi.template.json` (o contrato que o hub usa pra saber o que é o template,
quais telas tem, quem pode logar, o que a IA pode editar), criar os fixtures de preview pro editor
por IA, decidir a questão de crédito de OSS (`THIRD_PARTY.md`), garantir que pastas de ferramenta
de dev não vão junto quando o template for copiado pro monorepo de orquestração, e fazer uma
auditoria cruzada final contra os dois checklists e a lista de erros comuns do `Importantdoc.md`.

Este bloco **não escreve código de app**. Ele empacota, documenta e audita o que já foi
construído.

## Por que este bloco existe

Sem manifest, o hub não sabe clonar o template (não sabe telas, papéis, migrations, o que é
editável). Sem `preview-fixtures.ts`, o editor por IA (Sandpack) não tem dado pra renderizar o
preview e a experiência de edição quebra. Sem a limpeza de pastas de ferramenta de dev, a cópia
pro monorepo de orquestração (`masi-ai-orquestration/clone-templates/<slug>/`) carrega lixo que
não faz parte do produto. Sem a auditoria cruzada final, um erro sutil introduzido em qualquer
um dos 6 blocos anteriores (ex: um `owner_id` esquecido, um import morto, uma dependência
Supabase que sobrou) só seria pego em publish — ou pior, em produção.

## Depende de / Habilita

**Depende de** (Blocos 1–6, já devem estar concluídos):

- **Bloco 1 (Stack & Build)** — `tsc && vite build` passando limpo, TypeScript strict,
  `package-lock.json` commitado, dependências Lovable/Supabase removidas do `package.json`.
- **Bloco 2 (Schema & Migração)** — `supabase/migrations/0001_business_schema.sql` única,
  seguindo §B4 (owner_id text, sem RLS, snake_case, sem nomes reservados).
- **Bloco 3 (Auth)** — Better-Auth via `auth` do gateway, papéis `admin/manager/rep`, sem OAuth.
- **Bloco 4 (Camada de dados)** — `src/lib/data/client.ts` (protegido), `types.gen.ts`
  (protegido), repos `*.repo.ts` usando `db.table(...)`.
- **Bloco 5 (Telas & Rotas)** — telas em `src/screens/**`, `App.tsx`/`app.routes.tsx`,
  `AppShell`, `RequireAuth`, `registry.tsx`. As telas prováveis (usadas neste bloco pro
  manifest): **home, links, leads, design, analytics, settings, shortlinks, form** — nomes
  herdados das páginas atuais do app (`AppHome`, `LinksPage`, `LeadsPage`, `DesignPage`,
  `AnalyticsPage`, `SettingsPage`, `ShortLinksPage`, `FormPage`, hoje em `src/pages/app/`, a
  serem movidas para `src/screens/` pelo Bloco 5).
- **Bloco 6 (Página pública & Tracking)** — rotas públicas resolvidas via gateway (`/public/...`),
  schema de `page_views`/`link_clicks`/`leads`/`short_links` compatível.

**Habilita**: nada dentro deste repo (é o bloco final do plano). Fora do repo, habilita o
**próximo passo** — publicar de verdade no monorepo `masi-ai-orquestration` (ver nota de
"Publish real" no fim deste arquivo, que é **fora de escopo** deste plano).

## Decisões já tomadas (não reabrir)

Estas decisões vieram de blocos anteriores e valem pra este bloco sem discussão:

| Tema | Decisão |
|---|---|
| Produtos digitais / pagamento | **Cortado.** Não aparece em nenhuma lista de screens, composio.toolkits, ou migration do manifest. |
| Autenticação | **Email/senha via Better-Auth apenas.** `auth.roles` no manifest = `["admin", "manager", "rep"]`. Sem OAuth. |
| Imagens (avatar, ícone de link, capa de tema) | **Base64 em coluna.** Não existe bucket de storage pra declarar em nenhum lugar do manifest — nem `envContract`, nem seção nova. |
| HTML customizado no `<head>` da página pública | **Cortado.** Não vira feature nem campo de configuração. |
| Extensão de fundação | **Fora de escopo.** Este bloco só empacota o que já existe; se alguma story parecer exigir mudar o gateway, ela está fora do escopo deste plano — pare e reporte, não implemente. |

## Regras obrigatórias (Importantdoc.md)

- **§B7** — formato exato do manifest: `id`, `name`, `description`, `version`, `engine:
  "vite-react-gateway"`, `schemaVersion: 1`, `migrations: ["0001_business_schema.sql"]`,
  `auth: { provider: "better-auth", roles: [...] }`, `screens: [...]`, `editable.allow`/
  `editable.protect`, `composio.toolkits`, `envContract`.
- **§B7 (protect)** — lista mínima protegida: `src/lib/data/client.ts`, `types.gen.ts`,
  `registry.tsx`, `main.tsx`, `supabase/migrations/**`; no scaffold **wiki** (que é o scaffold
  base deste port, por ser app "Pro" com shadcn/Tailwind), **também** ficam protegidos
  `src/components/ui/**`, `src/lib/utils.ts`, `vite.config.ts`, `components.json`,
  `preview-fixtures.ts`.
- **§B10** — pré-requisitos de publish (`package-lock.json` commitado, `vite build` passa, zero
  imports não usados), receita de publish (`templates:publish`, `demo:publish`), migration de
  catálogo espelhando `20260620160001_clone_template_forms_nps.sql`, redeploy Fly obrigatório
  pra ficar clonável de verdade.
- **Receita rápida, passos 8/9/10/12/13** — ajustar preview-fixtures (8), ajustar manifest (9),
  build limpo (10), THIRD_PARTY.md se copiou markup (12), teste E2E de clone real (13, fora
  deste repo).
- **Checklist de seleção** e **Checklist do template** (copiados literalmente na Story 7.5).
- **Erros comuns** (copiado literalmente na Story 7.5).

## Boas práticas obrigatórias neste bloco

- O `masi.template.json` é a **única fonte de verdade** sobre o que é editável por IA. Não
  duplique essa lista (allow/protect) em nenhum outro arquivo (README interno, comentário de
  código) — se precisar explicar a regra em prosa, **referencie o manifest**, não copie a lista.
- `preview-fixtures.ts` precisa cobrir **todo caso de tela vazia**: se uma tela mostra estado
  vazio quando a lista de um tipo de dado é `[]` (ex: "nenhum link ainda"), o fixture correspondente
  não pode ficar vazio por omissão — inclua pelo menos 1–2 registros de exemplo por tabela pra que
  o preview do editor mostre a tela "populada", que é o caso mais informativo pra quem está editando.
- A auditoria cruzada (Story 7.5) é **verificação, não reimplementação**: se algo estiver
  quebrado, a story documenta o gap e aponta pra qual bloco anterior deveria ter resolvido —
  não conserta schema/auth/dados aqui.
- Nada de inventar campo novo no manifest que não esteja no formato de §B7. Se um dado não
  cabe no formato (ex: bucket de storage), a resposta certa é "não declarar", não "inventar chave".

## Stories

### Story 7.1 — Escrever `masi.template.json`

- **Arquivos afetados**: `masi.template.json` (raiz do projeto, novo).
- **O que fazer**:
  1. Criar o arquivo na raiz seguindo **exatamente** o formato do exemplo em §B7 do
     `Importantdoc.md` (mesmas chaves, mesma ordem, sem chaves extras).
  2. Preencher:
     - `id`: `"linkguild"` (ou o slug final decidido para o template — confirmar contra o
       diretório de destino planejado em `masi-ai-orquestration/clone-templates/<slug>/`;
       se ainda não houver slug decidido, usar `"linkguild"` como placeholder e marcar
       explicitamente no PR/commit que o `id` precisa bater com o `<slug>` real escolhido
       antes do publish).
     - `name`: nome comercial do template (ex: `"LinkGuild — Link-in-bio"`).
     - `description`: uma frase, sem mencionar produtos digitais/pagamento/HTML customizado
       (features cortadas).
     - `version`: `"1.0.0"`.
     - `engine`: `"vite-react-gateway"` (fixo).
     - `schemaVersion`: `1`.
     - `migrations`: `["0001_business_schema.sql"]` — confirmar que é exatamente esse o nome
       do arquivo produzido pelo Bloco 2; se o Bloco 2 usou outro nome, ajustar aqui e não lá.
     - `auth`: `{ "provider": "better-auth", "roles": ["admin", "manager", "rep"] }`.
     - `screens`: uma entrada por tela do dashboard, refletindo o que o Bloco 5 produziu.
       Nomes prováveis (baseados nas páginas atuais em `src/pages/app/`, que o Bloco 5 deve
       mover para `src/screens/`):
       ```json
       [
         { "id": "home", "route": "/app", "title": "Início", "file": "src/screens/HomeScreen" },
         { "id": "links", "route": "/app/links", "title": "Links", "file": "src/screens/LinksScreen" },
         { "id": "leads", "route": "/app/leads", "title": "Leads", "file": "src/screens/LeadsScreen" },
         { "id": "design", "route": "/app/design", "title": "Design", "file": "src/screens/DesignScreen" },
         { "id": "analytics", "route": "/app/analytics", "title": "Analytics", "file": "src/screens/AnalyticsScreen" },
         { "id": "settings", "route": "/app/settings", "title": "Configurações", "file": "src/screens/SettingsScreen" },
         { "id": "shortlinks", "route": "/app/shortlinks", "title": "Short Links", "file": "src/screens/ShortLinksScreen" },
         { "id": "form", "route": "/app/form", "title": "Formulário", "file": "src/screens/FormScreen" }
       ]
       ```
       Antes de copiar isso literalmente, **confira contra o `App.tsx`/`app.routes.tsx` real**
       produzido pelo Bloco 5: se algum nome de arquivo/rota mudou, o manifest segue o que
       existe no código, não este rascunho.
     - `editable.allow`: `["src/screens/**", "src/components/**", "src/lib/data/*.repo.ts",
       "src/lib/format.ts", "src/app.css"]` (ajustar caminhos de estilo se o Bloco 1 escolheu
       Tailwind puro em vez de `app.css` — confirmar contra o que existe de fato no repo).
     - `editable.protect`: `["src/lib/data/client.ts", "src/lib/data/types.gen.ts",
       "src/components/registry.tsx", "src/main.tsx", "supabase/migrations/**",
       "src/components/ui/**", "src/lib/utils.ts", "vite.config.ts", "components.json",
       "preview-fixtures.ts"]` — lista completa porque este port usa base shadcn/Tailwind
       (scaffold `wiki`), então as proteções extras do wiki se aplicam.
     - `composio.toolkits`: `[]` — sem integrações de terceiro (produtos digitais/pagamento
       cortados; nenhuma outra integração foi decidida nos blocos anteriores).
     - `envContract`: `["VITE_GATEWAY_URL"]` (fixo, nada mais).
- **Critério de aceite**:
  - Arquivo é JSON válido (roda `JSON.parse` sem erro / `node -e "JSON.parse(require('fs').readFileSync('masi.template.json','utf8'))"` não lança).
  - Todas as chaves do exemplo de §B7 estão presentes, nenhuma chave extra foi inventada.
  - `screens[].file` aponta pra arquivos que **existem de fato** no repo (checar caminho
    contra o resultado real do Bloco 5, não só contra este rascunho).
  - `migrations[0]` bate com o nome real do arquivo em `supabase/migrations/`.
  - Nenhuma menção a produtos digitais, pagamento, storage bucket, ou HTML customizado em
    `description` ou em qualquer outro campo.
- **Fora de escopo**: mudar rotas/telas para bater com o manifest — é o contrário, o manifest
  segue o que o Bloco 5 já construiu. Se não bater, é achado de auditoria (Story 7.5), não
  conserto aqui.

### Story 7.2 — Criar `src/lib/data/preview-fixtures.ts`

- **Arquivos afetados**: `src/lib/data/preview-fixtures.ts` (novo).
- **O que fazer**: criar o arquivo de dados mock consumido pelo branch `PREVIEW` de
  `src/lib/data/client.ts` (produzido pelo Bloco 4) quando o editor por IA (Sandpack) carrega o
  app sem gateway real (`window.__MASI_PREVIEW__`). Cobrir pelo menos uma lista pequena
  (2–3 registros, não vazia) para cada tabela/entidade que as telas do Bloco 5 consomem:
  - **perfil/página** (o equivalente ao antigo `pages`/`profiles` consolidado, ex: handle,
    bio, avatar em base64 curto/placeholder, tema ativo).
  - **links** (2–3 links de exemplo com título, url, ícone, estado ativo/agendado).
  - **leads** (2–3 leads capturados de exemplo, com email/nome/origem).
  - **short_links** (2–3 exemplos com slug e target_url).
  - **integrations** (exemplo de integração configurada, ex: Google Analytics ID fake — nunca
    HTML customizado, que foi cortado).
  - **themes** (pelo menos 1 tema de exemplo com tokens/paleta, coerente com o formato definido
    pelo Bloco 2 no schema).
  - Se o Bloco 6 (analytics/tracking) introduziu tabelas próprias (`page_views`, `link_clicks`),
    incluir também fixtures pequenos pra elas — o suficiente pra tela de Analytics não renderizar
    vazia no preview.
  - Exportar os fixtures com nomes previsíveis (ex: `previewLinks`, `previewLeads`,
    `previewShortLinks`, `previewIntegrations`, `previewThemes`, `previewProfile`) para que
    `client.ts` (protegido, não mexer aqui) importe e sirva no branch de preview.
- **Critério de aceite**:
  - Arquivo exporta pelo menos um fixture por tabela de negócio criada no Bloco 2 (exceto
    tabelas cortadas: nenhuma fixture de produtos digitais/pagamento).
  - Nenhum fixture é uma lista vazia (`[]`) — todo caso de tela vazia foi coberto com dado de
    exemplo, conforme a boa prática deste bloco.
  - Os tipos dos fixtures batem com `types.gen.ts` (Bloco 4) — sem `any` solto.
  - `preview-fixtures.ts` está na lista `editable.protect` do manifest (Story 7.1) — confirmar
    que as duas stories não ficaram inconsistentes entre si.
- **Fora de escopo**: alterar o branch PREVIEW de `client.ts` (arquivo protegido, propriedade
  do Bloco 4) — esta story só cria os dados que ele consome.

### Story 7.3 — `THIRD_PARTY.md` (condicional à checagem de origem OSS)

- **Arquivos afetados**: `THIRD_PARTY.md` (raiz, criar **somente se** a checagem abaixo achar
  citação explícita de origem OSS).
- **O que fazer**:
  1. Checagem obrigatória feita durante a investigação deste bloco: busca por menção explícita
     de origem OSS (nome de projeto de referência, licença, "based on", "forked from", "clone
     of") em `README.md`, `package.json` e comentários de código do projeto (`src/**`).
  2. **Resultado da checagem**: `README.md` é o boilerplate padrão gerado pelo Lovable (não
     cita nenhum projeto OSS de referência). `package.json` não tem nenhuma dependência que
     seja, ela própria, "o projeto copiado" (só libs de uso comum: Radix, shadcn, etc., que já
     têm seus próprios avisos de licença embutidos no pacote, não precisam de `THIRD_PARTY.md`
     à parte). Busca em `src/**` por `MIT|Apache|BSD` não retornou nenhuma citação de origem —
     só falsos positivos de substring (ex: `TOAST_LIMIT`).
  3. **Decisão desta story**: como não há citação explícita de origem OSS de terceiro cujo
     **markup/UX tenha sido copiado de um projeto de referência nomeado**, `THIRD_PARTY.md`
     **não é criado** neste port. Se, ao revisitar os Blocos 5/6, alguém identificar que uma
     tela específica foi montada copiando markup de um projeto OSS nomeado (ex: um dos citados
     em §A4 do guia: Atomic CRM, Librelinks/LittleLink, BookStack), esta story deve ser reaberta
     e o arquivo criado citando **projeto + licença + link**, conforme §A2/§B10 passo 12.
- **Critério de aceite**:
  - Registro explícito (neste próprio arquivo de plano, já feito acima) de que a checagem foi
    executada e qual foi o resultado — não é uma omissão silenciosa.
  - Se, na hora de executar este bloco, o executor **souber** que alguma tela foi montada a
    partir de markup de um OSS nomeado (informação que só quem fez os Blocos 5/6 teria), o
    critério de aceite muda para: `THIRD_PARTY.md` criado citando projeto, licença e link,
    antes de fechar este bloco.
- **Fora de escopo**: avaliar licença de dependências de `package.json` (Radix, shadcn, etc.) —
  isso é uso normal de biblioteca via npm, não "cópia de projeto", e não precisa de
  `THIRD_PARTY.md`.

### Story 7.4 — Excluir pastas de ferramenta de dev da cópia para `clone-templates/<slug>/`

- **Arquivos afetados**: nenhum arquivo de app. Esta story é sobre **processo de cópia**, não
  sobre o conteúdo do repo atual.
- **Contexto que precisa ficar claro pra quem executar isso depois**: este repo
  (`LinGuild`, em `c:/__Projetos_/MasIABoirerplate/LinGuild`) é o **laboratório de port** —
  onde o domínio (schema, telas, dados) foi adaptado e validado. Ele **não é** o destino final.
  A receita de publish do guia (§B10, "Receita rápida" passo 2) manda **copiar o scaffold**
  (`clone-templates/forms-nps` ou `clone-templates/wiki`, já dentro de
  `masi-ai-orquestration/`) para `clone-templates/<slug>/` **e então** aplicar as mudanças de
  domínio feitas aqui em cima desse scaffold — **não** copiar este repositório inteiro
  (`LinGuild`) por cima do scaffold.
  - Como este port usa base shadcn/Tailwind ("Pro"), o ponto de partida real é
    `masi-ai-orquestration/clone-templates/wiki`, adaptado com: schema do Bloco 2, auth do
    Bloco 3, repos do Bloco 4, telas do Bloco 5, rotas públicas do Bloco 6, e o manifest/fixtures
    deste Bloco 7.
  - Confirmado nesta investigação: a raiz deste repo hoje tem `.lovable/`, `_bmad/`,
    `_bmad-output/` e `.claude/` — todas quatro **existem de fato** (verificado via listagem de
    diretório) e são artefatos de ferramenta de desenvolvimento (Lovable, BMAD, Claude Code),
    **não fazem parte do produto**.
  - Como o destino é `clone-templates/wiki` copiado e adaptado (não este repo copiado), essas
    quatro pastas **nunca chegam perto do destino por construção** — não existe um passo de
    "copiar `LinGuild/` inteiro" na receita real. O risco só existiria se alguém, por atalho,
    fizesse `cp -R LinGuild/ clone-templates/<slug>/` em vez de seguir a receita.
  - **Decisão desta story**: registrar essa instrução explicitamente como nota manual do passo
    de cópia (não como `.gitignore`/exclusão automática), porque este repo é laboratório e
    provavelmente não será ele mesmo publicado como está — quem executar o publish real deve:
    1. Partir de `masi-ai-orquestration/clone-templates/wiki` (`cp -R` desse scaffold pro slug
       novo, conforme §B10 passo 2 da receita rápida — **não** deste repo).
    2. Trazer para dentro dele, arquivo por arquivo (ou diff dirigido), o que foi produzido nos
       Blocos 1–7 **deste** repo: migration, `client.ts`/`types.gen.ts`/repos, telas, rotas
       públicas, `masi.template.json`, `preview-fixtures.ts`.
    3. Em nenhum momento copiar `.lovable/`, `_bmad/`, `_bmad-output/`, `.claude/` — essas
       pastas simplesmente não existem no scaffold `wiki` de destino e não devem ser
       introduzidas nele.
  - Caso, no futuro, alguém decida usar este repo (`LinGuild`) diretamente como origem de cópia
    (atalho fora da receita padrão), a mitigação é adicionar essas quatro pastas a um
    `.gitignore`/lista de exclusão explícita **antes** do `cp -R` — mas isso é contingência, não
    o caminho normal, e não deve ser tratado como resolvido "porque tem gitignore": a receita
    correta é a dos itens 1–3 acima.
- **Critério de aceite**:
  - Este arquivo de plano registra, de forma que sobreviva à sessão, que `.lovable/`, `_bmad/`,
    `_bmad-output/`, `.claude/` existem neste repo e **não** devem aparecer em
    `masi-ai-orquestration/clone-templates/<slug>/` sob nenhuma circunstância.
  - Fica explícito qual é o scaffold real de origem (`clone-templates/wiki`) para quem for
    fazer o publish de fato.
- **Fora de escopo**: executar a cópia (isso é o passo de publish, fora deste repo — ver nota
  final "Próximo passo fora de escopo").

### Story 7.5 — Auditoria cruzada final contra os checklists e erros comuns do `Importantdoc.md`

- **Arquivos afetados**: nenhum (story de verificação). Se algum item falhar, o achado deve ser
  registrado e direcionado ao bloco responsável — não conserte aqui.
- **O que fazer**: percorrer, item por item, os dois checklists finais e a lista de erros comuns
  do `Importantdoc.md`, copiados **literalmente** abaixo, confirmando contra o estado real do
  repo (código dos Blocos 1–6) se cada item foi respeitado.

  **Checklist de seleção (Parte A)** — já deveria estar resolvido desde antes do Bloco 1
  (decisão de portar este projeto), mas confirme que nada mudou o veredito:
  - [ ] Licença **permissiva** (MIT/Apache/BSD/MPL) se vamos copiar código; copyleft só
        referência; source-available **pular**.
  - [ ] Domínio é **dados + telas** (cabe no CRUD genérico) — **não** depende de
        realtime/WhatsApp/jobs/webhooks/pagamento/mídia.
  - [ ] Se precisa de página pública sem login → mapeado como **extensão do gateway** (§B6),
        não como template puro.
  - [ ] Joins necessários são resolvíveis **plano / 2 queries** (ou justificam endpoint
        explícito).

  **Checklist do template (Parte B)** — este é o que mais importa neste bloco:
  - [ ] SPA Vite + React 19, sem Next/SSR, sem backend próprio.
  - [ ] `package-lock.json` commitado; `vite build` passa; sem imports não usados.
  - [ ] Zero `@supabase`, zero fetch cru pro banco, zero auth próprio. Acesso só via `db`/`auth`.
  - [ ] Schema: `owner_id text references "user"(id)` em **toda tabela escrita pelo rep
        (inclusive filhas)**; sem RLS/`auth.uid()`; `snake_case`; sem nomes reservados.
  - [ ] `types.gen.ts` bate com o schema.
  - [ ] `masi.template.json`: engine `vite-react-gateway`, envContract
        `["VITE_GATEWAY_URL"]`, allow/protect corretos.
  - [ ] Telas fazem **list-then-filter** (sem get-by-id).
  - [ ] Papéis admin/manager/rep; 1º user = admin (automático).
  - [ ] Publicado com **gateway https público**; registrado no catálogo; demo no ar; Fly
        redeployado.
  - [x] `THIRD_PARTY.md` credita o OSS de origem.

  **Erros comuns (não faça)** — confirme que nenhum foi cometido nos Blocos 1–6:
  - ❌ Subir o OSS "como está" / criar servidor/Express/Next por app. → O gateway é o backend;
    reconstrua o front.
  - ❌ Escolher OSS source-available (BSL/SSPL/FSL) pra copiar. → Pular: proíbe SaaS gerenciado.
  - ❌ Tabela-filha sem `owner_id`. → `rep` toma 403 ao salvar. `owner_id` em **toda** tabela
    escrita pelo rep.
  - ❌ `owner_id uuid` ou `references auth.users`. → É `text references "user"(id)`.
  - ❌ RLS / `auth.uid()` / `profiles`. → Autz é no gateway.
  - ❌ Tela que depende de `GET /data/:table/:id` ou de join no banco. → Sem get-by-id; modo
    genérico é plano.
  - ❌ Mandar `owner_id` do front. → O gateway seta pela sessão.
  - ❌ `pnpm templates:publish <slug>` **sem** a URL https do gateway. → Embute localhost; todos
    os clones quebram.
  - ❌ Editar/depender de `client.ts`/`types.gen.ts` (ou `ui/**`/`utils.ts` no wiki) na IA. →
    São protegidos (contrato).
  - ❌ Prometer página pública / realtime / WhatsApp como "template". → São extensões de
    fundação (alinhar antes).

  **Resultado da auditoria (executado em 2026-07-23, sessão Amelia — verificado contra o código
  real, não contra a intenção dos planos):**

  | Item | Resultado |
  |---|---|
  | Licença permissiva / domínio dados+telas / página pública mapeada / joins resolvíveis (checklist de seleção) | ✅ Passa — decisão já tomada antes do Bloco 1, nada mudou o veredito (link-in-bio é dados+telas puro; rotas públicas já existem via gateway, ver Bloco 6). |
  | SPA Vite + React 19, sem Next/SSR, sem backend próprio | ✅ Passa — `vite.config.ts` plano, `react@19` em `package.json`, nenhum servidor/API própria no repo. |
  | `package-lock.json` commitado; `vite build` passa; sem imports não usados | ✅ Passa — `package-lock.json` rastreado no git; `npm run build` (`vite build`) e `npx tsc --noEmit -p tsconfig.app.json` (strict + `noUnusedLocals: true`) rodaram limpos nesta sessão. ⚠️ Nota não-bloqueante: o script `"build"` do `package.json` é só `vite build`, sem encadear `tsc` (§B3 pede `tsc && vite build`). `vite build` sozinho não falha em erro de tipo (esbuild só faz strip). Achado apontado ao **Bloco 1** — não corrigido aqui (fora de escopo de empacotamento). |
  | Zero `@supabase`, zero fetch cru pro banco, zero auth próprio | ✅ Passa — `grep` em `src/**` não encontrou nenhum import de `@supabase/supabase-js` ou `@lovable.dev/cloud-auth-js`; `src/integrations/supabase/` não existe mais; todo acesso a dado passa por `db`/`auth` de `src/lib/data/client.ts`. |
  | Schema: `owner_id text references "user"(id)` em toda tabela escrita pelo rep (inclusive filhas); sem RLS/`auth.uid()`; `snake_case`; sem nomes reservados | ✅ Passa — as 8 tabelas de `0001_business_schema.sql` (`pages`, `links`, `themes`, `integrations`, `leads`, `short_links`, `link_clicks`, `page_views`) têm `owner_id text not null references "user"(id) on delete cascade`; nenhuma menção real a RLS/`policy`/`auth.uid()`/tabela `profiles` no schema (só comentários explicando a ausência deliberada); nomes em `snake_case`; nenhum nome reservado usado. |
  | `types.gen.ts` bate com o schema | ✅ Passa — comparado campo a campo contra `0001_business_schema.sql`; tipos e nullability batem. |
  | `masi.template.json`: engine, envContract, allow/protect corretos | ✅ Passa — criado na Story 7.1 desta sessão, `screens[].file`/`migrations[0]` conferidos contra `app.routes.tsx` e `supabase/migrations/` reais. |
  | Telas fazem list-then-filter (sem get-by-id) | ✅ Passa — `src/lib/data/client.ts` (protegido) só expõe `list/create/update/remove`; get-by-id é estruturalmente impossível; todos os `*.repo.ts` usam só `db.table(...)`; hooks (`useLinks`, `usePages`, etc.) fazem `.list()` + `find`/`filter` no front. |
  | Papéis admin/manager/rep; 1º user = admin (automático) | ✅ Passa (do lado do app) — `src/lib/auth.tsx` só lê `role` da sessão do gateway (`gatewayAuth.me()`), nenhuma lógica de atribuição de papel no client. A garantia de "1º user = admin" é responsabilidade do gateway (fora deste repo) — não verificável aqui. |
  | Publicado com gateway https público; catálogo; demo; Fly redeploy | ⛔ Fora de escopo deste repo/plano — nenhum desses passos acontece aqui (ver nota "próximo passo fora de escopo" no fim deste arquivo). |
  | `THIRD_PARTY.md` credita o OSS de origem | ➖ Não aplicável — resolvido pela Story 7.3: checagem não achou citação explícita de origem OSS neste port; arquivo não criado por decisão documentada, não por omissão. |
  | Erros comuns (10 itens) | ✅ Nenhum cometido — confirmado item a item contra o código (subir OSS como está, licença source-available, tabela-filha sem `owner_id`, `owner_id uuid`/`auth.users`, RLS/`auth.uid()`/`profiles`, tela dependente de get-by-id/join, `owner_id` mandado do front, publish sem URL https, edição de arquivo protegido pela IA, promessa de realtime/WhatsApp como template — nenhum encontrado). |

  **Achado bloqueante fora deste checklist**: ver Story 7.6 abaixo — `package.json` ainda lista
  `@supabase/supabase-js`, `@lovable.dev/cloud-auth-js` e `lovable-tagger` em `dependencies`/
  `devDependencies`, apesar de não haver nenhum import dessas libs em `src/**`. Isso bloqueia o
  fechamento do plano de 7 blocos até o Bloco 1 remover de fato (ver Story 7.6).

- **Critério de aceite**:
  - Cada item dos três blocos acima foi confirmado contra o código real (não contra a intenção
    dos planos dos Blocos 1–6) e o resultado (passou / não passou / não se aplica a este bloco)
    está registrado.
  - Os itens de "Checklist do template" que dependem de **publish real** (gateway https,
    catálogo, demo, Fly redeploy) são marcados como **fora de escopo deste repo** — ver nota
    final "Próximo passo fora de escopo" — e não bloqueiam o fechamento deste plano de 7 blocos.
  - O item `THIRD_PARTY.md` do checklist é resolvido pela decisão da Story 7.3 (não criado,
    porque não há origem OSS explícita citada neste projeto) — reconciliar o `[x]` do guia
    genérico com o resultado real desta checagem específica.
  - Qualquer item que falhar vira um achado explícito, nomeando **qual bloco anterior (1–6)**
    deveria ter resolvido — este bloco não implementa o conserto.
- **Fora de escopo**: consertar achados de schema/auth/dados/telas (isso volta pro bloco dono);
  executar qualquer passo de publish real.

### Story 7.6 — Confirmar remoção de dependências Lovable/Supabase do `package.json`

- **Arquivos afetados**: nenhum (story de conferência; a remoção em si já foi decisão/execução
  dos Blocos 1/3/4 — aqui só se confirma que ficou de fato removida).
- **O que fazer**: abrir `package.json` da raiz e confirmar que **nenhuma** das três dependências
  abaixo está presente em `dependencies` ou `devDependencies`:
  - `@supabase/supabase-js`
  - `@lovable.dev/cloud-auth-js`
  - `lovable-tagger`
  Também confirmar (checagem rápida, mesmo escopo) que não sobrou nenhum import morto dessas
  libs em `src/**` (ex: `src/integrations/supabase/**` deveria ter sido removido pelo Bloco 4).
- **Critério de aceite**:
  - `package.json` não lista nenhuma das três dependências.
  - Nenhum arquivo em `src/**` importa `@supabase/supabase-js` ou `@lovable.dev/cloud-auth-js`.
  - Pasta `src/integrations/supabase/` (se existia) não existe mais.
  - Se qualquer uma das três ainda estiver presente, isto é um **achado bloqueante** — este
    bloco não pode ser dado como concluído (nem o plano de 7 blocos) até o Bloco responsável
    (1, 3 ou 4, conforme a dependência) remover de fato. Registrar o achado e apontar o bloco.
- **Fora de escopo**: remover a dependência (se ainda estiver lá, é retrabalho do bloco dono,
  não deste bloco de empacotamento).

  **Resultado (executado em 2026-07-23, sessão Amelia):**
  - ⛔ **Achado bloqueante.** `package.json` (raiz) ainda lista as três dependências:
    - `dependencies["@supabase/supabase-js"]` = `"^2.93.3"`
    - `dependencies["@lovable.dev/cloud-auth-js"]` = `"^1.0.0"`
    - `devDependencies["lovable-tagger"]` = `"^1.1.13"`
  - `grep -rE "@supabase/supabase-js|@lovable\.dev/cloud-auth-js|lovable-tagger" src/` não achou
    nenhum import — o código-fonte já não usa essas libs, e `src/integrations/supabase/` já foi
    removido. É dependência morta no manifesto de pacotes, não código quebrado.
  - **Responsável**: Bloco 1 (Stack & Build) é quem deveria ter removido essas três entradas do
    `package.json` — este bloco (7) não conserta, só registra e bloqueia o fechamento do plano.
  - **Ação necessária antes de fechar o plano de 7 blocos**: rodar (no Bloco 1, ou como
    correção pontual antes do publish real) `npm uninstall @supabase/supabase-js
    @lovable.dev/cloud-auth-js lovable-tagger` e commitar o `package.json`/`package-lock.json`
    resultante.

---

## Nota — próximo passo fora de escopo deste plano

Os passos abaixo (§B10 do `Importantdoc.md`) **não são stories executáveis deste plano**: eles
acontecem **fora deste repo**, no monorepo `masi-ai-orquestration`, depois que os Blocos 1–7
estiverem prontos e a Story 7.4 tiver sido seguida (scaffold `wiki` copiado + adaptado com o
trabalho deste repo). Cite-os aqui só para registro de continuidade:

1. `cd masi-ai-orquestration/clone-templates/<slug> && npm install`.
2. `pnpm templates:publish <slug> https://masi-tenant-gateway.fly.dev` (sempre com a URL
   https pública do gateway — nunca sem argumento, senão o default é localhost e todos os
   clones quebram).
3. `pnpm demo:publish <slug>` (habilita "Ver demo" em `demo-<slug>.masia.cloud`).
4. Criar migration de catálogo em `masi-ai-orquestration/supabase/migrations/`, espelhando
   `20260620160001_clone_template_forms_nps.sql` (INSERTs idempotentes em `clone_templates` e
   `clone_template_versions`).
5. Redeploy do serviço no Fly (API + worker) — obrigatório pra ficar clonável de verdade,
   porque o provisionador lê os templates do disco da imagem, não só do R2.
6. Teste E2E de clone real: clonar via o app → provisiona Neon → login admin semeado → telas
   funcionam.

Nenhum destes seis passos deve ser executado a partir deste repo (`LinGuild`) nem é
responsabilidade deste plano de 7 blocos.

## Definition of Done do bloco

Este bloco (e, com ele, o plano de 7 blocos inteiro) só está pronto quando:

- [x] `masi.template.json` existe na raiz, é JSON válido, segue o formato exato de §B7, e
      `screens[].file`/`migrations[0]` batem com os arquivos reais produzidos pelos Blocos 2 e 5.
      *(criado nesta sessão — Story 7.1)*
- [x] `src/lib/data/preview-fixtures.ts` existe, cobre todas as tabelas de negócio (nenhuma
      lista vazia), e está listado em `editable.protect` no manifest. *(expandido nesta sessão —
      Story 7.2, tipado contra `types.gen.ts`, `tsc --noEmit` limpo)*
- [x] A checagem de origem OSS foi feita e documentada (Story 7.3); `THIRD_PARTY.md` foi criado
      **somente se** a checagem tiver achado citação explícita — caso contrário, a ausência do
      arquivo está justificada por escrito, não é uma omissão. *(checagem confirmada nesta
      sessão: nenhuma citação de origem OSS; arquivo não criado, decisão já registrada na
      Story 7.3)*
- [x] A instrução de que `.lovable/`, `_bmad/`, `_bmad-output/`, `.claude/` nunca devem ir para
      `masi-ai-orquestration/clone-templates/<slug>/`, e de que a cópia real parte do scaffold
      `clone-templates/wiki` (não deste repo), está registrada e clara pra quem for executar o
      publish depois. *(confirmado nesta sessão: as quatro pastas existem de fato na raiz do
      repo; a nota da Story 7.4 já cobre a instrução)*
- [x] A auditoria cruzada da Story 7.5 foi executada por completo — cada item dos três blocos
      abaixo (copiados literalmente do `Importantdoc.md`) tem um resultado registrado:

  **Checklist de seleção (Parte A)**
  - [x] Licença **permissiva** (MIT/Apache/BSD/MPL) se vamos copiar código; copyleft só
        referência; source-available **pular**.
  - [x] Domínio é **dados + telas** (cabe no CRUD genérico) — **não** depende de
        realtime/WhatsApp/jobs/webhooks/pagamento/mídia.
  - [x] Se precisa de página pública sem login → mapeado como **extensão do gateway** (§B6),
        não como template puro.
  - [x] Joins necessários são resolvíveis **plano / 2 queries** (ou justificam endpoint
        explícito).

  **Checklist do template (Parte B)**
  - [x] SPA Vite + React 19, sem Next/SSR, sem backend próprio.
  - [x] `package-lock.json` commitado; `vite build` passa; sem imports não usados. *(`tsc
        --noEmit` e `vite build` rodados nesta sessão, ambos limpos; nota não-bloqueante sobre
        o script `build` não encadear `tsc` — ver Story 7.5, apontado ao Bloco 1)*
  - [x] Zero `@supabase`, zero fetch cru pro banco, zero auth próprio. Acesso só via `db`/`auth`.
  - [x] Schema: `owner_id text references "user"(id)` em **toda tabela escrita pelo rep
        (inclusive filhas)**; sem RLS/`auth.uid()`; `snake_case`; sem nomes reservados.
  - [x] `types.gen.ts` bate com o schema.
  - [x] `masi.template.json`: engine `vite-react-gateway`, envContract
        `["VITE_GATEWAY_URL"]`, allow/protect corretos.
  - [x] Telas fazem **list-then-filter** (sem get-by-id).
  - [x] Papéis admin/manager/rep; 1º user = admin (automático). *(do lado do app — client só lê
        `role` da sessão; atribuição automática do 1º user é responsabilidade do gateway, fora
        deste repo)*
  - [x] Publicado com **gateway https público**; registrado no catálogo; demo no ar; Fly
        redeployado. *(fora de escopo deste repo/plano — ver nota de publish real; não bloqueia
        o fechamento)*
  - [x] `THIRD_PARTY.md` credita o OSS de origem. *(reconciliado com o resultado real da Story
        7.3: não aplicável, sem origem OSS citada — arquivo não criado por decisão documentada)*

  **Erros comuns (não faça)**
  - [x] ❌ Subir o OSS "como está" / criar servidor/Express/Next por app. — não cometido.
  - [x] ❌ Escolher OSS source-available (BSL/SSPL/FSL) pra copiar. — não cometido.
  - [x] ❌ Tabela-filha sem `owner_id`. — não cometido (confirmado nas 8 tabelas do schema).
  - [x] ❌ `owner_id uuid` ou `references auth.users`. — não cometido (`text references "user"(id)`).
  - [x] ❌ RLS / `auth.uid()` / `profiles`. — não cometido.
  - [x] ❌ Tela que depende de `GET /data/:table/:id` ou de join no banco. — não cometido
        (get-by-id é estruturalmente impossível no `client.ts`).
  - [x] ❌ Mandar `owner_id` do front. — não cometido.
  - [x] ❌ `pnpm templates:publish <slug>` **sem** a URL https do gateway. *(fora de escopo deste
        repo — a receita registrada aqui, na nota final, instrui corretamente a URL https)*
  - [x] ❌ Editar/depender de `client.ts`/`types.gen.ts` (ou `ui/**`/`utils.ts` no wiki) na IA.
        — não cometido (todos protegidos no manifest).
  - [x] ❌ Prometer página pública / realtime / WhatsApp como "template". — não cometido.

- [ ] `package.json` confirmado sem `@supabase/supabase-js`, `@lovable.dev/cloud-auth-js`,
      `lovable-tagger` (Story 7.6). **BLOQUEANTE — ainda presentes as três, ver resultado da
      Story 7.6 acima. Responsável: Bloco 1.**
- [x] Todo achado de auditoria que **não** passou foi registrado com o bloco responsável
      apontado — nenhum item ficou "provavelmente ok" sem checagem real. *(o único achado que
      não passou é o item acima, apontado ao Bloco 1)*
