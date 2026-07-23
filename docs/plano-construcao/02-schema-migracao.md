# Bloco 2 — Schema & Migração de Dados

> **Se você está retomando isto numa sessão nova:** leia primeiro `Importantdoc.md` inteiro
> (contrato técnico da fundação Masia — chamado de "guia" no resto deste arquivo), com atenção
> total a **§B4** (regras de schema) e **§B4.1** (gotcha de RBAC: toda tabela-filha escrita pelo
> `rep` precisa do próprio `owner_id`, senão 403). Leia também
> `docs/AUDITORIA-ADAPTACAO-MASIA.md` §3 (auditoria de schema — ponto de partida, mas este
> arquivo vai mais fundo: foi escrito lendo as 24 migrations reais, não só inferindo delas).
> Não precisa reler nenhuma conversa — este arquivo é autocontido.

## Objetivo

Substituir as 24 migrations incrementais do Supabase (`supabase/migrations/2026*.sql`) — com
RLS, `auth.uid()`, tabela `profiles`, FKs pra `auth.users`, funções `SECURITY DEFINER` e buckets
de storage — por **uma única migration idempotente**
(`supabase/migrations/0001_business_schema.sql`) que roda no Neon do tenant, sem RLS, sem
`auth.uid()`, sem tabela `profiles`, com `owner_id text references "user"(id)` em toda tabela
escrita pelo usuário (inclusive filhas), seguindo à risca o §B4 do guia.

## Por que este bloco existe

O schema é a base de tudo: sem ele, o Bloco 4 (repos) não sabe que colunas expor em
`types.gen.ts`, o Bloco 3 (auth) não sabe o nome/tipo da coluna de dono, o Bloco 6 (rotas
públicas) não sabe o que as rotas do gateway devem devolver, e o Bloco 7 (manifest) não sabe
que migration listar. O schema atual **não roda como está** no Neon: usa `auth.uid()` (não
existe fora do Supabase Auth), referencia `auth.users` (não existe — quem gerencia usuário é o
Better-Auth do gateway, numa tabela `"user"` própria), tem uma tabela `profiles` inteira dedicada
a RLS (proibida pelo guia) e várias tabelas-filha (`links`, `leads`, `short_links`,
`integrations`) sem `owner_id` próprio — que é exatamente o padrão que faz o `rep` tomar 403 ao
salvar (§B4.1).

## Depende de / Habilita

- **Depende de:** Bloco 1 (Stack & Build) só no sentido de que o `tsconfig`/build já devem estar
  ajustados antes de gerar `types.gen.ts` a partir deste schema (Bloco 4) — este bloco em si não
  toca em código TypeScript, só SQL.
- **Habilita:**
  - Bloco 3 (Auth) — precisa saber que a coluna de dono é `owner_id text` (não `user_id uuid`) e
    que não existe mais tabela `profiles`/`user_roles` (papéis são do gateway).
  - Bloco 4 (Camada de dados) — `types.gen.ts` é gerado a partir do schema definido aqui;
    **este bloco resolve uma pendência explícita que o Bloco 4 (já escrito) deixou em aberto** —
    ver seção "Sincronização com Blocos já escritos" abaixo.
  - Bloco 6 (Página pública & Tracking) — as rotas públicas do gateway (`/public/profile`,
    `/public/links`, etc.) precisam bater exatamente com os nomes de tabela/coluna definidos
    aqui. **Este bloco também resolve duas perguntas em aberto que o Bloco 6 (já escrito) deixou
    explicitamente para o Bloco 2** — ver mesma seção abaixo.

## Decisões já tomadas (não reabrir)

Estas vieram de fora deste bloco (travadas por quem pediu este plano) — só aplicá-las ao schema:

| Tema | Decisão | Efeito no schema |
|---|---|---|
| Imagens (avatar, ícone de link, capa de tema, e qualquer outra coluna de imagem) | Viram `data:` URI base64 numa coluna `text` já existente. | **Nenhuma mudança estrutural.** `avatar_url`, `thumbnail_url`, `custom_background_url`, `og_image_url` continuam `text`; só o **conteúdo** muda (URL de storage → data URI). Documentado via `comment on column`. |
| Produtos digitais / pagamento (`digital_products`, `orders`, enum `order_status`, bucket `product-files`) | Cortado do escopo inteiro. | Nenhuma das duas tabelas entra na migration nova. Enum `order_status` não é recriado. |
| Agendamento de link (`schedule_enabled`, `starts_at`, `ends_at`) | Colunas continuam existindo; o filtro que hoje é feito pela função `is_link_scheduled_active` (usada dentro de RLS) passa a ser 100% client-side. | Colunas mantidas em `links` exatamente como estão hoje. A função `is_link_scheduled_active` **não é recriada** (não há RLS/função de servidor além do trigger de `updated_at`). |
| HTML customizado no `<head>` da página pública (`integrations.custom_head_html`) | Sai do schema. | Coluna **não existe** na tabela `integrations` nova. Só ficam `google_analytics_measurement_id`, `meta_pixel_id` e os campos de UTM. |
| Extensão de fundação | Fora de escopo em qualquer bloco. | Nenhuma função custom além de `touch_updated_at()`; sem RLS; sem policy. |

## Decisões que ESTE bloco toma agora (schema-specific — leia com atenção, justificadas abaixo)

O guia pede explicitamente para decidir e justificar dois pontos que a auditoria original deixou
em aberto. As respostas abaixo são a fonte de verdade a partir de agora.

### Decisão 1 — Eliminar `profiles`: os campos de identidade viram colunas de `pages`

**O que existia:** `profiles` (1 por `user_id`, com `handle` único, `display_name`, `bio`,
`avatar_url`, `is_public`) e `pages` (N por `profile_id`, com `title`, `description`,
`og_image_url`, `custom_domain`, `slug`, config de formulário de lead). A página pública era
endereçada em dois níveis: `/:handle` (conta) + opcionalmente `/:handle/:pageSlug` (sub-página),
resolvido em `usePublicProfile.ts` (`.eq("handle", handle)` em `profiles`, depois
`.eq("profile_id", profile.id).eq("slug", pageSlug)` em `pages`).

