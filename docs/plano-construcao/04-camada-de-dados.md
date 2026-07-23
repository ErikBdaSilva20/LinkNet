# Bloco 4 — Camada de Dados / Repos

## Objetivo

Eliminar toda dependência de `@supabase/supabase-js` do app e substituí-la pela
fundação MasIA: um objeto `db` genérico (`src/lib/data/client.ts`, protegido) que fala
com o `tenant-gateway` via `/data/:table`, tipos gerados (`src/lib/data/types.gen.ts`,
protegido) e um repo por tabela (`src/lib/data/*.repo.ts`, editável). Todos os 9 hooks
de `src/hooks/` (`useProfile`, `usePages`, `useLinks`, `useLeads`, `useTheme`,
`useIntegrations`, `useAnalytics`, `useShortLinks`, `usePublicProfile`) passam a
consumir esses repos em vez de `supabase.from(...)`/`supabase.storage.*`, mantendo a
forma de retorno o mais parecida possível para não obrigar reescrever as telas agora
(isso é trabalho do Bloco 5). `src/contexts/ActivePageContext.tsx` para de depender do
Supabase. Uploads de imagem (avatar, ícone/thumbnail de link, capa de tema) deixam de
usar `supabase.storage.*` e passam a virar `data:` URI comprimido, gerado por um novo
helper `src/lib/image.ts`.

## Por que este bloco existe

Hoje **toda** a camada de dados (`src/integrations/supabase/client.ts` +
`src/integrations/supabase/types.ts`) fala direto com Supabase: `.select()`, `.eq()`,
`.insert()`, `.update()`, `.delete()`, `.storage.from(...).upload/getPublicUrl`, e até
`supabase.auth.getUser()` dentro de `usePages.ts`. Isso é exatamente o que o
`Importantdoc.md` proíbe (§B3: "Proibido: ... Supabase"; §B1: "nunca usa
Supabase/Firebase"). Sem este bloco nenhum outro bloco consegue rodar: o Bloco 5
(telas) importa dos hooks que este bloco reescreve; o Bloco 3 (auth) precisa que o
`client.ts` já exista para o app parar de chamar `supabase.auth.*`; o Bloco 7
(manifest) declara `src/lib/data/*.repo.ts` como `editable.allow` e `client.ts`/
`types.gen.ts` como `protect` — arquivos que só existem depois deste bloco.

## Depende de / Habilita

- **Depende de:** Bloco 2 (schema/migration — `types.gen.ts` deve bater com as tabelas
  reais criadas no Neon; se o Bloco 2 ainda não tem arquivo, siga em frente com a lista
  de tabelas conhecida hoje e ajuste depois, sem bloquear este bloco).
- **Espera implicitamente (mas não bloqueia):** Bloco 3 (auth) — quem implementa
  `auth.signIn/signUp/signOut`/sessão e garante que o cookie de sessão exista para o
  `credentials: 'include'` do `client.ts` funcionar. Este bloco só **consome** isso, não
  implementa.
- **Habilita:** Bloco 5 (telas — `src/pages/**` → `src/screens/**` passam a importar os
  hooks já reescritos, sem tocar em `supabase`), Bloco 6 (página pública/agendamento de
  link — consome o hook `usePublicProfile` e a decisão de filtro client-side descrita
  abaixo), Bloco 7 (manifest — lista `protect`/`allow` que só faz sentido com estes
  arquivos existindo).

> **Correção pós-sincronização (leia antes da Story 4.3):** este arquivo foi escrito em paralelo
> ao Bloco 2 e assumia que `profiles` sobrevive como tabela própria 1:1. O Bloco 2
> (`02-schema-migracao.md`, Decisão 1) **eliminou `profiles`**: todo campo de identidade
> (`handle`, `display_name`, `bio`, `avatar_url`, `is_public`) virou coluna de `pages`, com
> `owner_id` direto (sem indireção `profile_id`). A Story 4.3 abaixo e o DoD já refletem essa
> correção — se você tiver uma cópia antiga deste arquivo na cabeça, descarte a ideia de
> `profiles.repo.ts`.

## Decisões já tomadas (não reabrir)

- **Imagens viram `data:` URI base64** salvas direto na coluna de texto
  (`avatar_url`, `thumbnail_url`, `custom_background_url`), comprimidas/redimensionadas
  no client (resize ~128–256px, reencode WebP/JPEG qualidade baixa, poucas dezenas de
  KB) **antes** de chamar `create`/`update`. Isso substitui **toda** chamada a
  `supabase.storage.*` hoje em `useLinks.ts` (`uploadThumbnail`, bucket `thumbnails`),
  `useProfile.ts` (`uploadAvatar`, bucket `avatars`) e `useTheme.ts`
  (`uploadBackground`, bucket `backgrounds`).
- **`digital_products`/`orders` cortados** — sem repo, sem hook, sem tela para eles
  (mesmo existindo em `src/integrations/supabase/types.ts` hoje).
- **Agendamento de link é 100% client-side.** As colunas `schedule_enabled`/
  `starts_at`/`ends_at` continuam existindo. O repo de `links` devolve **todos** os
  links (ativos ou não, dentro da janela ou não) via `list()` simples — sem filtro. A
  decisão de "está na janela de tempo" é responsabilidade de quem consome:
  - No hook interno (`useLinks`, usado no painel autenticado), **não filtramos** —
    o dono precisa ver e editar até os links fora da janela ou desativados.
  - No consumo público (`usePublicProfile`, usado pelo Bloco 6), o **hook filtra**
    antes de devolver `links`, reproduzindo a lógica que já existe hoje em
    `usePublicProfile.ts` linhas 96-108 (`schedule_enabled` + `starts_at`/`ends_at`
    comparados com `new Date()`). Justificativa: é exatamente o que o código atual já
    faz como camada extra de segurança "client-side as well" (o comentário original já
    diz isso, pois hoje quem faz a filtragem de verdade é a RLS/função
    `is_link_scheduled_active` do Postgres, que deixa de existir). Concentrar esse
    filtro dentro do hook público evita duplicar a lógica em cada tela que usa
    `usePublicProfile` (Bloco 5/6).
- **`custom_head_html` cortado do schema/tipos.** `types.gen.ts` e
  `integrations.repo.ts` só expõem `google_analytics_measurement_id`, `meta_pixel_id`,
  `utm_source`, `utm_medium`, `utm_campaign`. `useIntegrations.ts` para de aceitar/
  validar/salvar `custom_head_html` (hoje presente em `IntegrationsData`,
  `IntegrationsUpdateInput` e no `cleanedUpdates` do `saveMutation`).
- **Sem `GET /data/:table/:id`, sem filtro server-side, sem joins.** Todo repo só tem
  `list/create/update/remove`. Qualquer tela/hook que hoje resolve "1 registro por
  id/slug/handle" direto no banco (ex.: `usePublicProfile.ts` filtrando por
  `.eq("handle", handle)`, `usePages.ts` checando slug único com `.eq("slug", slug)`)
  passa a fazer **list-then-find no client**.
