# Bloco 6 — Página Pública & Tracking

> **Leia primeiro:** `Importantdoc.md` inteiro, com atenção especial a **§B6** (página pública
> sem login). Este bloco também depende do que os Blocos 2, 4 e 5 decidirem sobre schema e
> repos — não precisa reler as conversas que geraram esses blocos, só os arquivos deles
> (`02-schema-migracao.md`, `04-camada-de-dados.md`, `05-telas-rotas.md`) quando existirem.

> **Correção pós-sincronização:** o Bloco 2 (`02-schema-migracao.md`, Decisão 1) fundiu
> `profiles`+`pages` numa tabela só (`pages`, `owner_id` direto). Isso elimina o endereçamento
> de dois níveis (`/:handle/:pageSlug`) — a partir de agora é só `/:handle`. Onde este arquivo
> falar em "profile" e "page" como duas entidades, leia como **o mesmo registro** (a distinção
> só existia por causa da tabela antiga).

## Objetivo

Fazer a página pública (`/:handle`) e o redirect de link curto (`/l/:slug`)
funcionarem **sem Supabase e sem Edge Functions próprias**, consumindo só rotas públicas que **já
existem hoje** no `tenant-gateway` (LinkHub: `/public/profile`, `/public/links`,
`/public/links/:id/click`; Forms: `/public/forms/:id`, `/responses`) e lógica client-side onde o
servidor não é necessário (filtro de agendamento de link). Ao final deste bloco, o diretório
`supabase/functions/` deixa de existir no template.

## Por que este bloco existe

Hoje a página pública é resolvida inteiramente por Supabase: 4 Edge Functions próprias
(`capture-lead`, `track-click`, `track-view`, `resolve-short-link`) fazem as escritas que
exigiriam sessão, e RLS nas tabelas `profiles`/`pages`/`links`/`themes`/`integrations` filtra o
que é visível sem login. Na fundação Masia **não existe backend por app** e **`/data/:table`
exige sessão** — então nada disso pode continuar existindo como está. A única forma de servir a
página pública é via rotas explícitas do gateway (§B6), que segundo o guia **já existem para o
domínio LinkHub** — ou seja, este bloco é (na maior parte) **reuso**, não pedido de extensão nova.

## Depende de / Habilita

- **Depende de:**
  - Bloco 2 (Schema & Migração) — precisa saber os nomes finais de tabela/coluna que as rotas
    públicas do gateway esperam (ex: se os campos de tracking migram de `integrations` para
    `pages`/`profiles`), e se `short_links`/`leads` continuam existindo como tabelas próprias.
  - Bloco 4 (Camada de dados) — os repos autenticados (`useShortLinks`, `useIntegrations`, leads
    do dashboard) continuam escrevendo via `/data/:table`; este bloco só cobre o **caminho de
    leitura pública/anônima**, não reabre esses repos.
  - Bloco 5 (Telas & Rotas) — a tela de configuração de tracking/lead-form no dashboard autenticado
    não muda aqui; este bloco só troca o consumo do lado público.
- **Habilita:** Bloco 7 (Manifest, empacotamento & limpeza) — só faz sentido escrever o manifest
  final depois que não sobrar nenhuma referência a Supabase/Edge Function no app.

## Decisões já tomadas (não reabrir)

| Tema | Decisão |
|---|---|
| Agendamento de link (`schedule_enabled`/`starts_at`/`ends_at`) | Filtro **inteiramente client-side**, sem equivalente a `is_link_scheduled_active` no servidor. Aceito por não ser dado sensível. |
| HTML customizado no `<head>` (`custom_head_html`) | **Cortado.** Só sobra GA4 measurement ID e Meta Pixel ID, validados por regex. |
| Produtos digitais / pagamento | Cortados — nada aparece na página pública. |
| Imagens (avatar, thumbnail de link, capa de tema) | Chegam como `data:` URI (base64) no payload. `<img src={...}>` não muda. |
| Rate limiting / hash de IP | Deixa de ser responsabilidade do template. Se o gateway já protege as rotas públicas, ótimo; senão é problema de quem mantém o gateway — **não implementar rate-limit no front**. |
| Extensão de fundação | Nada aqui pode pedir rota nova ao gateway — só reuso do que já existe (LinkHub/Forms públicas). Toda necessidade que não bater vira pergunta em aberto, não bloqueio. |