**Por que não dá pra simplesmente manter as duas tabelas:** o guia proíbe explicitamente
`profiles` (§B4: *"SEM RLS, SEM `auth.uid()`, SEM `custom_access_token_hook`, SEM tabela
`profiles`. Autz é no gateway."*) — essa é a tabela-espelho de identidade que existe hoje só
para servir de âncora de RLS por `auth.uid()`, o que a fundação não usa. Manter uma tabela só
para "campos de conta" e outra para "campos de página", ligadas por uma FK que precisaria ficar
sincronizada entre múltiplas `pages` do mesmo dono (ex: trocar o `handle` da conta teria que
refletir em todas as sub-páginas), exigiria ou (a) uma função/trigger de sincronização no Neon —
proibido (*"sem funções customizadas no servidor Neon além de trigger simples de
`updated_at`"*) — ou (b) duplicar a leitura em 2 queries toda vez que o front precisar montar a
página pública, sem nenhum ganho real dado que o modo genérico do gateway já é "list-then-find"
mesmo dentro de uma tabela só.

**Decisão:** fundir tudo em uma única tabela `pages`, com `owner_id text` direto (sem
indireção via `profiles`/`profile_id`). Cada linha de `pages` é um **site link-in-bio
completo e independentemente endereçável**: tem seu próprio `handle` único (`/:handle`),
`display_name`, `bio`, `avatar_url`, `is_public`, mais os campos que já eram da página
(`title`, `description`, `og_image_url`, `custom_domain`, config de lead form). Um `owner_id`
pode ter **N** linhas em `pages` (a feature de múltiplos sites por conta é preservada — é
exatamente o que `ActivePageContext.tsx` já espera, um array de "pages" por usuário), só que
agora cada uma é autônoma (endereço próprio), em vez de "conta + sub-página com slug".

**Consequência que este bloco não implementa, mas precisa ficar visível:** a coluna `slug` de
sub-página **não existe mais** — o endereçamento passa a ser sempre flat (`/:handle` por page).
Isso muda o contrato de roteamento público hoje descrito em `usePublicProfile(handle, pageSlug)`
(dois parâmetros) para, na prática, só precisar de `handle` (um parâmetro). **Isso é
implementação de Bloco 4/5/6, não deste bloco** — aqui só entrego a tabela; quem construir esses
blocos precisa saber que a rota de dois níveis não existe mais no schema.

### Decisão 2 — `themes`: dado do usuário (1 por `page`), não catálogo

A migration original (`20260203000653...sql`) criava `themes.profile_id uuid not null unique
references profiles(id)` — ou seja, **1 tema por usuário**, dado próprio editável (cores,
fonte, estilo de botão, imagem de fundo), nunca um catálogo global read-only. Migrations
seguintes (`20260203002456`, `20260203003052`) trocaram a chave de `profile_id` para `page_id`
(1 tema por *page*, criado automaticamente junto da page pelo antigo `handle_new_user`). O hook
`useTheme.ts` confirma: busca por `page_id` + `.maybeSingle()`, atualiza via `update`, nunca lê
tema de outro usuário.

**Decisão:** `themes` é tabela de **dado do usuário**, leva `owner_id` (child gravado pelo
`rep`, §B4.1) **e** `page_id uuid not null unique references pages(id)` (1 tema por page). Não é
lookup — não há noção de "catálogo de temas compartilhado" neste domínio (os *presets* de tema
como "cyan-teal"/"dark"/"pastel" são constantes do front-end, `THEME_PRESETS` em `useTheme.ts`,
não linhas de banco).

### Nenhuma tabela lookup neste domínio

Percorrendo as 24 migrations e os hooks, **não existe nenhuma tabela genuinamente read-only**
(status/categoria/estágio/template-semente) neste app. `themes` — a única candidata óbvia —
já foi resolvida acima como dado do usuário. Toda tabela deste schema, portanto, leva
`owner_id`. Isso é dito explicitamente para não deixar nenhuma tabela ambígua, como pedido.

## Sincronização com Blocos já escritos (04 e 06) — status: já corrigido

Os Blocos 4 e 6 foram escritos **antes** deste arquivo existir, e ambos deixaram perguntas
explicitamente em aberto "para o Bloco 2 decidir". Um efeito colateral da Decisão 1 acima era que
parte do Bloco 4 (e um pouco do 05/06) precisava ser revisada — **essa revisão já foi feita**
(ver notas "Correção pós-sincronização" nesses arquivos). Deixando o histórico aqui só para quem
quiser entender o porquê:

- **`docs/plano-construcao/04-camada-de-dados.md`, Story 4.3** foi reescrita: não existe mais
  `profiles.repo.ts`; os campos de identidade (`handle`, `display_name`, `bio`, `avatar_url`,
  `is_public`) são colunas de `pages.repo.ts`, absorvidas por `usePages.ts`. A "checagem de
  unicidade de handle" via rota pública continua válida como estratégia, só mudou a tabela de
  referência.
- **DoD do Bloco 4** já foi ajustado — lista só `pages` (sem `profiles`) entre as tabelas vivas.
- **Blocos 05 e 06** também já têm a nota de correção (endereçamento de página pública passa a
  ser `/:handle`, um nível só — não `/:handle/:pageSlug`).
- **`docs/plano-construcao/06-pagina-publica-tracking.md`, "Pergunta em aberto #1"** (tracking
  GA/Pixel numa única resposta de `/public/profile`): a resposta é que **não é preciso mover**
  `google_analytics_measurement_id`/`meta_pixel_id` para `pages`. `integrations` continua sendo
  tabela própria (1:1 com `page_id`, como já era). A rota pública `/public/profile` é **código
  do gateway**, não passa pela limitação de "sem join" do modo genérico `/data/:table` (essa
  limitação é só do modo cliente-autenticado) — o handler da rota pode perfeitamente fazer o
  join server-side entre `pages`, `integrations`, `themes` e `links` e devolver tudo agregado
  numa resposta só. Isso é decisão de implementação do Bloco 6/gateway, não do schema.
- **Bloco 6, "Pergunta em aberto #3"** (page view sem rota pública equivalente) — Bloco 6 optou,
  por padrão, por **não persistir** page view via rede por enquanto (confiar em GA4/Pixel) mas
  deixou "decidir se `page_views` sai do schema" explicitamente para cá. **Decisão: `page_views`
  permanece no schema** (com `owner_id`, ver Story 2.6) mesmo que hoje nenhuma rota grave nela —
  é mais barato manter a tabela pronta (sem custo real: fica vazia) do que ter que escrever uma
  nova migration no dia em que o gateway ganhar uma rota pública de view. Não bloqueia a decisão
  do Bloco 6 de não chamar rede por enquanto.

## Regras obrigatórias (Importantdoc.md)

Citações diretas do guia que todo DDL deste bloco tem que satisfazer:

1. **§B4, regra 1:** `owner_id text not null references "user"(id) on delete cascade` em
   **toda tabela que o usuário escreve** — é `text` (id do Better-Auth), `"user"` **com aspas**.
2. **§B4, regra 2 / §B4.2:** sem RLS, sem `auth.uid()`, sem `custom_access_token_hook`, sem
   tabela `profiles`. Autorização é 100% gateway (app-layer).
3. **§B4, regra 3:** `snake_case` minúsculo — regex `^[a-z_][a-z0-9_]*$` (tabela e coluna).
4. **§B4, regra 4:** nomes de tabela proibidos (reservados ao auth):
   `user, session, account, verification, organization, member, invitation`. Nenhuma tabela
   deste schema usa esses nomes.
5. **§B4, regra 5:** `id uuid` PK + `created_at`/`updated_at timestamptz`, com trigger
   `touch_updated_at` para `updated_at` automático.
6. **§B4, regra 6:** tabelas lookup (sem `owner_id`) seriam read-only pro `rep` — **não se
   aplica neste schema**, ver "Nenhuma tabela lookup neste domínio" acima.
7. **§B4.1 (o gotcha):** *"TODA tabela que o `rep` cria/edita precisa de `owner_id` —
   inclusive tabelas-filhas... Esqueceu o `owner_id` numa filha → `rep` toma 403 ao salvar."*
   Isso cobre explicitamente `links`, `leads`, `short_links`, `integrations`, `themes`,
   `page_views`, `link_clicks` neste projeto — todas ganham `owner_id` próprio nas stories
   abaixo, mesmo as que só recebem escrita via rota pública do gateway (a razão para isso em
   tabelas de escrita anônima está detalhada na Story 2.6).
8. **Padrão de exemplo do guia** (§B4, bloco de código) — toda `create table` deste bloco segue
   literalmente esta forma:
   ```sql
   create table if not exists tarefas (
     id          uuid primary key default gen_random_uuid(),
     owner_id    text not null references "user"(id) on delete cascade,
     titulo      text not null,
     feito       boolean not null default false,
     created_at  timestamptz not null default now(),
     updated_at  timestamptz not null default now()
   );
   create index if not exists idx_tarefas_owner on tarefas(owner_id);
   ```
9. **A migration roda DEPOIS que o gateway já criou as tabelas do Better-Auth** (`"user"`,
   `session`, etc.) — nunca antes. Isso é comportamento do provisionador, não algo que este
   arquivo SQL precisa garantir, mas explica por que `references "user"(id)` funciona mesmo sem
   este schema criar a tabela `"user"`.

## Boas práticas obrigatórias neste bloco

1. **Ordem de colunas fixa em toda tabela:** `id` → `owner_id` → FKs de relação de negócio
   (`page_id`, `link_id`, etc.) → colunas de dado → `created_at` → `updated_at`. Facilita
   diff/leitura e é o que todo DDL abaixo segue.
2. **Convenção de nome de trigger:** `trg_<tabela>_updated_at`, sempre criado via
   `drop trigger if exists ...; create trigger ...` (idempotente — Postgres não tem
   `create trigger if not exists`). Função compartilhada: `touch_updated_at()` (substitui o
   antigo `update_updated_at_column()` — mesmo papel, nome novo, ver seção de descarte).
3. **Convenção de nome de índice:** `idx_<tabela>_<coluna(s)>`. **Toda tabela com `owner_id`
   ganha `idx_<tabela>_owner`** — é o índice que sustenta o filtro "rep vê só o que é seu" que o
   gateway aplica em cima de `owner_id`; não é opcional mesmo em tabela pequena.
4. **Convenção de nome de constraint única:** nome explícito `<tabela>_<coluna(s)>_key` (nunca
   deixar o Postgres escolher automaticamente para uma unique composta — dificulta reconhecer o
   erro `23505` no client).
5. **Guarda `duplicate_object` só onde é necessário:** como todo `create table` usa
   `if not exists` e toda constraint/FK vai **inline** dentro do `create table` (nunca via
   `alter table` solto), elas já são idempotentes por construção — se a tabela existe, o
   statement inteiro é pulado, constraint incluída. A guarda
   `do $$ begin ... exception when duplicate_object then null; end $$;` só é necessária para os
   **enums** (`create type` não aceita `if not exists`).
6. **Nunca nullable sem motivo.** Toda coluna `boolean` é `not null default <valor>`. Toda coluna
   de texto exigida pelo fluxo de criação (`links.title`, `leads.email`,
   `short_links.slug`/`destination_url`, `pages.handle`) é `not null`. Nullable só quando o dado
   é genuinamente opcional (`bio`, `custom_domain`, `ends_at`, `icon_name`, etc.) — comentado
   quando o motivo não é óbvio.
7. **Comentário em coluna quando o nome não é autoexplicativo** (`comment on column ...`):
   `theme_id` (chave do preset escolhido, **não** é o `id` da linha), `ip_hash` (hash do IP, não
   IP bruto — já era assim no original), `handle` (chave pública da URL, não apelido interno),
   toda coluna de imagem (`avatar_url`, `thumbnail_url`, `og_image_url`,
   `custom_background_url` — agora guardam `data:` URI base64).
8. **Enums são permitidos** — não são "função custom" nem RLS, são só tipos. Usar para valores
   fechados que o front já trata como enum (`thumbnail_type`, `background_type`, `link_type`).
   **Não** recriar `button_style_type` (enum órfão no original, nunca aplicado a nenhuma
   coluna) nem transformar `themes.button_style`/`themes.theme_id` em enum — o front já os trata
   como `text` livre (`BUTTON_STYLES`/`THEME_PRESETS` são constantes TS, não vêm de um enum de
   banco), então mudar o tipo aqui só criaria trabalho de migração de dado sem necessidade real.
9. **Tabela "só evento" dispensa `updated_at`/trigger.** `leads`, `short_links`, `page_views`,
   `link_clicks` nunca sofrem `UPDATE` depois de criadas (confirmado nos hooks — só
   `create`/`delete`/`list`). Elas têm `created_at`, mas **não** `updated_at`/
   `trg_..._updated_at` — adicionar a coluna simétrica sem uso real seria ruído.
10. **FK de relação de negócio sempre com ação explícita.** `on delete cascade` quando o filho
    não faz sentido sem o pai (`links.page_id`, `leads.page_id`, etc. — apagar a `page` apaga
    tudo que é dela); `on delete set null` quando é uma referência opcional que deve sobreviver
    à exclusão do que aponta (`short_links.link_id`, `link_clicks.short_link_id` — apagar o link
    original não deve apagar o short-link nem o histórico de clique).
11. **Corrigir, não repetir, buracos de integridade do schema original.** A auditoria linha a
    linha das 24 migrations achou várias colunas `page_id`/`link_id` criadas **sem** FK real
    (`links.page_id`, `themes.page_id`, `integrations.page_id`, `short_links.page_id`,
    `short_links.link_id`, `page_views.page_id`, `link_clicks.link_id`,
    `link_clicks.short_link_id` — só `leads.page_id` e `digital_products.page_id` tinham FK de
    verdade no original). O schema novo **adiciona a FK que faltava** em todas elas — é
    integridade referencial básica, não é mudança de comportamento visível para o app.

## Schema alvo (referência rápida, tabela por tabela)

Todas levam `owner_id` (ver "Nenhuma tabela lookup" acima). DDL completo está nas Stories.

- **`pages`** — fusão de `profiles`+`pages` antigas. `owner_id`, `handle` (único, chave da URL
  pública), `display_name`, `bio`, `avatar_url` (base64), `is_public`, `title`, `description`,
  `og_image_url` (base64), `custom_domain`, `lead_form_enabled/title/description/fields`,
  `created_at`/`updated_at`.
- **`links`** — filha de `pages`. `owner_id`, `page_id`, `title`, `url` (nullable p/ header),
  `link_type` (enum: link/header), `thumbnail_type` (enum: none/upload/icon), `thumbnail_url`
  (base64), `icon_name`, `position`, `is_active`, `is_featured`, `schedule_enabled`/`starts_at`/
  `ends_at` (filtro agora client-side), `created_at`/`updated_at`.
- **`themes`** — filha de `pages`, 1:1 (`unique(page_id)`). `owner_id`, `page_id`, `theme_id`
  (chave do preset), `button_style`, `font_family`, `custom_primary_color`,
  `custom_secondary_color`, `custom_background_url` (base64), `background_type` (enum),
  `background_value`, `button_radius`, `text_color`, `accent_color`, `created_at`/`updated_at`.
- **`integrations`** — filha de `pages`, 1:1 (`unique(page_id)`). `owner_id`, `page_id`,
  `google_analytics_measurement_id`, `meta_pixel_id`, `utm_source`/`utm_medium`/`utm_campaign`,
  `created_at`/`updated_at`. **Sem** `custom_head_html`.
- **`leads`** — filha de `pages`. `owner_id`, `page_id`, `email` (not null), `name`, `phone`,
  `custom_fields` (jsonb), `created_at`. Sem `updated_at` (só evento).
- **`short_links`** — filha de `pages`, referencia opcionalmente `links`. `owner_id`, `page_id`,
  `link_id` (nullable, `set null`), `slug` (único), `destination_url`, `created_at`. Sem
  `updated_at`.
- **`link_clicks`** — filha de `links`, referencia opcionalmente `short_links`. `owner_id`,
  `link_id`, `short_link_id` (nullable, `set null`), `clicked_at`, `referrer`, `user_agent`,
  `ip_hash`, `country`, `city`, `device_type`, `browser`. Sem `updated_at`.
- **`page_views`** — filha de `pages`. `owner_id`, `page_id`, `referrer`, `user_agent`,
  `ip_hash`, `country`, `city`, `device_type`, `browser`, `created_at`. Sem `updated_at`.

Enums: `thumbnail_type` (`none`/`upload`/`icon`), `background_type`
(`color`/`gradient`/`image`), `link_type` (`link`/`header`).

## O que é descartado e por quê

> A migration nova roda contra um **Neon vazio** por tenant (não é um `ALTER`/`DROP` em cima de
> um banco vivo) — então "descartar" aqui significa **não recriar** no schema novo, não
> "apagar de um banco existente".

| Item | Motivo |
|---|---|
| Tabela `profiles` | Proibida por §B4 ("SEM tabela `profiles`"). Campos de identidade viram colunas de `pages` (Decisão 1 acima). |
| Tabela `digital_products` | Decisão travada: produtos digitais fora do escopo. |
| Tabela `orders` | Decisão travada: pagamento fora do escopo. |
| Tabela `clicks` (antiga, pré-`link_clicks`) | Já tinha sido dropada nas próprias migrations originais (`20260203004116`), substituída por `link_clicks`; não ressuscitar. |
| Coluna `integrations.custom_head_html` | Decisão travada: HTML customizado no `<head>` cortado do escopo. |
| Coluna `pages.slug` (sub-página) | Substituída pelo `handle` único por page — cada page agora é endereçável sozinha (Decisão 1). |
| Coluna `themes.preset` | Órfã: criada em `20260203003052` mas nunca lida por nenhum hook/tela (`grep` em `src/` só acha `theme_id` sendo usado, em `DesignPage.tsx`; `preset` só é escrito "for backwards compatibility", nunca lido de volta). |
| `profiles.custom_domain`/`facebook_pixel`/`google_analytics`, `page_views.ip_address`, `links.profile_id`/`active`/`featured`/`slug` | Já removidas dentro das próprias 24 migrations originais (`20260203004116`, `20260203002456`); confirmado por leitura linha a linha; não ressuscitar. |
| Enum `button_style_type` | Criado em `20260203003005` mas nunca aplicado a nenhuma coluna — órfão total. |
| Enum `order_status` | Pertence a `orders`, cortado junto. |
| Função `update_updated_at_column()` | Não é descarte, é rename: vira `touch_updated_at()` no schema novo (mesmo papel, nome padronizado pelo guia). |
| Função `handle_new_user()` + trigger `on_auth_user_created` (em `auth.users`) | `auth.users` não existe no Neon (usuário é gerenciado pelo Better-Auth via tabela `"user"`). A criação automática de `pages`+`themes`+`integrations` no primeiro login **precisa de um substituto no app-layer** (Bloco 3/4 — "lazy create" na primeira sessão sem nenhuma `page`). **Sinalizado aqui para não ser esquecido:** sem esse substituto, usuário novo fica sem nenhuma `page` e o dashboard quebra. |
| Função `generate_slug()` | Nunca chamada por nenhum código real (short-link usa `generateBase62Slug` no front, em `useShortLinks.ts`); órfã. |
| Função `generate_unique_handle(email)` | Usada só dentro de `handle_new_user`, que também sai. Geração/checagem de handle único vira responsabilidade do app-layer (ver nota de sincronização com Bloco 4, Story 4.3). |
| Funções `user_owns_page`, `is_page_public`, `user_owns_profile`, `is_link_public`, `is_product_public`, `debug_pages_insert`, `validate_link_schedule` (+trigger), `is_link_scheduled_active` | Toda a família de apoio a RLS/validação server-side. Fundação não permite função custom além do trigger de `updated_at`; autorização é 100% gateway; validação de `starts_at < ends_at` vira responsabilidade client-side/gateway. |
| Todas as RLS policies (em `profiles`, `pages`, `links`, `themes`, `integrations`, `leads`, `short_links`, `page_views`, `link_clicks`, `digital_products`, `orders`, `storage.objects`) | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` e todo `CREATE POLICY` — proibidos por §B4.2. |
| Buckets `avatars`, `thumbnails`, `backgrounds`, `product-files` (+ suas policies de storage) | Decisão travada: imagens viram base64 em coluna `text`; não há Supabase Storage na fundação. `product-files` cai também pelo corte de `digital_products`. |

## Stories

### Story 2.1 — Tabela `pages` (fusão profiles + pages)

- **Objetivo:** criar a tabela consolidada que substitui `profiles`+`pages`, aplicando a
  Decisão 1 (ver acima).
- **DDL:**
  ```sql
  create table if not exists pages (
    id                     uuid primary key default gen_random_uuid(),
    owner_id               text not null references "user"(id) on delete cascade,
    handle                 text not null,
    display_name           text,
    bio                    text,
    avatar_url             text,
    is_public              boolean not null default true,
    title                  text,
    description            text,
    og_image_url           text,
    custom_domain          text,
    lead_form_enabled      boolean not null default false,
    lead_form_title        text default 'Fique por dentro',
    lead_form_description  text default 'Cadastre seu e-mail para receber novidades',
    lead_form_fields       jsonb not null default '[{"id":"name","type":"text","label":"Nome","enabled":true,"required":false},{"id":"email","type":"email","label":"E-mail","enabled":true,"required":true}]'::jsonb,
    created_at             timestamptz not null default now(),
    updated_at             timestamptz not null default now(),
    constraint pages_handle_key unique (handle),
    constraint pages_handle_format check (handle ~ '^[a-z0-9_]{3,20}$')
  );

  create index if not exists idx_pages_owner on pages(owner_id);

  comment on column pages.handle is 'Chave pública da URL (/:handle). Único por page, não por conta — um owner_id pode ter várias pages, cada uma com seu próprio handle (ver Decisão 1 do Bloco 2).';
  comment on column pages.avatar_url is 'Imagem em data: URI base64 (não é mais URL de storage).';
  comment on column pages.og_image_url is 'Imagem em data: URI base64 (não é mais URL de storage).';
  comment on column pages.lead_form_fields is 'Config JSON dos campos do formulário de captura de lead (array de {id,type,label,enabled,required}).';

  drop trigger if exists trg_pages_updated_at on pages;
  create trigger trg_pages_updated_at
    before update on pages
    for each row execute function touch_updated_at();
  ```
- **Critério de aceite:** tabela criada com `owner_id`; `handle` único e validado por regex;
  todas as colunas de `profiles` (exceto `user_id`, que vira `owner_id`) e de `pages` (exceto
  `profile_id`/`slug`, eliminadas pela Decisão 1) presentes; trigger de `updated_at` funcionando
  (um `update` em qualquer coluna atualiza `updated_at` sozinho).
- **Fora de escopo:** implementar a criação automática da primeira `page` no signup (era
  `handle_new_user`, ver tabela de descarte) — isso é Bloco 3/4.

### Story 2.2 — Tabela `links` (+ enums `thumbnail_type`, `link_type`)

- **Objetivo:** criar `links` como filha de `pages`, com `owner_id` próprio (§B4.1), corrigindo a
  FK de `page_id` que faltava no original.
- **DDL:**
  ```sql
  do $$ begin
    create type thumbnail_type as enum ('none', 'upload', 'icon');
  exception when duplicate_object then null;
  end $$;

  do $$ begin
    create type link_type as enum ('link', 'header');
  exception when duplicate_object then null;
  end $$;

  create table if not exists links (
    id               uuid primary key default gen_random_uuid(),
    owner_id         text not null references "user"(id) on delete cascade,
    page_id          uuid not null references pages(id) on delete cascade,
    title            text not null,
    url              text,
    link_type        link_type not null default 'link',
    thumbnail_type   thumbnail_type not null default 'none',
    thumbnail_url    text,
    icon_name        text,
    position         integer not null default 0,
    is_active        boolean not null default true,
    is_featured      boolean not null default false,
    schedule_enabled boolean not null default false,
    starts_at        timestamptz,
    ends_at          timestamptz,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
  );

  create index if not exists idx_links_owner on links(owner_id);
  create index if not exists idx_links_page_position on links(page_id, position);

  comment on column links.url is 'Nullable: um link com link_type = header não tem destino.';
  comment on column links.thumbnail_url is 'Imagem em data: URI base64 quando thumbnail_type = upload.';
  comment on column links.icon_name is 'Nome do ícone (biblioteca de ícones do front) quando thumbnail_type = icon.';
  comment on column links.schedule_enabled is 'Filtro de agendamento é 100% client-side agora (sem função/RLS de servidor por trás) — ver decisão travada do plano.';

  drop trigger if exists trg_links_updated_at on links;
  create trigger trg_links_updated_at
    before update on links
    for each row execute function touch_updated_at();
  ```
- **Critério de aceite:** `page_id` com FK real pra `pages(id) on delete cascade` (não existia
  no original); `owner_id` presente e indexado; enums criados de forma idempotente; `url`
  nullable (suporta `link_type = header`).
- **Fora de escopo:** decidir a UX de header vs link (Bloco 5).

### Story 2.3 — Tabelas `themes` e `integrations` (config 1:1 por page)

- **Objetivo:** criar as duas tabelas de configuração por página — cada uma com exatamente
  1 linha por `page_id` — aplicando a Decisão 2 (`themes` é dado do usuário, não catálogo) e
  cortando `custom_head_html` de `integrations` (decisão travada).
- **DDL:**
  ```sql
  do $$ begin
    create type background_type as enum ('color', 'gradient', 'image');
  exception when duplicate_object then null;
  end $$;

  create table if not exists themes (
    id                     uuid primary key default gen_random_uuid(),
    owner_id               text not null references "user"(id) on delete cascade,
    page_id                uuid not null references pages(id) on delete cascade,
    theme_id               text not null default 'cyan-teal',
    button_style           text not null default 'rounded',
    font_family            text not null default 'inter',
    custom_primary_color   text,
    custom_secondary_color text,
    custom_background_url  text,
    background_type        background_type not null default 'gradient',
    background_value       text,
    button_radius           integer not null default 16,
    text_color              text,
    accent_color            text,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    constraint themes_page_id_key unique (page_id)
  );

  create index if not exists idx_themes_owner on themes(owner_id);

  comment on column themes.theme_id is 'Chave do preset de tema selecionado (ex.: cyan-teal, dark, pastel) — não confundir com themes.id (PK da linha).';
  comment on column themes.custom_background_url is 'Imagem em data: URI base64 (capa de tema).';
  comment on constraint themes_page_id_key on themes is '1 tema por page — mesma regra de negócio da antiga UNIQUE(profile_id), só que a chave virou page_id (ver Decisão 2 do Bloco 2).';

  drop trigger if exists trg_themes_updated_at on themes;
  create trigger trg_themes_updated_at
    before update on themes
    for each row execute function touch_updated_at();

  create table if not exists integrations (
    id                                uuid primary key default gen_random_uuid(),
    owner_id                          text not null references "user"(id) on delete cascade,
    page_id                           uuid not null references pages(id) on delete cascade,
    google_analytics_measurement_id   text,
    meta_pixel_id                     text,
    utm_source                        text,
    utm_medium                        text,
    utm_campaign                      text,
    created_at                        timestamptz not null default now(),
    updated_at                        timestamptz not null default now(),
    constraint integrations_page_id_key unique (page_id)
  );

  create index if not exists idx_integrations_owner on integrations(owner_id);

  drop trigger if exists trg_integrations_updated_at on integrations;
  create trigger trg_integrations_updated_at
    before update on integrations
    for each row execute function touch_updated_at();
  ```
- **Critério de aceite:** ambas com `owner_id` + `unique(page_id)` + FK real pra `pages(id)`
  (nenhuma das duas tinha FK real no original); `integrations` **sem** `custom_head_html` em
  nenhuma coluna; `themes.background_type` usando o enum.
- **Fora de escopo:** decidir se GA/Pixel aparecem agregados numa única resposta de rota pública
  — isso é implementação de rota no Bloco 6 (já esclarecido na seção de sincronização acima: a
  tabela continua separada, o join é responsabilidade do handler da rota).

### Story 2.4 — Tabela `leads`

- **Objetivo:** criar `leads` como filha de `pages`, com `owner_id` — inclusive sendo uma tabela
  alimentada por **escrita anônima** via rota pública do gateway (não pelo `rep` autenticado
  via `/data/:table`).
- **DDL:**
  ```sql
  create table if not exists leads (
    id             uuid primary key default gen_random_uuid(),
    owner_id       text not null references "user"(id) on delete cascade,
    page_id        uuid not null references pages(id) on delete cascade,
    email          text not null,
    name           text,
    phone          text,
    custom_fields  jsonb not null default '{}'::jsonb,
    created_at     timestamptz not null default now(),
    constraint leads_page_id_email_key unique (page_id, email)
  );

  create index if not exists idx_leads_owner on leads(owner_id);
  create index if not exists idx_leads_page on leads(page_id);

  comment on column leads.owner_id is 'Preenchido pela rota pública do gateway a partir de pages.owner_id no momento do insert (não é o próprio visitante). Necessário mesmo em escrita anônima: é o que permite ao dono listar só os próprios leads via GET /data/leads (rep só vê linhas com o próprio owner_id).';
  comment on column leads.email is 'NOT NULL mesmo quando o formulário não coleta e-mail de verdade — o gateway grava um valor de placeholder nesse caso (ver useLeads.ts / decisão do formulário de captura, fora deste bloco).';
  ```
- **Por que `owner_id` numa tabela de escrita pública:** a captura de lead acontece por uma rota
  pública do gateway (visitante sem sessão, fora do modo genérico `/data/:table` — isso é escopo
  do Bloco 6). Isso **não** dispensa `owner_id`: é ele que faz o dono (`rep`/`admin`) conseguir
  **listar** os próprios leads pelo modo genérico autenticado (`GET /data/leads`) depois. Sem
  `owner_id`, o filtro "rep só vê o que é seu" do gateway devolveria lista vazia mesmo com leads
  gravados. O valor é resolvido **server-side, dentro do handler da rota pública** (o gateway
  busca `pages.owner_id` pelo `page_id` recebido e grava — nunca confia em `owner_id` vindo do
  visitante).
- **Critério de aceite:** `page_id` com FK real (única que já existia no original — mantida);
  `owner_id` presente e indexado; `unique(page_id, email)` preservada; sem `updated_at`/trigger
  (tabela só-evento).
- **Fora de escopo:** implementar a rota pública de captura em si (Bloco 6, "pergunta em aberto
  #4" do arquivo `06-pagina-publica-tracking.md`).

### Story 2.5 — Tabelas `short_links` e `link_clicks`

- **Objetivo:** criar as duas tabelas de link curto e clique, corrigindo as FKs que faltavam no
  original (`short_links.page_id`, `short_links.link_id`, `link_clicks.link_id`,
  `link_clicks.short_link_id` — nenhuma tinha FK real antes) e adicionando um índice que faltava
  (`link_clicks.short_link_id`, usado por `useShortLinks.ts` para contar cliques por short link).
- **DDL:**
  ```sql
  create table if not exists short_links (
    id               uuid primary key default gen_random_uuid(),
    owner_id         text not null references "user"(id) on delete cascade,
    page_id          uuid not null references pages(id) on delete cascade,
    link_id          uuid references links(id) on delete set null,
    slug             text not null,
    destination_url  text not null,
    created_at       timestamptz not null default now(),
    constraint short_links_slug_key unique (slug)
  );

  create index if not exists idx_short_links_owner on short_links(owner_id);
  create index if not exists idx_short_links_page on short_links(page_id);

  comment on column short_links.link_id is 'Opcional: short link pode apontar pra uma URL livre (destination_url) em vez de reaproveitar um link existente. on delete set null — apagar o link original não apaga o short link.';

  create table if not exists link_clicks (
    id              uuid primary key default gen_random_uuid(),
    owner_id        text not null references "user"(id) on delete cascade,
    link_id         uuid not null references links(id) on delete cascade,
    short_link_id   uuid references short_links(id) on delete set null,
    clicked_at      timestamptz not null default now(),
    referrer        text,
    user_agent      text,
    ip_hash         text,
    country         text,
    city            text,
    device_type     text,
    browser         text
  );

  create index if not exists idx_link_clicks_owner on link_clicks(owner_id);
  create index if not exists idx_link_clicks_link_date on link_clicks(link_id, clicked_at);
  create index if not exists idx_link_clicks_short_link on link_clicks(short_link_id);

  comment on column link_clicks.ip_hash is 'Hash do IP (não o IP bruto) — já era assim no schema original, mantido por privacidade.';
  ```
- **`owner_id` em `link_clicks`:** mesma razão da Story 2.4 (`leads`) — clique é registrado por
  rota pública (visitante sem sessão), mas o dono precisa listar via `GET /data/link_clicks`
  filtrado pelo gateway; o valor é derivado de `links.owner_id`/`pages.owner_id` dentro do
  handler da rota pública, nunca enviado pelo cliente.
- **Critério de aceite:** ambas as tabelas com `owner_id` indexado; todas as FKs que faltavam no
  original agora presentes (`short_links.page_id`/`link_id`, `link_clicks.link_id`/
  `short_link_id`); índice novo `idx_link_clicks_short_link` presente (não existia antes, é
  usado pela contagem de cliques por short link no dashboard). Sem `updated_at`/trigger em
  nenhuma das duas (tabelas só-evento).
- **Fora de escopo:** implementar a rota pública de resolução de short link/redirect (Bloco 6,
  "pergunta em aberto #2").

### Story 2.6 — Tabela `page_views`

- **Objetivo:** criar `page_views` como filha de `pages`, resolvendo a pendência que o Bloco 6
  deixou em aberto ("decidir se `page_views` sai do schema") — decisão: **permanece**, mesmo que
  o Bloco 6 opte por não persistir escrita agora.
- **DDL:**
  ```sql
  create table if not exists page_views (
    id           uuid primary key default gen_random_uuid(),
    owner_id     text not null references "user"(id) on delete cascade,
    page_id      uuid not null references pages(id) on delete cascade,
    referrer     text,
    user_agent   text,
    ip_hash      text,
    country      text,
    city         text,
    device_type  text,
    browser      text,
    created_at   timestamptz not null default now()
  );

  create index if not exists idx_page_views_owner on page_views(owner_id);
  create index if not exists idx_page_views_page_date on page_views(page_id, created_at);
  ```
- **Nota (já resolvida, só documentando):** `page_views.page_id` não tinha FK real no original —
  corrigida aqui. `ip_address` (coluna antiga) não é recriada — já tinha sido substituída por
  `ip_hash` dentro das próprias migrations originais (`20260203002456`).
- **Critério de aceite:** tabela criada com `owner_id`, `page_id` com FK real, sem
  `updated_at`/trigger (só-evento). Fica vazia até o Bloco 6/gateway decidir se existe rota
  pública de view — isso não é bloqueio para este bloco.
- **Fora de escopo:** decidir se/quando uma rota pública grava aqui (Bloco 6).

### Story 2.7 — Migration consolidada única + validação contra o checklist do guia

- **Objetivo:** montar o arquivo final `supabase/migrations/0001_business_schema.sql`,
  substituindo os 24 arquivos atuais, na ordem de dependência correta, e validar contra o
  checklist do guia (§B4 + "Checklist do template" da Parte B).
- **O que fazer:**
  1. Apagar os 24 arquivos existentes em `supabase/migrations/` (todos, listados no topo deste
     documento na auditoria — `20260203000653` até `20260326174747`).
  2. Criar `supabase/migrations/0001_business_schema.sql` com, nesta ordem exata (respeita
     dependência de FK):
     1. Guardas de `create type` (enums: `thumbnail_type`, `link_type`, `background_type`).
     2. Função compartilhada `touch_updated_at()`.
     3. `pages` (Story 2.1).
     4. `links` (Story 2.2).
     5. `themes`, `integrations` (Story 2.3).
     6. `leads` (Story 2.4).
     7. `short_links`, `link_clicks` (Story 2.5).
     8. `page_views` (Story 2.6).
  3. Função `touch_updated_at()`:
     ```sql
     create or replace function touch_updated_at()
     returns trigger
     language plpgsql
     set search_path = public
     as $$
     begin
       new.updated_at = now();
       return new;
     end;
     $$;
     ```
  4. Rodar a migration contra um Neon de teste vazio (ou `psql` local) e confirmar que roda
     **duas vezes seguidas sem erro** (prova de idempotência — é exatamente o que "roda de
     novo sem quebrar" significa na prática, já que não há histórico de migration por tenant
     como no Supabase).
- **Checklist de validação (rodar contra o arquivo final antes de considerar o bloco pronto):**
  - [x] Toda tabela escrita por usuário tem `owner_id text not null references "user"(id) on
        delete cascade` — inclusive as filhas (`links`, `themes`, `integrations`, `leads`,
        `short_links`, `link_clicks`, `page_views`), não só `pages`. Confirmado via grep: 8
        tabelas, 8 ocorrências exatas do padrão.
  - [x] Nenhuma tabela chamada `profiles`, `user_roles`, `clicks` (antiga), `digital_products`,
        `orders`. Confirmado via grep (só aparecem em comentários explicando decisões, não em SQL
        executável).
  - [x] Nenhum nome de tabela/coluna bate com `^(?!^[a-z_][a-z0-9_]*$)` (fora do padrão
        `snake_case`) nem com a lista proibida (`user, session, account, verification,
        organization, member, invitation`). 8 tabelas: `pages`, `links`, `themes`, `integrations`,
        `leads`, `short_links`, `link_clicks`, `page_views` — todas conformes.
  - [x] Toda tabela tem `id uuid primary key default gen_random_uuid()`.
  - [x] Toda tabela mutável (`pages`, `links`, `themes`, `integrations`) tem `created_at`+
        `updated_at timestamptz not null default now()` e trigger `trg_<tabela>_updated_at`
        usando `touch_updated_at()` — confirmado via grep, exatamente 4 triggers, nenhum nas
        tabelas só-evento (`leads`, `short_links`, `link_clicks`, `page_views`).
  - [x] Zero `alter table ... enable row level security`, zero `create policy`, zero
        `auth.uid()`, zero referência a `auth.users`.
  - [x] Zero função além de `touch_updated_at()`.
  - [x] Zero `insert into storage.buckets`/`create policy on storage.objects`.
  - [x] `integrations` sem `custom_head_html`; `digital_products`/`orders` ausentes por
        completo; enum `order_status`/`button_style_type` ausentes.
  - [ ] Rodar o arquivo duas vezes seguidas contra o mesmo banco vazio não gera erro
        (idempotência real, não só teórica). **Não verificado nesta sessão** — sem `psql` no
        PATH e sem Docker daemon rodando (`docker` presente mas o serviço não respondeu:
        `Head "http://.../dockerDesktopLinuxEngine/_ping": ... o sistema não pode encontrar o
        arquivo especificado`). Validação estática (grep) cobriu todos os outros itens; a prova
        de idempotência real por execução fica pendente — rodar `psql <neon-de-teste> -f
        0001_business_schema.sql` duas vezes seguidas antes do primeiro clone real de produção.
- **Critério de aceite:** `supabase/migrations/` contém **um único arquivo**
  (`0001_business_schema.sql`); todo o checklist acima marcado exceto a execução ao vivo (ambiente
  sem Postgres disponível nesta sessão — ver nota); nenhum arquivo antigo restante (as 24
  migrations originais foram removidas via `git rm`, recuperáveis no histórico do git).
- **Fora de escopo:** gerar `types.gen.ts` a partir deste schema (Bloco 4); registrar a migration
  no manifest (`masi.template.json`, Bloco 7).

## Definition of Done do bloco

**Status: concluído em 2026-07-23** (exceto o item de idempotência ao vivo, ver nota).

- [x] `supabase/migrations/` tem exatamente 1 arquivo: `0001_business_schema.sql`.
- [x] As 8 tabelas do schema alvo existem (`pages`, `links`, `themes`, `integrations`, `leads`,
      `short_links`, `link_clicks`, `page_views`) — nenhuma tabela ambígua quanto a
      "leva `owner_id` ou não" (todas levam).
- [x] `profiles`, `digital_products`, `orders`, `user_roles`, `clicks` (antiga) não existem no
      arquivo novo.
- [x] Toda FK de dono é `text references "user"(id) on delete cascade` — zero `uuid references
      auth.users(id)` restante.
- [x] Todo enum criado (`thumbnail_type`, `link_type`, `background_type`) usa a guarda
      `duplicate_object`; nenhum enum órfão (`button_style_type`, `order_status`) recriado.
- [x] Zero RLS, zero policy, zero `auth.uid()`, zero função além de `touch_updated_at()`, zero
      bucket de storage.
- [x] `integrations` sem `custom_head_html`.
- [ ] A migration roda duas vezes seguidas contra um Neon/Postgres vazio sem erro. **Pendente**:
      ambiente desta sessão não tinha `psql` nem o daemon do Docker ativo para testar de verdade
      — revisão estática (grep) não substitui isso. Rodar antes do primeiro provisionamento real.
- [x] A seção "Sincronização com Blocos já escritos" foi lida e as pendências nela (Story 4.3 do
      Bloco 4 precisar reescrever a fusão `profiles`→`pages`; Bloco 6 confirmado sobre
      `integrations` continuar separada) já foram corrigidas nos arquivos 04/05/06 (ver notas
      "Correção pós-sincronização" em cada um).