- **`owner_id` nunca é enviado pelo front.** Removido de todo `create`/`update` nos
  repos e hooks — o gateway seta a partir da sessão. Isso também mata a checagem de
  ownership manual que `usePages.ts` faz hoje (linhas 54-67: `supabase.auth.getUser()`
  + `.from("profiles").select("id").eq("user_id", user.id).eq("id", profileId).single()`
  antes de criar página) — essa verificação já é feita pelo gateway, então é removida,
  não reescrita.

## Regras obrigatórias (Importantdoc.md)

- **§B1/§B3:** o app só fala com o gateway via `db`/`auth`. Zero `@supabase`, zero
  fetch cru pro banco, zero driver SQL no browser.
- **§B5 (API `db`):** `db.table(name).list()/.create(input)/.update(id, patch)/
  .remove(id)` — é tudo que existe. `client.ts` lê config de `?gw=&t=` **ou**
  `import.meta.env.VITE_*` **ou** dos globais de runtime `window.__MASI_GW__` /
  `window.__MASI_TENANT__`, tem branch de **PREVIEW** (`window.__MASI_PREVIEW__`) com
  fixtures para o Sandpack, manda `credentials: 'include'` + header `X-Tenant-Id`.
- **§B5 limites do modo genérico:** sem get-by-id, sem filtro por query, sem joins —
  tudo list-then-find/filter no front.
- **§B6:** página pública sem login **não** passa por `/data/:table` (exige sessão).
  Já existem rotas públicas prontas no gateway para este domínio (LinkHub):
  `GET /public/profile`, `GET /public/links`, `POST /public/links/:id/click`. O hook
  `usePublicProfile` deve consumi-las via `fetch` direto (não via `db.table`), não
  redesenhar essas rotas (isso seria alterar o gateway, fora do escopo deste bloco).
- **§B7:** `client.ts`/`types.gen.ts` sempre em `protect`; `*.repo.ts` sempre em
  `allow`. Este bloco entrega os arquivos; a entrada no manifesto é do Bloco 7.
- **Erros comuns do guia que este bloco existe pra evitar:** tela dependente de
  `GET /data/:table/:id` ou join no banco; mandar `owner_id` do front; editar
  `client.ts`/`types.gen.ts` fora do processo protegido.

## Boas práticas obrigatórias neste bloco

1. **Repo é função pura, sem lógica de UI.** Um `*.repo.ts` só chama
   `db.table('<tabela>').list/create/update/remove` (mais, no caso de
   `public.repo.ts`, `fetch` cru para as rotas `/public/*`). Nada de `toast`,
   `useQueryClient`, `useState` dentro de um repo.
2. **Hook não sabe que existe gateway.** O hook chama o repo (`import { listLinks }
   from '@/lib/data/links.repo'`) e nunca `db.table(...)` diretamente nem monta a URL
   do gateway. Só `client.ts` e os `*.repo.ts` sabem que `/data/:table` existe.
3. **Nunca duplicar shape de dado entre repo e tela.** O tipo `Row` de cada tabela vem
   de `types.gen.ts` (`Database['public']['Tables']['<tabela>']['Row']`) e é
   re-exportado pelo repo (ex.: `export type Link = Database['public']['Tables']
   ['links']['Row']`) — a tela importa o tipo do repo/hook, nunca redefine campos.
4. **Tratamento de erro consistente.** `db.table(...).list/create/update/remove`
   rejeita a Promise em erro HTTP (ver `client.ts`); os hooks continuam usando
   `useMutation`/`useQuery` do React Query exatamente como hoje — `onError` chama
   `toast({ variant: "destructive", ... })`, preservando as mensagens em PT-BR que já
   existem. Não introduzir um segundo padrão de erro (ex.: `try/catch` silencioso) só
   porque a fonte de dado mudou.
5. **List-then-find é local ao hook, não ao repo.** O repo devolve sempre a lista
   crua (`list()`); é o hook (ou, quando fizer sentido, um helper exportado ao lado do
   hook) que faz `.find(...)`/`.filter(...)`. Isso mantém o repo reaproveitável e
   testável isoladamente.
6. **Nunca reintroduzir `owner_id`/`user_id`/`profile_id` como filtro de segurança no
   client.** Onde o código antigo usava `.eq("user_id", user.id)` ou similar como
   controle de acesso, a visibilidade já vem garantida pelo gateway (rep só vê o que é
   seu). O client só usa esses campos, quando ainda existirem no schema, como
   **FK organizacional** (ex.: `pages.profile_id` para agrupar página↔perfil), nunca
   como cinturão de segurança.
7. **Imagem grande nunca vira `Partial<Row>` sem passar pelo helper de compressão.**
   Todo caminho de código que hoje faz `supabase.storage.from(...).upload(file, ...)`
   passa a: `await encodeImageToDataUrl(file, { maxDim, quality })` → resultado vira o
   valor da coluna (`avatar_url`, `thumbnail_url`, `custom_background_url`) num
   `update`/`create` normal do repo.