## Perguntas em aberto (dependem de confirmar capacidade do gateway já existente)

Estas perguntas **não bloqueiam a escrita do código deste bloco** — cada story abaixo diz como
proceder enquanto a resposta não chega (normalmente: implementar contra a rota mais provável e
isolar a chamada num único ponto fácil de trocar). Mas precisam ser respondidas por quem mantém o
`tenant-gateway` antes de considerar o bloco pronto para produção.

1. **Tracking IDs (GA/Pixel) numa única resposta de `/public/profile`?** Hoje eles vêm de uma
   tabela `integrations` separada (`page_id` → `google_analytics_measurement_id`,
   `meta_pixel_id`, mais `custom_head_html` que estamos cortando, mais `utm_*` que não é usado na
   renderização pública). Para caber numa única chamada a `GET /public/profile` (sem pedir rota
   nova), o mais provável é esses dois campos virarem colunas de `pages` ou `profiles`. **A
   decisão de schema é do Bloco 2** — aqui só sinalizamos que o hook público precisa que
   `GET /public/profile` já devolva `google_analytics_measurement_id` e `meta_pixel_id` junto do
   resto, para não precisar de uma segunda rota pública.
2. **`/public/links/:id/click` cobre resolução de link curto por slug?** O guia só cita
   `/public/links/:id/click` (LinkHub) e `/public/forms/:id` + `/responses` (Forms) como rotas
   públicas existentes. **Não cita `short_links`/resolução por slug em nenhum dos dois domínios.**
   Hoje `resolve-short-link` faz duas coisas que uma rota `/public/links/:id/click` (que espera um
   `id`, não um `slug` arbitrário de 3-20 chars) não cobre obviamente: (a) buscar por `slug` livre
   em vez de `id`, (b) devolver a `destination_url` pra redirect **antes** de qualquer navegação.
   **Não assumir que a rota existente serve.** Tratar como possível necessidade de rota pública
   nova (`/public/short-links/:slug` ou equivalente) e alinhar com o dono do gateway — ver
   Story 6.4.
3. **Registro de *page view* (não de clique) tem rota pública equivalente?** O guia só lista
   `/public/links/:id/click` (clique em link). Não há menção a uma rota de "visualização de
   página" no domínio LinkHub. `track-view` grava em `page_views` hoje. Se não houver rota
   equivalente, a opção sem extensão de fundação é **não persistir page view server-side neste
   template** e deixar a métrica de visualização só a cargo do GA4/Meta Pixel (que já rastreiam
   pageview do jeito deles). Ver Story 6.3.
4. **Captura de lead: `/public/forms/:id`+`/responses` (Forms) é o encaixe certo, ou existe rota
   de LinkHub própria pra isso?** O formato atual de `leads` (`name`, `email`, `phone`,
   `custom_fields`) não é exatamente um "form response" de Forms (que provavelmente é schema
   livre por definição de formulário) nem está listado como rota de LinkHub. Ver Story 6.6 —
   registrar as duas opções e não escolher sem confirmar com o dono do gateway.
5. **`og:image`/preview social com imagem em `data:` URI** — investigado nesta auditoria (ver
   Story 6.7): a página pública já é SPA sem SSR, então crawlers que não executam JS (Facebook,
   Twitter/X, WhatsApp, Telegram) **já não viam** as meta tags hoje, independente do formato da
   imagem. A migração para `data:` URI não piora esse cenário pra esses crawlers, mas garante que
   nenhum outro consumidor (ex: alguém que abra a página com um bot que rende JS) vai conseguir
   usar a imagem como preview, porque a maioria das plataformas exige uma URL http(s) buscável
   separadamente, não um valor inline em `content`. Se preview social de fato importar para o
   produto, é um gap que só se resolve com SSR/prerendering ou hospedagem real da imagem — **fora
   de escopo deste bloco**, registrado aqui como limitação conhecida.