## Stories

### Story 4.1 — `client.ts` + `types.gen.ts` protegidos e remoção do Supabase

> **Executada antecipadamente durante o Bloco 3 (2026-07-23).** O plano original tinha uma
> dependência circular: `03-auth.md` precisava de `src/lib/data/client.ts` (pra importar `auth`),
> mas esse arquivo só seria criado aqui, no Bloco 4, que vem depois na ordem. Resolvido puxando a
> criação de `client.ts`/`types.gen.ts`/`preview-fixtures.ts` pra antes das stories de auth. Os
> três arquivos já existem no repo. **O que falta desta story**, portanto, é só a parte de
> **remoção do Supabase** (`src/integrations/supabase/**`) — que continua sendo trabalho deste
> bloco, não do 3, porque os hooks de dados que ainda a usam (`useProfile.ts`, `usePages.ts`,
> etc.) só são reescritos aqui.

- **Arquivos afetados:** criar `src/lib/data/client.ts`, criar
  `src/lib/data/types.gen.ts`; deletar `src/integrations/supabase/client.ts`,
  `src/integrations/supabase/types.ts` e qualquer outro arquivo dentro de
  `src/integrations/supabase/**`.
- **O que fazer:**
  - Implementar `db` conforme §B5: `db.table<R>(name).list()/.create(input)/
    .update(id, patch)/.remove(id)`, todos batendo em `/data/:table` (`GET/POST/PATCH/
    DELETE`).
  - Resolver a configuração de gateway/tenant nesta ordem: query string `?gw=&t=` →
    `import.meta.env.VITE_GATEWAY_URL` (substituindo hoje
    `import.meta.env.VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`, que somem) →
    globais de runtime `window.__MASI_GW__`/`window.__MASI_TENANT__`.
  - Implementar o branch de **PREVIEW** (`window.__MASI_PREVIEW__`) com fixtures, para
    o editor Sandpack conseguir rodar o app sem gateway real.
  - Toda chamada usa `credentials: 'include'` e manda o header `X-Tenant-Id`.
  - `types.gen.ts`: gerar `Database['public']['Tables']` para as tabelas confirmadas
    hoje — `pages` (fusão de `profiles`+`pages`, ver Bloco 2 Decisão 1), `links`, `leads`,
    `short_links`, `integrations`, `themes`, `page_views`, `link_clicks` — refletindo o schema real definido pelo
    Bloco 2 (não redesenhar o schema aqui; se o Bloco 2 ainda não existe, usar como
    ponto de partida os campos hoje presentes em
    `src/integrations/supabase/types.ts`, **removendo** `custom_head_html` de
    `integrations` e **removendo** as tabelas `digital_products`/`orders` por inteiro,
    e ajustando `owner_id`/`user_id` conforme a convenção `text references "user"(id)`
    do §B4 assim que o Bloco 2 confirmar o nome da coluna). Manter também `Enums`
    (`background_type`, `link_type`, `thumbnail_type` — `button_style_type` e
    `order_status` só se ainda fizerem sentido) e `Constants` no mesmo formato do
    arquivo gerado hoje, para não quebrar imports como `Enums<"thumbnail_type">`
    usados em `useLinks.ts`.
  - Apagar `src/integrations/supabase/` inteiro só depois que nenhum outro arquivo do
    repo importar de lá (ver critério de aceite).
- **Critério de aceite:**
  - [x] `client.ts`/`types.gen.ts`/`preview-fixtures.ts` criados (antecipados no Bloco 3).
  - [x] `db.table('links').list()` retorna `Promise<Link[]>`; `.create()`/`.update()`/`.remove()`
        sem `owner_id` funcionam (tipagem não exige o campo).
  - [ ] `grep -r "@/integrations/supabase" src/` **ainda não está limpo** — 4 telas
        (`LinksPage.tsx`, `DesignPage.tsx`, `PublicProfile.tsx`, `MobilePreview.tsx`) continuam
        importando de lá. **Isso é esperado**: são telas, fora do escopo deste bloco (Bloco 5/6).
        `src/data/curatedThemes.ts` (não era tela, estava na minha alçada) foi corrigido aqui —
        trocado pra `@/lib/data/types.gen`. **`src/integrations/supabase/` NÃO foi apagado** —
        fica como pendência explícita para o Bloco 5/6 apagarem quando essas 4 telas pararem de
        importar de lá (ver DoD).
- **Fora de escopo:** implementar o gateway em si; implementar `auth` (Bloco 3);
  decidir o schema definitivo (Bloco 2) — aqui só se materializa o tipo.

### Story 4.2 — Helper de imagem (`src/lib/image.ts`)

- **Arquivos afetados:** criar `src/lib/image.ts`.
- **O que fazer:** expor uma função (ex.: `encodeImageToDataUrl(file: File, opts?: {
  maxDim?: number; quality?: number; mimeType?: 'image/webp' | 'image/jpeg' })
  : Promise<string>`) que: carrega o `File` num `<img>`/`createImageBitmap`,
  redimensiona mantendo proporção para caber num quadrado de `maxDim` (default
  ~256px para avatar/thumbnail, pode aceitar um `maxDim` menor para ícones pequenos),
  desenha num `<canvas>`, e serializa via `canvas.toDataURL(mimeType, quality)`
  (default `image/webp`, quality baixa o suficiente para o resultado final ficar na
  casa de poucas dezenas de KB — validar com `console.warn`/erro se passar de um teto
  de tamanho definido, ex. 100KB, para não estourar a coluna). Deve tratar o caso do
  navegador não suportar WebP (fallback para `image/jpeg`).
- **Critério de aceite:** [x] `src/lib/image.ts` criado — `encodeImageToDataUrl` pura, sem
  dependência de React, com fallback WebP→JPEG e warning de tamanho acima de 100KB.
- **Fora de escopo:** UI de crop/preview (isso é Bloco 5 — a tela decide como mostrar
  o preview antes/depois de chamar o helper).

### Story 4.3 — Repo + hook de páginas (identidade fundida em `pages`, sem `profiles`)

> Reescrita à luz de `02-schema-migracao.md` Decisão 1: `profiles` **não existe** no schema
> novo. Handle, `display_name`, `bio`, `avatar_url`, `is_public` são colunas de `pages`, com
> `owner_id` direto (sem indireção via `profile_id`). Um `owner_id` pode ter N `pages`, cada
> uma autônoma e endereçável pelo próprio `handle`.

- **Arquivos afetados:** criar `src/lib/data/pages.repo.ts`; reescrever
  `src/hooks/usePages.ts` (absorve as responsabilidades de identidade que hoje ficam em
  `useProfile.ts`), `src/contexts/ActivePageContext.tsx`; aposentar `src/hooks/useProfile.ts`
  como arquivo de tabela própria (vira, no máximo, um fino wrapper de conveniência em cima de
  `usePages.ts` — decisão de organização, não de dado).
- **O que fazer:**
  - `pages.repo.ts`: `listPages`, `createPage`, `updatePage`, `removePage` sobre
    `db.table('pages')` — cobre tanto os campos que hoje são "de perfil" (`handle`,
    `display_name`, `bio`, `avatar_url`, `is_public`) quanto os que já eram "de página"
    (`title`, `description`, `og_image_url`, `custom_domain`, config de lead form).
  - `ActivePageContext.tsx`: hoje busca `profiles` via `.eq("user_id", user.id)
    .maybeSingle()` (linha 34-38) e `pages` via `.eq("profile_id", profile.id)`
    (linha 50-54) — os dois passos **somem**, viram uma chamada só: `listPages()`. Como o
    gateway já só devolve as `pages` do próprio dono, não há filtro adicional de posse a
    fazer no client. A seleção de página ativa dentro da lista (`pages.find((p) => p.id
    === activePageId) || pages[0] || null`) continua exatamente igual — já era
    list-then-find correto. Remover completamente qualquer conceito de "profile" como
    registro separado do contexto.
  - `usePages.ts`: absorve o que hoje é `useProfile.ts` — editar `handle`/`display_name`/
    `bio`/`avatar_url`/`is_public` é só mais um `updatePage(page.id, updates)`, na mesma
    tabela/mutação que já edita `title`/`description`/etc. A função `checkHandleUniqueness`
    (hoje em `useProfile.ts`, linha 33-47, fazendo `.eq("handle", handle).neq("user_id",
    user.id)` server-side) continua **não sendo reproduzível** via `db.table('pages').list()`
    — o gateway só devolve as `pages` do próprio usuário logado, nunca as de outro. Reaproveitar
    a rota pública já existente `GET /public/profile` (agora resolvendo por `handle` direto em
    `pages`, sem a indireção de perfil — §B6, mesma que `usePublicProfile`/Story 4.9 usa) fazendo
    uma checagem "existe uma page pública com esse handle?" — se a rota devolver 404/null, o
    handle está livre; se pertencer à própria `page` sendo editada, tratar como disponível.
    Documentar esse acoplamento (checagem de unicidade depende de uma rota pensada para outra
    finalidade) como decisão consciente, não acidente.
  - `uploadAvatar` (hoje em `useProfile.ts`, linha 78-102) some inteiro como fluxo à parte:
    vira `encodeImageToDataUrl(file, { maxDim: 256 })` (Story 4.2) seguido de
    `updatePage(page.id, { avatar_url: dataUrl })` — mesma mutação de `usePages.ts`, sem hook
    próprio.
  - Remover a checagem de ownership manual de `usePages.ts` (linhas 54-67 do original,
    `supabase.auth.getUser()` + query em `profiles` antes de criar página) — o gateway já
    garante isso. `createPageMutation` passa a chamar `createPage({ handle, display_name,
    title, description, ... })` uma vez só — sem o passo de "insert então select de novo
    para achar o registro criado" (linhas 69-89 do original), já que `db.table('pages')
    .create()` devolve o registro criado direto (`R`, não `void`). Mesma simplificação para
    `themes`/`integrations` default: `createTheme({ page_id: newPage.id })` e
    `createIntegration({ page_id: newPage.id })` (repos das Stories 4.5/4.6) chamados em
    sequência; se algum falhar, chamar `removePage(newPage.id)` como rollback manual (melhor
    esforço no client, sem transação real). `deletePageMutation` remove os
    `.delete().eq("page_id", ...)` em cascata (linhas 149-151 do original) chamando os repos
    de `links`/`themes`/`integrations` em vez de `supabase.from(...)`.
  - **Lazy-create da primeira `page`:** como `handle_new_user` (trigger em `auth.users`) não
    existe mais no Neon (ver tabela de descarte do Bloco 2), o primeiro login de um usuário
    sem nenhuma `page` precisa de um substituto no app-layer: se `listPages()` vier vazia,
    criar a primeira `page` (com `handle` provisório derivado do e-mail/nome, mais
    `theme`/`integration` default) antes de deixar o dashboard renderizar. Isso é responsabilidade
    deste hook (`usePages`/`ActivePageContext`), não do Bloco 3 (auth).
- **Critério de aceite:** não existe `src/lib/data/profiles.repo.ts`, nem tabela `profiles`
  referenciada em nenhum tipo/repo; `ActivePageContext` expõe `pageId`, `page`, `pages`,
  `isLoading`, `setActivePage` sem qualquer conceito de "profile" separado, sem importar
  `supabase`; criar/editar/excluir página (incluindo os campos de identidade) funciona via
  `pages.repo.ts`; usuário novo sem `page` nenhuma recebe uma criada automaticamente no primeiro
  acesso ao dashboard; unicidade de handle documentada com a estratégia de rota pública escolhida.
- **Fora de escopo:** decidir se o schema permite múltiplas `pages` por `owner_id` (já decidido
  pelo Bloco 2 que sim — aqui só se implementa); UI de onde cada campo de identidade aparece na
  tela (Bloco 5).

**[x] Concluída em 2026-07-23.** `pages.repo.ts`, `usePages.ts` (absorve identidade),
`ActivePageContext.tsx` (sem conceito de profile), `useProfile.ts` (wrapper fino de
compatibilidade pros 6 consumidores de tela que ainda esperam essa interface). `public.repo.ts`
também adiantado aqui (não só no Bloco 3) — precisava dele pra `isHandleAvailable`. Reserva de
handles ajustada pra `["app","login","register","l"]` (rotas de topo reais de `App.tsx`), regex
alinhado ao check constraint do schema (`^[a-z0-9_]{3,20}$`, sublinhado não hífen).

### Story 4.4 — Repo + hook de links e links curtos

- **Arquivos afetados:** criar `src/lib/data/links.repo.ts`,
  `src/lib/data/short_links.repo.ts`, `src/lib/data/link_clicks.repo.ts` (leitura, para
  contagem de cliques); reescrever `src/hooks/useLinks.ts`,
  `src/hooks/useShortLinks.ts`.
- **O que fazer:**
  - `links.repo.ts`: `listLinks`, `createLink`, `updateLink`, `removeLink` sobre
    `db.table('links')`.
  - `useLinks.ts`: a query de links hoje filtra por `.eq("page_id", pageId).order
    ("position", ...)` (linha 50-54) — vira `listLinks()` + `.filter(l => l.page_id ===
    pageId)` + `.sort((a,b) => a.position - b.position)` no client (ordenação também
    sai do servidor). A contagem de cliques (linha 71-74,
    `.from("link_clicks").select("link_id").in("link_id", linkIds)`) vira
    `listLinkClicks()` (repo novo, tabela sem escrita client-side pelo app — só
    leitura) + `.filter` no client por `linkIds`. `createLinkMutation` reproduz o
    "shift de posição" (linhas 93-106, um `update` por link existente, um por vez —
    **mantém-se o padrão de loop sequencial**, já que não há batch no modo genérico)
    seguido de `createLink({ page_id, ..., position: 0 })`. `reorderLinksMutation`
    mantém o loop de `updateLink(id, { position })` por item (linhas 199-205, já era
    sequencial). Todo o resto (optimistic update via `queryClient.setQueryData`,
    rollback em `onError`) permanece igual — é lógica de React Query, não de dado.
  - `uploadThumbnail` (linha 238-262) vira `encodeImageToDataUrl(file, { maxDim: 128 })`
    → `updateLink(linkId, { thumbnail_url: dataUrl })`.
  - `short_links.repo.ts`: `listShortLinks`, `createShortLink`, `removeShortLink`.
  - `useShortLinks.ts`: troca `.eq("page_id", pageId)` (linha 53-57) por
    `listShortLinks()` + filtro client-side; `generateUniqueSlug` (linha 94-116) hoje
    faz `.eq("slug", slug).single()` para checar colisão **globalmente** — no modo
    genérico só vemos os próprios short_links, então a checagem de colisão vira
    "colide com um dos meus próprios slugs" (list-then-find local), aceitando que
    colisão entre tenants diferentes é impossível (bancos Neon isolados por tenant) e
    que colisão entre usuários do **mesmo** tenant que não seja o dono é um risco
    residual — documentar como limitação conhecida (baixo risco: slug é
    base62 de 8 chars aleatório, chance de colisão é desprezível; e o
    `POST /data/short_links` continua podendo rejeitar por unique constraint do banco,
    que o hook trata como erro — ver `error.code === "23505"` linha 157-158, adaptar
    para o formato de erro que `client.ts` propagar).
- **Critério de aceite:** `useLinks`/`useShortLinks` continuam expondo a mesma forma
  de retorno (mesmos nomes de campo: `links`, `clickCounts`, `createLink`,
  `updateLink`, `deleteLink`, `reorderLinks`, `uploadThumbnail`, etc.); nenhum import
  de `supabase` restante nesses dois arquivos.
- **Fora de escopo:** mudar a UX de reordenar/upload nas telas (Bloco 5).

**[x] Concluída em 2026-07-23.** `links.repo.ts`, `short_links.repo.ts`, `link_clicks.repo.ts`
(só leitura), `useLinks.ts`/`useShortLinks.ts` reescritos. Corrigido de brinde: `useShortLinks`
tinha um bug de tipo pré-existente (`link.url` `string|null` atribuído a `string|undefined`) —
virou `link?.url` (narrowing), resolvido dentro do mesmo arquivo que já estava sendo tocado.

### Story 4.5 — Repo + hook de tema

- **Arquivos afetados:** criar `src/lib/data/themes.repo.ts`; reescrever
  `src/hooks/useTheme.ts`.
- **O que fazer:** `themes.repo.ts`: `listThemes`, `createTheme`, `updateTheme` sobre
  `db.table('themes')` (sem `remove` se a tela nunca excluir tema isoladamente — o
  hoje não expõe delete, então repo pode omitir `removeTheme` ou incluí-lo por
  completude; decisão livre, mas justifique no código). `useTheme.ts`: a query hoje
  filtra por `.eq("page_id", pageId).maybeSingle()` (linha 118-122) — vira
  `listThemes()` + `.find(t => t.page_id === pageId)`. `saveMutation` hoje decide
  `update` vs `insert` conforme `theme?.id` existir (linhas 135-150) — mantém a mesma
  ramificação, trocando por `updateTheme(theme.id, updates)`/`createTheme({ page_id,
  ...updates })`. `uploadBackground` (linha 167-194, bucket `backgrounds`) vira
  `encodeImageToDataUrl(file, { maxDim: 1080, quality mais alta que avatar/ícone pois é
  plano de fundo })` → resultado salvo em `custom_background_url` via `updateTheme`.
- **Critério de aceite:** `useTheme` mantém `theme`, `isLoading`, `saveTheme`,
  `isSaving`, `uploadBackground` com a mesma assinatura; `THEME_PRESETS`,
  `FONT_OPTIONS`, `BUTTON_STYLES`, `GRADIENT_PRESETS`, `getFontFamily`,
  `getButtonRadius` (constantes/funções puras, sem Supabase) permanecem inalteradas.
- **Fora de escopo:** revisar os presets de tema em si.

**[x] Concluída em 2026-07-23.** `themes.repo.ts`, `useTheme.ts` reescrito; presets/constantes
inalterados.

### Story 4.6 — Repo + hook de integrações (analytics de terceiros/UTM)

- **Arquivos afetados:** criar `src/lib/data/integrations.repo.ts`; reescrever
  `src/hooks/useIntegrations.ts`.
- **O que fazer:** `integrations.repo.ts`: `listIntegrations`, `createIntegration`,
  `updateIntegration` sobre `db.table('integrations')`, com o tipo `Row` **sem**
  `custom_head_html` (decisão travada). `useIntegrations.ts`: query hoje filtra por
  `.eq("page_id", pageId).maybeSingle()` (linha 57-61) — vira `listIntegrations()` +
  `.find`. `saveMutation` remove `custom_head_html` de `IntegrationsData`,
  `IntegrationsUpdateInput` e do objeto `cleanedUpdates` (linhas 21-40, 74-82) — os
   4 campos restantes (`google_analytics_measurement_id`, `meta_pixel_id`,
  `utm_source`, `utm_medium`, `utm_campaign`) mantêm a mesma validação
  (`isValidGaId`/`isValidPixelId`, `GA_REGEX`/`PIXEL_REGEX` inalterados) e a mesma
  ramificação update/insert conforme `integrations?.id`. `applyUtmToUrl`/
  `hasUtmTemplate` (lógica pura) permanecem inalterados.
- **Critério de aceite:** `useIntegrations` mantém a mesma forma de retorno menos
  `custom_head_html`; qualquer consumidor de `custom_head_html` (ex.:
  `IntegrationScripts`/`PublicProfile.tsx` linha 157) precisa parar de referenciá-lo —
  **apontar isso para o Bloco 5** como item de acompanhamento (o componente
  `IntegrationScripts` recebe `customHeadHtml={integrations?.custom_head_html}` hoje;
  esse prop deixa de existir na fonte, e ajustar o componente é tela, fora daqui, mas
  o repo deste bloco é a razão da quebra e deve ser sinalizado).
- **Fora de escopo:** remover o prop de `IntegrationScripts` (Bloco 5).

**[x] Concluída em 2026-07-23.** `integrations.repo.ts`, `useIntegrations.ts` reescrito, sem
`custom_head_html` em nenhum tipo/lógica. Consumidores (`PublicProfile.tsx`) ainda quebram
(esperado, Bloco 5/6 ajusta).

### Story 4.7 — Repo + hook de leads

- **Arquivos afetados:** criar `src/lib/data/leads.repo.ts`; reescrever
  `src/hooks/useLeads.ts`.
- **O que fazer:** `leads.repo.ts`: `listLeads`, `removeLead` sobre
  `db.table('leads')` (sem `createLead` no repo autenticado — ver ressalva abaixo).
  `useLeads.ts`: query hoje filtra por `.eq("page_id", pageId).order("created_at",
  {ascending:false})` (linha 17-21) — vira `listLeads()` + `.filter` por `pageId` +
  `.sort` por `created_at` desc no client. `deleteMutation` vira `removeLead(leadId)`.
  `exportCSV` é lógica 100% client-side (Blob/CSV) — permanece idêntica, sem tocar em
  dado remoto.
- **Ressalva importante (documentar, não resolver aqui):** a captura de lead em si
  hoje **não passa** por `supabase.from("leads").insert(...)` — o formulário público
  (`src/components/LeadCaptureForm.tsx`, linha 101-108) chama uma **edge function**
  (`POST {VITE_SUPABASE_URL}/functions/v1/capture-lead`) porque é escrita **anônima**
  (visitante sem sessão). O `Importantdoc.md` §B6 lista, para este domínio (LinkHub),
  só três rotas públicas já existentes no gateway: `GET /public/profile`,
  `GET /public/links`, `POST /public/links/:id/click`. **Não há hoje uma rota pública
  de captura de lead documentada.** Isso é uma lacuna real: sem ela, o formulário de
  captura de lead da página pública não tem para onde escrever. Este bloco **não** cria
  essa rota (seria mexer no gateway, fora de escopo) — a story aqui só cobre o repo/
  hook do painel autenticado (listar/excluir/exportar os leads já capturados). Marcar
  explicitamente como **item a alinhar com o dono do gateway antes do Bloco 6/5
  liberarem a captura de lead em produção** (equivalente ao aviso do próprio guia:
  "página pública sem login... precisa de rota explícita no gateway... alinhe com o
  dono do gateway").
- **Critério de aceite:** `useLeads` mantém `leads`, `isLoading`, `error`, `deleteLead`,
  `isDeleting`, `exportCSV`, `totalLeads`; a lacuna da rota de captura pública está
  escrita em algum lugar visível (este documento cobre; se o projeto tiver um backlog/
  issue tracker, replicar lá também) para não ser esquecida silenciosamente.
- **Fora de escopo:** criar a rota `/public/leads` (ou equivalente) no gateway;
  reescrever `LeadCaptureForm.tsx` (Bloco 5, e só depois que a rota existir).

**[x] Concluída em 2026-07-23.** `leads.repo.ts` (sem `createLead`, por design), `useLeads.ts`
reescrito. `custom_fields` agora tipado direto como `Record<string,string>` em `types.gen.ts` —
eliminou o cast manual (`as typeof l & {...}`) que existia no original.

### Story 4.8 — Repo + hook de analytics (page_views/link_clicks) e escalabilidade

- **Arquivos afetados:** criar `src/lib/data/page_views.repo.ts`,
  `src/lib/data/link_clicks.repo.ts` (mesmo arquivo/objeto pode ser compartilhado com a
  Story 4.4 se preferir um único `link_clicks.repo.ts`); reescrever
  `src/hooks/useAnalytics.ts`.
- **O que fazer:** hoje `useAnalytics.ts` faz 4 queries server-side com filtro de data
  e de `link_id`: `page_views` filtrado por `.gte("created_at", ...).lte("created_at",
  ...)` (período atual, linha 154-163, e período anterior, linha 173-182) e
  `link_clicks` filtrado por `.in("link_id", linkIds).gte("clicked_at", ...)
  .lte(...)` (período atual, linha 194-203, e anterior, linha 215-223). Sem filtro
  server-side no modo genérico, os 4 vira **puxar a tabela inteira via `listPageViews
  ()`/`listLinkClicks()` e agregar tudo no client**: filtrar por `page_id`/`link_id`
  pertencente à página ativa, depois por intervalo de data usando `date-fns`
  (`isWithinInterval` ou comparação direta), reaproveitando as funções puras já
  existentes (`aggregateDailyStats`, `aggregateTopLinks`, `aggregateReferrers`,
  `aggregateDevices`, `calculateChange`, linhas 48-132 e 262-269) sem alterá-las — elas
  já recebem arrays já filtrados, então continuam funcionando, só a fonte do array
  muda.
- **Story específica de escalabilidade (obrigatória, não pular):** puxar
  `page_views`/`link_clicks` inteiros via `list()` **degrada conforme o volume
  cresce** — nenhuma paginação nem filtro server-side existe no modo genérico hoje
  (§B5). Para uma página com poucas centenas/milhares de views isso é aceitável (é o
  que o próprio guia assume como padrão para o modo genérico); para uma página popular
  com dezenas de milhares de linhas, cada abertura da aba Analytics baixa a tabela
  inteira do tenant. Mitigação proposta dentro do modo genérico:
  1. **Aceitar o limite e documentar** (opção mínima): manter `list()` simples, cachear
     agressivamente no React Query (`staleTime` alto, ex. 5 min, já que analytics não
     precisa ser real-time) para não repetir o full-scan a cada re-render/troca de
     aba.
  2. **Reduzir o período pedido por padrão** (opção recomendada): a UI (Bloco 5) já
     trabalha com um seletor de período (`startDate`/`endDate`); enquanto não há
     filtro server-side, considerar limitar a comparação de período anterior
     (`previousViews`/`previousClicks`) a ser opcional/sob demanda, já que ela **dobra**
     o volume de dados puxado para o mesmo resultado (2 chamadas com `list()` completo
     em vez de 1, quando poderiam ser 1 chamada e um filtro em memória nos dois
     recortes — **otimização direta**: puxar `page_views`/`link_clicks` **uma única
     vez** por tabela e derivar tanto o período atual quanto o anterior do mesmo array
     em memória, em vez de 2 queries idênticas por tabela como hoje — isso já reduz
     de 4 chamadas de rede para 2, mesmo sem paginação).
  3. **Paginação manual via múltiplas chamadas** só se o modo genérico ganhar suporte
     a isso no futuro (hoje `list()` não aceita parâmetros — não há como pedir
     "página 2"); registrar como limitação conhecida do modo genérico, não como algo
     resolvível dentro deste bloco.
  - Decisão adotada nesta story: implementar a opção 2 (1 fetch por tabela, derivar os
    dois períodos em memória) + `staleTime` alto da opção 1. Isso é uma melhoria real
    de escalabilidade que cabe inteiramente dentro do modo genérico, sem esperar
    extensão de fundação.
- **Critério de aceite:** `useAnalytics` mantém a mesma forma de retorno
  (`AnalyticsData` com `totalViews`, `totalClicks`, `ctr`, `dailyStats`, `topLinks`,
  `topReferrers`, `deviceBreakdown`, `previousTotalViews`, `previousTotalClicks`,
  `previousCtr`); número de chamadas de rede por abertura da tela cai de 4 para 2
  (1 `listPageViews()` + 1 `listLinkClicks()`, com os dois períodos derivados em
  memória); a nota de escalabilidade acima está registrada neste documento.
- **Fora de escopo:** implementar paginação/filtro server-side no gateway (extensão de
  fundação, §A3).

**[x] Concluída em 2026-07-23.** `page_views.repo.ts` (só leitura), `useAnalytics.ts` reescrito
com a opção 2 decidida (1 fetch por tabela, staleTime 5min, dois períodos derivados em memória
via `isWithin` local). De brinde: `TopLink.url` virou `string | null` (batendo com `Link.url`
real), resolvendo o erro de tipo TS2322 que já estava no baseline do Bloco 1.

### Story 4.9 — `usePublicProfile` via rotas públicas do gateway

- **Arquivos afetados:** criar `src/lib/data/public.repo.ts`; reescrever
  `src/hooks/usePublicProfile.ts`.
- **Nota de fusão (Bloco 2 Decisão 1):** como `profiles` e `pages` viraram uma tabela só,
  `/@handle/:pageSlug` (dois níveis) não existe mais — o endereçamento é sempre `/@handle`
  (um parâmetro). Ajuste a assinatura do hook para `usePublicProfile(handle)` (sem
  `pageSlug`) e devolva um único objeto de página (pode manter as chaves `profile`/`page`
  como aliases do mesmo registro só se o Bloco 5 já tiver código dependendo dos dois nomes;
  senão, prefira só `page` para não sugerir duas entidades onde só existe uma).
- **O que fazer:** a página pública (`/@handle`) é acessada **sem
  sessão** — `db.table(...)` (que exige sessão via `/data/:table`) não serve aqui.
  `public.repo.ts` faz `fetch` cru (mesma resolução de `VITE_GATEWAY_URL`/globais de
  runtime que `client.ts` usa, mas **sem** `credentials: 'include'` obrigatório —
  confirmar com o dono do gateway se as rotas `/public/*` esperam ou ignoram cookie)
  contra as três rotas já existentes do §B6: `GET /public/profile` (troca a query hoje
  feita em `usePublicProfile.ts` linha 31-36, `.eq("handle", handle).eq("is_public",
  true)`), `GET /public/links` (troca as linhas 86-92, filtro por `page_id`+
  `is_active`), `POST /public/links/:id/click` (troca o `fetch` avulso para a edge
  function `track-click`, linha 156-166). **Assunção a validar com o dono do
  gateway antes de codar de verdade:** a forma exata dos parâmetros de query
  (`?handle=&page=` vs. path params) e o formato da resposta de `/public/profile` —
  este bloco assume que a resposta já inclui profile+page+links+theme+integrations
  agregados (equivalente ao `PublicProfileData` de hoje), mas se o gateway devolver
  cada recurso separado, `public.repo.ts` precisa compor 2-3 chamadas; ajustar a
  implementação de acordo, sem mudar a assinatura pública do hook.
  Reaproveitar a filtragem de agendamento client-side já existente (linhas 96-108,
  ver "Decisões já tomadas") dentro deste hook. O tracking de pageview
  (hoje via edge function `track-view`, linha 140-151) **não** está nas 3 rotas
  documentadas em §B6 — assumir, até confirmação do dono do gateway, que
  `GET /public/profile` já loga a view como efeito colateral no servidor (elimina a
  necessidade de uma chamada extra); se não for esse o comportamento real, será
  necessário alinhar uma 4ª rota pública — registrar como item aberto, igual à lacuna
  de captura de lead da Story 4.7.
- **Critério de aceite:** `usePublicProfile(handle, pageSlug)` mantém a mesma forma de
  retorno (`profile`, `page`, `links`, `theme`, `integrations`, `isLoading`, `error`,
  `trackClick`); nenhuma chamada a `supabase`/`db.table` dentro deste hook — só
  `public.repo.ts` via `fetch`; a lista de assunções sobre o contrato exato das rotas
  `/public/*` está documentada no código (comentário) e neste plano.
- **Fora de escopo:** implementar/alterar as rotas `/public/*` no gateway; resolver a
  lacuna de tracking de pageview caso a assunção acima esteja errada (voltar para o
  dono do gateway).

**[x] Concluída em 2026-07-23**, com um ajuste de escopo consciente em relação ao texto acima:
`public.repo.ts` devolve `{ page, links, theme, integrations }` **sem** a chave `profile`
separada (Bloco 2 fundiu as duas entidades — não fazia sentido manter os dois nomes apontando
pro mesmo objeto). `usePublicProfile(handle)` também perdeu o segundo parâmetro `pageSlug` (não
existe mais endereçamento de 2 níveis). Tracking de pageview **não foi implementado** — decisão
já tomada em `06-pagina-publica-tracking.md` Story 6.3 (confiar em GA4/Pixel, sem rota própria).
`PublicProfile.tsx` (a tela) ainda quebra por causa dessas mudanças de forma — esperado, é Bloco 5/6.

## Definition of Done do bloco

**Status: concluído em 2026-07-23**, com uma pendência explícita herdada pro Bloco 5/6 (ver abaixo).

- [ ] `src/integrations/supabase/**` **ainda existe** — 4 telas (`LinksPage.tsx`, `DesignPage.tsx`,
      `PublicProfile.tsx`, `MobilePreview.tsx`) continuam importando de lá. Apagar a pasta é
      responsabilidade de quem terminar de migrar essas 4 telas (Bloco 5/6) — não deste bloco,
      já que mexer nelas seria invadir escopo de tela. **Ação para o Bloco 5/6:** depois de
      ajustar essas 4 telas, rodar `grep -r "@/integrations/supabase" src/` de novo e, se vazio,
      apagar `src/integrations/supabase/` — esse é o único passo que sobrou da Story 4.1.
- [x] `grep -r "@supabase/supabase-js"` em `src/hooks/`, `src/lib/`, `src/contexts/` não
      retorna nada (fora das 4 telas acima, que são exceção conhecida).
- [x] `src/lib/data/client.ts` e `src/lib/data/types.gen.ts` existem, seguem §B5, e
      têm branch de PREVIEW funcional (`preview-fixtures.ts`).
- [x] Existe um `*.repo.ts` para cada tabela viva: `pages` (fusão de `profiles`+`pages`,
      Bloco 2 Decisão 1), `links`, `leads`, `short_links`, `integrations`, `themes`,
      `page_views`, `link_clicks`, mais `public.repo.ts` para as rotas anônimas — nenhum
      repo para `profiles`, `digital_products`/`orders`.
- [x] Os hooks (`usePages` — absorvendo o que era `useProfile` —, `useLinks`, `useLeads`,
      `useTheme`, `useIntegrations`, `useAnalytics`, `useShortLinks`, `usePublicProfile`) e
      `ActivePageContext.tsx` importam só de `src/lib/data/*.repo.ts` e
      `src/lib/image.ts` — zero import de Supabase.
- [x] Nenhum repo/hook envia `owner_id` (ou equivalente) em `create`/`update`.
- [x] `src/lib/image.ts` existe e é usado nos 3 pontos de upload de imagem
      (avatar em `usePages.ts`, thumbnail/ícone de link em `useLinks.ts`, capa de tema em
      `useTheme.ts`) — zero chamada a `supabase.storage.*` restante nos hooks.
- [x] A lacuna de rota pública de captura de lead (Story 4.7) e a assunção sobre o
      contrato de `/public/profile` (Story 4.9) estão escritas e visíveis (também já
      refletidas em `06-pagina-publica-tracking.md`).
- [x] `useAnalytics` faz no máximo 2 chamadas de rede (1 por tabela) por abertura, não 4.
- [x] `tsc` compila limpo em todos os arquivos deste bloco (`src/hooks/*.ts`,
      `src/lib/data/*.ts`, `src/lib/auth.tsx`, `src/lib/image.ts`,
      `src/contexts/ActivePageContext.tsx`) — confirmado via grep no output do
      `tsc --noEmit`. Baseline de erros do repo subiu de 24 para 42, mas **só em telas**
      (Bloco 5/6) — é o compilador expondo trabalho real dessas telas (`.slug`/`.preset`
      que não existem mais no schema novo), não regressão deste bloco.