## Regras obrigatórias (Importantdoc.md)

- **§B1/B3**: SPA Vite + React, sem servidor próprio, sem Supabase/Firebase. Depois deste bloco,
  zero `@supabase` deve sobrar em qualquer arquivo tocado (`usePublicProfile.ts`,
  `ShortLink.tsx`, `LeadCaptureForm.tsx`).
- **§B5**: o modo genérico do gateway (`/data/:table`) **exige sessão** — por isso a página
  pública não pode usar `db.table(...)`; tem que ser as rotas de `§B6`.
- **§B6**: página pública é rota explícita do `tenant-gateway/src/routes/public.ts`. Rotas que já
  existem: `GET /public/profile`, `GET /public/links`, `POST /public/links/:id/click` (LinkHub);
  `GET /public/forms/:id`, `POST /public/forms/:id/responses` (Forms). Qualquer necessidade que
  não bata com essas cinco chamadas é pergunta em aberto (seção acima), não invenção de rota nova
  no template.
- **§B11 / Erros comuns**: não prometer nada que dependa de extensão de fundação como se já
  estivesse resolvido — as perguntas em aberto ficam documentadas, não escondidas atrás de um
  `TODO` solto no código.

## Boas práticas obrigatórias neste bloco

1. **Nunca generalizar "confiar no client" além do que já foi decidido.** O filtro de agendamento
   de link é aceito client-side porque não é dado sensível (só visibilidade de marketing). Isso
   **não** é licença para tratar leads, cliques ou qualquer contagem como algo que o client pode
   fabricar sem checagem no servidor — essas continuam sendo escritas que passam pela rota
   pública do gateway (que decide o que persistir), o client só envia a intenção.
2. **Scripts de tracking carregados de forma defensiva, sem travar o render.** GA4/Meta Pixel já
   são carregados hoje via `useEffect` com fetch/script "fire-and-forget"; manter esse padrão —
   se o gateway estiver fora do ar ou os IDs forem inválidos, a página pública tem que continuar
   renderizando normalmente (o visitante não pode ver tela em branco por causa de analytics).
3. **Sanitização mínima mesmo removendo o HTML livre.** Os dois campos que sobram
   (`google_analytics_measurement_id`, `meta_pixel_id`) ainda vêm do banco — revalidar contra os
   regexes já existentes (`GA_REGEX = /^G-[A-Z0-9]{6,}$/`, `PIXEL_REGEX = /^\d{15,16}$/`, hoje em
   `src/hooks/useIntegrations.ts`) **antes de injetar em `<script src>`/`gtag(...)`**, mesmo que a
   escrita original já tenha validado — defesa em profundidade contra dado antigo/corrompido.
4. **Fail-closed, não fail-open, na leitura pública.** Se a rota do gateway responder 404/erro, a
   tela tem que cair no estado "perfil não encontrado" que já existe (`PublicProfile.tsx` linha
   ~120), nunca vazar stack trace/erro técnico pro visitante anônimo.
5. **Isolar cada chamada de rede num único ponto por responsabilidade** (um hook, uma função) —
   nunca espalhar `fetch` cru pelos componentes de tela. Facilita trocar a rota assim que as
   perguntas em aberto forem respondidas.
6. **`list-then-filter` continua valendo nas rotas públicas.** Mesmo que `/public/links` não seja
   literalmente `/data/links`, trate a resposta como uma lista plana e filtre/ordene no client
   (destaque, agendamento) — não assuma parâmetros de query que o guia não documenta.

## Stories

### Story 6.1 — Remover as Edge Functions do Supabase

- **Arquivos afetados:** `supabase/functions/capture-lead/index.ts`,
  `supabase/functions/resolve-short-link/index.ts`, `supabase/functions/track-click/index.ts`,
  `supabase/functions/track-view/index.ts` (deletar os 4 arquivos e os diretórios que ficarem
  vazios); qualquer config de deploy dessas functions (ex: `supabase/config.toml`, se citar
  functions) deve ser limpa junto.
- **O que fazer:** apagar `supabase/functions/**` inteiro. Confirmar, antes de apagar, que nenhuma
  outra story deste bloco ainda depende do comportamento textual delas para escrever a versão
  nova (leia as 4 antes de deletar — já lido nesta auditoria, resumo abaixo, mas confirme se o
  código mudou desde então):
  - `capture-lead`: valida `page_id` obrigatório, e-mail opcional mas validado por regex, exige
    nome OU e-mail, sanitiza `name`/`phone`/`custom_fields` (máx. 10 campos, 500 chars), rate
    limit em memória por IP (5/min), grava em `leads` com fallback de e-mail sintético quando
    ausente.
  - `resolve-short-link`: busca `short_links` por `slug`, valida que `destination_url` é
    http(s) (anti open-redirect), grava clique em `link_clicks` (com `short_link_id` e
    `link_id` — usa o `id` do próprio short link como fallback de `link_id` quando não há link
    associado), devolve `destination_url` pro client redirecionar.
  - `track-click` / `track-view`: praticamente idênticas — extraem IP de
    `x-forwarded-for`, geram hash SHA-256 do IP com salt diário (`IP_HASH_SALT` ou fallback fixo),
    detectam browser/device por regex simples no `user_agent`, e inserem em `link_clicks` /
    `page_views` respectivamente.
- **Critério de aceite:** `supabase/functions/` não existe mais no repo; nenhum arquivo do app
  referencia mais `/functions/v1/*`.
- **Fora de escopo:** decidir a rota substituta em si (isso é o resto das stories deste bloco);
  mexer em outras pastas de `supabase/` (migrations são Bloco 2).

### Story 6.2 — Reescrever `usePublicProfile.ts` para consumir as rotas públicas do gateway

- **Arquivos afetados:** `src/hooks/usePublicProfile.ts`.
- **O que fazer:**
  - Trocar as queries Supabase (`profiles`/`pages`/`links`/`themes`/`integrations` com
    `.eq(...)`/RLS) por chamadas HTTP às rotas públicas do gateway:
    - `GET /public/profile` → dados de perfil + página (mapear pro que hoje é `profile` + `page`
      combinados; hoje são duas tabelas separadas via Supabase — a forma exata de passar
      `handle`/`pageSlug` como query params depende do contrato real da rota, que fica pro Bloco 2
      confirmar junto do gateway; deixar isso isolado numa função `fetchPublicProfile(handle,
      pageSlug)` fácil de ajustar).
    - `GET /public/links` → lista de links da página (substitui a query em `links` com
      `.eq("page_id", ...).eq("is_active", true).order(...)`).
    - **Tracking (GA id / pixel id):** hoje vem de uma query separada em `integrations`
      (linhas 119-124 do hook atual). Consumir a partir do mesmo payload de
      `GET /public/profile`, assumindo que o Bloco 2 moveu essas duas colunas para
      `pages`/`profiles` (ver Pergunta em aberto #1). Não fazer uma segunda chamada de rede só
      pra isso — se a resposta de `/public/profile` não trouxer os campos, é sinal de que o
      schema do Bloco 2 precisa ajustar, não de criar uma rota nova aqui.
    - `theme`: mesma lógica — se `GET /public/profile` (ou `/public/links`) não devolver o tema
      junto, registrar como gap de contrato a resolver no Bloco 2 (o guia não cita rota separada
      pra tema; o mais provável é ele também virar parte do payload de perfil/página).
  - **Preservar exatamente o filtro client-side de agendamento que já existe** (linhas 96-108 do
    arquivo atual): para cada link com `schedule_enabled`, comparar `now` com `starts_at`/`ends_at`
    e esconder o link fora da janela. Esse filtro já roda hoje em paralelo ao RLS/
    `is_link_scheduled_active` (redundância defensiva); a partir deste bloco ele passa a ser a
    **única** garantia (não existe mais RLS por trás), então não pode ser removido nem
    enfraquecido na migração.
  - Manter a mesma interface pública do hook (`profile`, `page`, `links`, `theme`, `integrations`,
    `isLoading`, `error`, `trackClick`) para não obrigar mudanças em cascata em
    `PublicProfile.tsx` além do necessário — só o campo `integrations` pode mudar de forma
    (deixar de ser a tabela inteira e virar só `{ google_analytics_measurement_id, meta_pixel_id }`
    lido do próprio perfil/página).
  - `trackClick` deixa de chamar `track-click`; vira a Story 6.3.
  - Remover qualquer import de `@/integrations/supabase/client` e dos tipos gerados do Supabase
    (`Tables<"profiles">` etc.) — usar tipos próprios do template (coordenar com o que o Bloco 2/4
    definir em `types.gen.ts`, ou tipar localmente enquanto isso não existir).
- **Critério de aceite:** o hook não importa mais `@/integrations/supabase/*`; a página pública
  continua mostrando perfil, links, tema e disparando GA4/Pixel usando dado vindo do gateway; o
  filtro de agendamento continua escondendo/mostrando links conforme `starts_at`/`ends_at` mesmo
  sem qualquer proteção de servidor.
- **Fora de escopo:** decidir o schema definitivo de onde tracking/tema moram (Bloco 2); mudar a
  UI de `PublicProfile.tsx` além do necessário para bater com o novo shape de `integrations`.

### Story 6.3 — Substituir o tracking de clique e de visualização de página

- **Arquivos afetados:** `src/hooks/usePublicProfile.ts` (função `trackClick` e o `useEffect` de
  page view).
- **O que fazer:**
  - **Clique** (`trackClick`): trocar o `fetch` pra `/functions/v1/track-click` por uma chamada a
    `POST /public/links/:id/click` (rota já existente, confirmada no guia), passando o `id` do
    link clicado. Manter o comportamento "fire-and-forget" (`.catch()` silencioso, não bloqueia a
    navegação — o componente `PublicProfile.tsx` já dispara isso em paralelo com `e.preventDefault()`
    e a navegação real, não mudar essa parte).
  - **Page view** (hoje `track-view`, grava em `page_views`): **não há rota pública equivalente
    documentada** (pergunta em aberto #3). Enquanto isso não for confirmado com o dono do gateway:
    - Opção adotada por padrão neste bloco: **remover a chamada de rede de page view do template**
      (deixar de persistir `page_views` no schema deste app) e confiar só no GA4/Meta Pixel (que já
      disparam pageview automaticamente ao carregar o script, via `IntegrationScripts.tsx`) para
      essa métrica.
    - Deixar um comentário no código apontando a pergunta em aberto #3, para o caso de o gateway
      ganhar uma rota de view tracking depois — nesse caso é só reintroduzir a chamada.
  - Remover o `viewTrackedRef`/`useEffect` de page view se a opção acima for adotada, ou trocar o
    endpoint se a resposta do gateway confirmar uma rota.
- **Critério de aceite:** clicar num link da página pública dispara `POST /public/links/:id/click`
  sem travar a navegação; não sobra nenhuma chamada a `/functions/v1/track-click` ou
  `/functions/v1/track-view` no código.
- **Fora de escopo:** decidir se `page_views` como tabela sai do schema (Bloco 2); implementar
  qualquer rate-limit ou dedupe de clique no front (não é responsabilidade do template).

### Story 6.4 — Reescrever `ShortLink.tsx` (resolução de link curto)

- **Arquivos afetados:** `src/pages/ShortLink.tsx`.
- **O que fazer:**
  - Hoje o componente faz `POST /functions/v1/resolve-short-link` com `{ slug, referrer,
    user_agent }`, recebe `{ destination_url }` e redireciona via `window.location.replace(...)`
    — tratando 404 (link não encontrado) e outros erros com mensagem amigável + botão "Voltar ao
    Início".
  - **Isso depende diretamente da Pergunta em aberto #2** (o guia não cita `short_links` como
    coberto por LinkHub nem por Forms). Duas rotas de trabalho, sem travar a story:
    1. **Se o dono do gateway confirmar/expuser uma rota tipo `GET /public/short-links/:slug`
       (ou equivalente)**: trocar a chamada para essa rota, mantendo o mesmo tratamento de
       404/erro/redirect que já existe hoje.
    2. **Enquanto não houver confirmação:** implementar a chamada contra o nome de rota mais
       provável dado o padrão das outras (`/public/links/:id/click` sugere que o padrão é
       `/public/<recurso>/:identificador/<ação>`), isolar essa URL numa única constante/função
       (ex: `resolveShortLink(slug)` em um pequeno helper), e deixar comentário explícito no
       arquivo apontando a pergunta em aberto #2 — trocar depois é uma alteração de uma linha.
  - Manter o comportamento de UX atual: loading state (`Loader2` + "Redirecionando..."), erro com
    `AlertTriangle` + botão de voltar, redirect via `window.location.replace` (não
    `navigate`, porque o destino normalmente é externo).
  - Remover o uso de `import.meta.env.VITE_SUPABASE_URL`; usar a mesma base de gateway que o resto
    do app usa (`db`/`client.ts` do template, ou a env `VITE_GATEWAY_URL` do §B7).
- **Critério de aceite:** `/l/:slug` não chama mais `VITE_SUPABASE_URL`/Supabase; a lógica de
  resolução está isolada e comentada com a pendência da pergunta em aberto #2; UX de
  loading/erro/redirect preservada.
- **Fora de escopo:** criar a rota nova no gateway (não é deste template); decidir se
  `short_links` continua existindo como conceito (Bloco 2, mas indício forte de que sim, já que
  `useShortLinks.ts` no dashboard autenticado depende dela via `/data/short_links` — isso é Bloco
  4, não mexer aqui).

### Story 6.5 — Remover suporte a HTML customizado em `IntegrationScripts.tsx`

- **Arquivos afetados:** `src/components/IntegrationScripts.tsx`.
- **O que fazer:**
  - Remover a prop `customHeadHtml`, a constante `ALLOWED_TAGS`, `DANGEROUS_ATTRS`, a função
    `sanitizeHeadHtml` e o `useEffect` inteiro de "Custom Head HTML" (linhas ~9-16 e ~133-158 do
    arquivo atual).
  - Manter intactos os dois `useEffect` de **Google Analytics 4** (injeta `gtag.js`, inicializa
    `window.dataLayer`/`window.gtag`) e **Meta Pixel** (injeta `fbevents.js`, inicializa
    `window.fbq`) exatamente como estão hoje, incluindo o cleanup (`script.remove()`) e o guard
    `scriptsLoadedRef` que evita carregar o script duas vezes.
  - Adicionar revalidação defensiva de `gaMeasurementId`/`metaPixelId` contra os regexes já
    existentes em `src/hooks/useIntegrations.ts` (`GA_REGEX`, `PIXEL_REGEX`) antes de usar o valor
    em `script.src`/`gtag(...)`/`fbq(...)` — se inválido, não injeta o script (silenciosamente,
    sem quebrar o render).
  - Atualizar `PublicProfile.tsx` (chamada em `<IntegrationScripts .../>`) removendo a prop
    `customHeadHtml={integrations?.custom_head_html}`.
- **Critério de aceite:** `IntegrationScripts.tsx` não tem mais nenhuma referência a HTML
  livre/sanitização de DOM arbitrário; GA4 e Meta Pixel continuam funcionando com IDs válidos e
  não quebram o render com IDs ausentes/inválidos; `customHeadHtml` não existe mais em nenhuma
  prop/tipo do componente nem é passado por `PublicProfile.tsx`.
- **Fora de escopo:** remover `custom_head_html` do schema/tela de configuração autenticada (Bloco
  2/5 — aqui só garantimos que o lado público para de usar o campo).

### Story 6.6 — Trocar `capture-lead` por rota pública de captura de lead

- **Arquivos afetados:** `src/components/LeadCaptureForm.tsx`.
- **O que fazer:**
  - Hoje o formulário monta `{ page_id, name, email, phone, custom_fields }` e faz
    `POST /functions/v1/capture-lead`, com validação client-side de campo obrigatório, e-mail
    (regex + tamanho máx. 255) e um debounce simples de 10s entre envios (`lastSubmitRef`) — tudo
    isso **fica igual**, só troca o destino da chamada.
  - **Isso depende da Pergunta em aberto #4.** O guia só documenta rotas públicas de Forms
    (`GET /public/forms/:id`, `POST /public/forms/:id/responses`) — não uma rota de "lead" no
    domínio LinkHub. Duas opções a alinhar com o dono do gateway, sem travar a story:
    1. **Reusar Forms:** tratar o formulário de lead como um "form" com `id` fixo/conhecido da
       página, e enviar o payload como uma `response` via `POST /public/forms/:id/responses`
       (mapeando `name`/`email`/`phone` para dentro do formato de resposta que a rota Forms
       espera — provavelmente um JSON livre por campo).
    2. **Rota de LinkHub dedicada:** se o gateway já tiver algo como
       `POST /public/leads` ou `POST /public/pages/:id/leads`, usar essa (mais direta, já que o
       formato atual de `leads` não é genuinamente um "form" de schema livre).
  - Isolar a chamada de rede numa função só (ex: `submitLead(payload)`), para trocar de opção
    depois sem tocar no resto do componente. Deixar comentário apontando a pergunta em aberto #4.
  - Manter o tratamento de erro atual (mensagem no `error` state, ex: "E-mail já cadastrado" viria
    de um 409 — se a rota escolhida não distinguir esse caso, ajustar a mensagem genérica sem
    quebrar o fluxo).
- **Critério de aceite:** submeter o formulário de lead não chama mais
  `/functions/v1/capture-lead`; a validação client-side (obrigatório, e-mail, debounce de 10s)
  continua idêntica; a chamada de rede está isolada e comentada com a pendência da pergunta em
  aberto #4.
- **Fora de escopo:** decidir o schema de `leads` em si (Bloco 2); mudar os campos que o
  formulário oferece (isso é configurado em `LeadFormFieldsConfigurator`, tela autenticada, Bloco
  5).

### Story 6.7 — Tratar `og:image`/preview social defensivamente com imagens em `data:` URI

- **Arquivos afetados:** `src/components/SEOHead.tsx`.
- **O que fazer:**
  - Confirmado nesta auditoria: `SEOHead.tsx` seta `og:image`/`twitter:image` via `useEffect` (DOM
    puro, sem SSR/prerendering — o app é SPA cliente, §B1). Crawlers que não executam JS
    (Facebook, Twitter/X, WhatsApp, Telegram, LinkedIn) **já não viam** essas tags hoje, com URL ou
    sem — isso é uma limitação pré-existente da arquitetura SPA, não introduzida por este bloco.
  - O que muda de fato com a migração pra `data:` URI: mesmo num cenário onde algo leia essas
    meta tags (ex: uma ferramenta de debug local, um bot que renderize JS), a maioria das
    plataformas de preview social **não aceita `data:` URI em `og:image`/`twitter:image`** — elas
    esperam uma URL http(s) que conseguem buscar separadamente. Um valor em base64 nesse atributo
    é, na prática, sempre inútil para esse fim (e infla o HTML gerado em runtime sem benefício).
  - Ajustar `SEOHead.tsx` para **não publicar `og:image`/`twitter:image` quando `imageUrl` começa
    com `data:`** (checar `imageUrl?.startsWith("data:")`) — nesse caso, omitir a tag em vez de
    publicar um valor garantidamente quebrado. Quando `imageUrl` for uma URL http(s) normal
    (ex: se algum dia a imagem vier de uma URL real), manter o comportamento atual.
  - Ajustar a chamada em `twitter:card`: hoje é `imageUrl ? "summary_large_image" : "summary"` —
    tratar `data:` URI como "sem imagem" também nesse cálculo (cai para `"summary"`).
- **Critério de aceite:** com uma imagem em `data:` URI, a página não injeta `og:image`/
  `twitter:image` (nem finge que tem uma imagem de preview via `twitter:card`); com uma URL
  http(s) normal, o comportamento é idêntico ao de hoje.
- **Fora de escopo:** implementar SSR/prerendering ou qualquer forma de hospedar a imagem como URL
  real para viabilizar preview social de verdade — isso é gap de arquitetura (SPA sem SSR),
  registrado como limitação conhecida, não resolvido neste bloco.

## Definition of Done do bloco

**Status: concluído em 2026-07-23.** Stories 6.2/6.3 já tinham sido feitas antecipadamente no
Bloco 4 (Story 4.9 — `usePublicProfile`/`public.repo.ts`). Este bloco completou 6.1, 6.4, 6.5,
6.6, 6.7.

- [x] `supabase/functions/` e `supabase/config.toml` (resíduo Lovable) não existem mais no repo
      (Story 6.1). `src/integrations/supabase/` também foi apagado agora — era pendência aberta
      desde o Bloco 4, só liberada quando as últimas telas (`LinksScreen`, `DesignScreen`,
      `PublicProfileScreen`, `MobilePreview`) pararam de importar de lá no Bloco 5.
- [x] `usePublicProfile.ts` não importa `@/integrations/supabase/*`; consome `getPublicPageByHandle`
      (`GET /public/profile?handle=`); filtro client-side de agendamento preservado.
- [x] Clique em link dispara `POST /public/links/:id/click` via `trackLinkClick`; page view **não
      persiste** (decisão adotada: confiar em GA4/Pixel — pergunta em aberto #3 documentada em
      `public.repo.ts`/neste arquivo).
- [x] `/l/:slug` (`ShortLinkRedirectScreen`) usa `resolveShortLink()` de `public.repo.ts`
      (`/public/short-links/:slug`, assumido — pergunta em aberto #2 comentada no código).
- [x] `IntegrationScripts.tsx` sem `customHeadHtml`/sanitizador de HTML; GA4/Meta Pixel
      revalidados por `GA_REGEX`/`PIXEL_REGEX` antes de injetar script. De brinde: corrigido um
      bug real (`TS2774`) que já estava no baseline do Bloco 1 — `window.fbq` virou opcional na
      declaração global, e o snippet do Pixel usa a referência local `n` em vez de `window.fbq`
      pra evitar falso positivo de "possibly undefined".
- [x] `LeadCaptureForm.tsx` usa `submitLead()` de `public.repo.ts` (`POST /public/leads`, assumido
      — pergunta em aberto #4 comentada no código); validação client-side idêntica.
- [x] `SEOHead.tsx` não publica `og:image`/`twitter:image` quando `imageUrl` começa com `data:`.
- [x] `QRCodeGenerator.tsx`/`socialDetection.ts` confirmados sem dependência de Supabase.
- [x] Zero ocorrência de `@supabase`, `VITE_SUPABASE_URL` ou `/functions/v1/` em `src/` inteiro
      (não só nos arquivos deste bloco — confirmado por grep).
- [x] `npx tsc --noEmit -p tsconfig.app.json` → **0 erros** (primeira vez no projeto inteiro).
      `npx vite build` → sucesso, só warning de chunk-size (>500kB, já esperado/documentado no
      guia §B10).
- [x] As 5 perguntas em aberto seguem documentadas — agora também como comentários no código
      exato onde a resposta muda a implementação (`public.repo.ts`, `ShortLinkRedirectScreen.tsx`),
      não só neste arquivo.
