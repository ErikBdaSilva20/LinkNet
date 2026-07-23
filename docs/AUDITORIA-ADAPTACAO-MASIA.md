# Auditoria de Adaptação — Projeto Link-in-Bio → Template Masia (Hub de Clones)

> **Objetivo:** mapear tudo que precisa mudar para transformar este projeto (hoje um app link-in-bio com **Supabase + Edge Functions + RLS + React 18**) num **template clonável** da fundação Masia (**React 19 + Vite SPA + Neon (por tenant) + tenant-gateway compartilhado + Better-Auth, sem RLS, sem backend próprio**).
>
> **Escopo:** só auditoria. Nada é implementado neste documento.
> **Fonte-da-verdade:** `Importantdoc.md` (guia oficial dos Apps Prontos).

---

## 0. Veredito rápido

O projeto **cabe hoje** na fundação (é essencialmente CRUD + telas + página pública tipo link-in-bio, categoria explicitamente citada no guia §A3 e §B6). **Não precisa estender o gateway** para o core, **exceto** para as **rotas públicas** (perfil público, clique em link, short-link, captura de lead, view tracking) — que hoje são Edge Functions do Supabase e no modelo novo precisam virar **rotas explícitas no `tenant-gateway`** (§B6). Isso exige alinhamento com o dono do gateway **antes** de portar.

Impacto geral: **alto** — praticamente toda a camada de dados/auth/backend é reescrita. A camada de UI (componentes, telas, design tokens, shadcn) é aproveitável quase inteira.

---

## 1. Stack — o que sai, o que entra

| Camada | Hoje (a remover) | Alvo (segundo guia §B3) |
|---|---|---|
| Framework | React **18.3** | **React 19** |
| Build | Vite 5 (SPA) ✅ já é SPA | **Vite 6** (SPA, `tsc && vite build`) |
| Roteamento | `react-router-dom` (v6 provável) com `BrowserRouter` ✅ | **`react-router-dom` 7** (BrowserRouter) |
| TypeScript | `strict: false`, `noUnusedLocals: false`, `strictNullChecks: false` | **strict + `noUnusedLocals: true`** — imports não usados quebram o build |
| Estilo | Tailwind v3 + shadcn/ui (tema dark) | **Scaffold `wiki`** (Tailwind v4 + shadcn "Atelier") — é o scaffold canônico dos apps "Pro" |
| Dados | `@supabase/supabase-js` direto no browser + RLS + Edge Functions | **`db` de `src/lib/data/client.ts`** falando com `tenant-gateway` via `/data/:table` |
| Auth | Supabase Auth + `@lovable.dev/cloud-auth-js` (Google OAuth), `useAuth` custom | **Better-Auth via `auth`** exposto pelo gateway (`auth.signIn/signUp/signOut/me`) |
| Banco | Supabase Postgres com RLS por `auth.uid()` e tabela `profiles` | **Neon (1 por tenant)**. **SEM RLS**, **SEM `auth.uid()`**, **SEM `profiles`**. Autz é no gateway. |
| Papéis | (implícito, dono do registro) | **admin / manager / rep** (+ owner). 1º usuário do tenant vira admin, demais são rep. |
| Backend próprio | 4 Edge Functions (`capture-lead`, `track-click`, `track-view`, `resolve-short-link`) | **Proibido** ter backend por app. Move para **rotas públicas no gateway** (§B6) ou some. |
| Deploy | Lovable | Build **1× compartilhado**, publish via `pnpm templates:publish` → R2 + KV, edge worker injeta tenant em runtime (§B10) |
| Env | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | **`VITE_GATEWAY_URL`** (único envContract permitido) |

**Proibidos no alvo (aparecem hoje e precisam sair):** Next.js (n/a), SSR, servidor por app, **Supabase**, Firebase, ORM no browser, `@supabase/supabase-js`, `@lovable.dev/cloud-auth-js`.

---

## 2. Estrutura de repositório — reorganização necessária

Hoje segue o layout Lovable padrão. O template Masia espera a estrutura descrita em §B2/§B7:

| Hoje | Alvo |
|---|---|
| `src/pages/**` + `src/pages/app/**` | `src/screens/**` (uma tela por arquivo, listada no `masi.template.json.screens`) |
| `src/hooks/use*.ts` (data hooks batendo em Supabase) | `src/lib/data/<x>.repo.ts` (repos usando `db.table(...)`) + hooks React Query finos que consumam os repos |
| `src/integrations/supabase/**` | **remover**. Substituir por `src/lib/data/client.ts` + `src/lib/data/types.gen.ts` (arquivos **protegidos** — não editáveis pela IA) |
| `src/hooks/useAuth.tsx` | `src/lib/auth.tsx` com `auth.me()` retornando `{ user, role }` |
| `src/App.tsx` / rotas inline | `App.tsx` + `app.routes.tsx` + `AppShell` + `RequireAuth` + `registry` (padrão dos scaffolds) |
| `supabase/migrations/**` (25 migrations, RLS, triggers, hooks) | **Uma única** `supabase/migrations/0001_business_schema.sql` reescrita conforme §B4 (mesmo diretório é ok — o guia mantém a pasta `supabase/migrations`, apenas o conteúdo muda) |
| `supabase/functions/**` (4 edge functions) | **remover** — funcionalidade vira rota pública do gateway (§B6) |
| `supabase/config.toml` | remover (não é usado no template) |
| — | **novo:** `masi.template.json` (manifest — §B7) |
| — | **novo:** `THIRD_PARTY.md` se qualquer markup for copiado de OSS (§A2) |
| — | **novo:** `preview-fixtures.ts` (dados-mock para o preview do editor IA) |

Arquivos **protegidos** obrigatórios (nunca editáveis pela IA, mesmo no scaffold `wiki`):
`src/lib/data/client.ts`, `src/lib/data/types.gen.ts`, `src/components/registry.tsx`, `src/main.tsx`, `supabase/migrations/**`, `src/components/ui/**`, `src/lib/utils.ts`, `vite.config.ts`, `components.json`, `preview-fixtures.ts`.

---

## 3. Auditoria do schema (o item mais sensível — §B4)

### 3.1 Tabelas atuais (inferidas de hooks/migrations/edge functions)

`profiles`, `pages`, `links`, `themes`, `leads`, `link_clicks`, `page_views`, `short_links`, `integrations`, provavelmente `user_roles` (padrão Lovable) + tabelas auxiliares das 25 migrations.

### 3.2 Problemas obrigatórios de resolver

| # | Problema | Regra violada | Ação |
|---|---|---|---|
| 1 | Tabela `profiles` existe e é usada para resolver `profile_id` (ver `ActivePageContext.tsx`) | §B4.2: **SEM tabela `profiles`** — usuário é o próprio `user` do Better-Auth | Eliminar `profiles`. Substituir `profile_id` por `owner_id text` referenciando `"user"(id)`. Campos de perfil (handle, bio, avatar) viram colunas da própria `pages` **ou** uma tabela `page_settings` com `owner_id`. |
| 2 | RLS ativo com políticas por `auth.uid()`, provavelmente triggers `handle_new_user`, `custom_access_token_hook` | §B4.2: **SEM RLS, SEM `auth.uid()`, SEM hooks** | Remover todas as políticas, triggers e funções relacionadas. Autz vira responsabilidade do gateway. |
| 3 | FKs apontam para `auth.users(id)` (uuid) | §B4.1: `owner_id **text** references "user"(id)` (id do Better-Auth é text) | Migrar tipo de todas as colunas de proprietário para `text` e trocar a FK para `"user"(id)` (com aspas) `on delete cascade`. |
| 4 | Tabelas-filhas (`links`, `leads`, `link_clicks`, `page_views`, `short_links`, `integrations`) hoje se apoiam em `page_id` / `profile_id` para autorização indireta | §B4.1 **gotcha RBAC**: toda tabela que o `rep` escreve precisa de **`owner_id` próprio**, inclusive filhas | Adicionar `owner_id text not null references "user"(id)` em **cada** tabela escrita pelo usuário (incluindo `links`, `leads`, `short_links`, `integrations`, e — se o rep puder mexer — `link_clicks`/`page_views`). Sem isso, `rep` toma 403. |
| 5 | Nomes: verificar se todos são `snake_case` minúsculo `^[a-z_][a-z0-9_]*$` | §B4.3 | Já parece ok; validar. |
| 6 | Nome `user_roles` conflita? Não — os proibidos são `user, session, account, verification, organization, member, invitation` | §B4.4 | **Renomear ou remover `user_roles`** — o RBAC do template usa os papéis `admin/manager/rep` do gateway, não uma tabela própria. Papéis não são de negócio; são do gateway. |
| 7 | Tabelas realmente "lookup" (ex.: `themes` se for catálogo) podem ficar sem `owner_id` | §B4.6 | Se `themes` for por-usuário → **precisa** `owner_id`. Se for catálogo global read-only → sem `owner_id` e read-only para `rep`. Decidir por tabela. |
| 8 | `id uuid` PK + `created_at`/`updated_at timestamptz` + trigger `touch_updated_at` | §B4.5 | Padronizar em todas as tabelas. |
| 9 | Múltiplas migrations (25) | §B4 / receita §11 | Consolidar em **uma** `0001_business_schema.sql` idempotente. |

### 3.3 Schema alvo — esboço (não implementar, só referência)

```
pages(id uuid PK, owner_id text→"user"(id), handle text, ...)
links(id uuid PK, owner_id text→"user"(id), page_id uuid, ...)
leads(id uuid PK, owner_id text→"user"(id), page_id uuid, email, ...)
short_links(id uuid PK, owner_id text→"user"(id), slug, target_url, ...)
integrations(id uuid PK, owner_id text→"user"(id), page_id uuid, provider, ...)
page_views(id uuid PK, owner_id text→"user"(id), page_id uuid, ...)   -- se rep grava
link_clicks(id uuid PK, owner_id text→"user"(id), link_id uuid, ...)  -- idem
themes(id uuid PK, name, tokens jsonb, ...)                            -- catálogo (sem owner_id)
```

---

## 4. Auditoria das rotas — página pública (§B6)

Este é o ponto **mais crítico** e o único que **exige extensão do gateway** (falar com o dono antes):

| Rota atual | Tipo | Alvo |
|---|---|---|
| `GET /:handle` e `/:handle/:pageSlug` (`PublicProfile.tsx`) | Página pública com dados públicos (link-in-bio) | Precisa de rota `GET /public/profile?handle=...` e `GET /public/links?page_id=...` no `tenant-gateway/src/routes/public.ts` (o guia cita **exatamente** que hoje já existe `LinkHub: /public/profile, /public/links, /public/links/:id/click` — **provavelmente já dá para reusar sem estender**, se o schema alvo bater) |
| `GET /l/:slug` (`ShortLink.tsx` + edge function `resolve-short-link`) | Redirect público | Nova rota pública no gateway ou reusar padrão existente |
| `POST capture-lead` (edge function) | Escrita pública (formulário) | O guia cita rotas públicas **Forms** (`/public/forms/:id`, `/responses`). Avaliar reuso. |
| `POST track-click` / `POST track-view` (edge functions) | Escrita pública (analytics) | O guia cita `/public/links/:id/click` — provavelmente reusável. Para `track-view`, pode precisar de nova rota pública. |

> **Ação obrigatória antes do porte:** confirmar com o dono do gateway se o schema esperado pelas rotas `LinkHub` públicas casa com o schema que vamos escrever. Se casar → sem extensão. Se não → alinhar mudança no gateway **antes** de prometer o template.

**Consequência de código:** todas as **4 edge functions** (`capture-lead`, `track-click`, `track-view`, `resolve-short-link`) são **deletadas**. A pasta `supabase/functions/` some.

---

## 5. Auditoria de auth

| Hoje | Alvo |
|---|---|
| Supabase Auth + Google OAuth via `@lovable.dev/cloud-auth-js` (`src/integrations/lovable/index.ts`) | Better-Auth via gateway. Sem OAuth por padrão (validar se Better-Auth do gateway suporta e se está exposto) |
| `useAuth.tsx` com `session`, `user`, `signOut` | `src/lib/auth.tsx` com `auth.me() → { user, role }` |
| `ProtectedRoute` verifica sessão Supabase | `RequireAuth` padrão dos scaffolds |
| Fluxo: `/login`, `/register`, `/forgot-password`, `/reset-password` | Better-Auth expõe `signIn`/`signUp`/`signOut`. **Reset/forgot password precisa ser confirmado** — se Better-Auth do gateway não expõe, essas telas somem. |
| Redirect OAuth para `window.location.origin` | n/a se OAuth sair |
| Papéis: não existem explicitamente (donidade por `owner_id` no Supabase RLS) | `admin/manager/rep` — decidir o modelo: link-in-bio é single-tenant-per-user; provavelmente **todo usuário vira admin do próprio tenant** (que é o comportamento padrão do 1º usuário). Times/co-editores não estão no escopo hoje. |

---

## 6. Auditoria da camada de dados (hooks)

Todos os hooks em `src/hooks/use*.ts` que hoje batem em `supabase.from(...)` precisam ser **reescritos** para consumir repos genéricos do gateway. Limites que impactam o design das telas (§B5):

- **Sem `GET /data/:table/:id`** → toda tela de detalhe (`LinksPage` editando um link, `PublicProfile` buscando 1 página por handle, `ShortLink` buscando 1 short link por slug) precisa mudar para **`list-then-find`** no front. **Exceto** as consultas públicas por slug/handle (`PublicProfile`, `ShortLink`) que exigem rota pública dedicada (§B6), pois nem sessão têm.
- **Sem filtro por query** → `useLinks(pageId)` hoje filtra `.eq('page_id', pageId)` no server; passará a puxar todos e filtrar no client. Aceitável para os volumes esperados (link-in-bio).
- **Sem joins** → onde há join implícito (`pages` + `themes`, `leads` + `pages`), fazer **2 queries** e juntar no client, **ou** desnormalizar (colar `theme_snapshot jsonb` em `pages`, por ex.).
- **`owner_id` nunca vai do front** — remover qualquer envio explícito.

Mapa de hooks para reescrita: `useAuth`, `useProfile`, `usePages`, `useLinks`, `useLeads`, `useTheme`, `useIntegrations`, `useAnalytics`, `useShortLinks`, `usePublicProfile`. Praticamente **todos**.

---

## 7. Auditoria da UI (o que é aproveitável)

| Aproveitamento | Detalhe |
|---|---|
| ✅ **Alto** | Componentes `src/components/**` (Modal, GlassCard, SortableLink, DesignSidebar, ThemeGallery, MobilePreview, IconSelector, LeadCaptureForm, QRCodeGenerator, etc.). Markup e visual. |
| ✅ **Alto** | Design tokens (`index.css`) — migrar para tokens compatíveis com o scaffold `wiki` (Tailwind v4) ou manter no `forms-nps` (CSS puro). |
| ✅ **Médio** | Telas `src/pages/app/*` viram `src/screens/*` — reescrevendo a camada de dados. |
| ⚠️ **Baixo** | Qualquer código que dependa de RLS/subscription realtime do Supabase (`.channel(...)`, `.on('postgres_changes')`). Precisa sair; não há realtime na fundação. |
| ⚠️ | `next-themes` — o guia não proíbe, mas os scaffolds têm o próprio esquema de dark mode. Avaliar remover. |
| ❌ | `src/integrations/supabase/**`, `src/integrations/lovable/**` — deletados. |

---

## 8. Config / build / deps

- `package.json`: subir `react` e `react-dom` para 19, `react-router-dom` para 7, `vite` para 6, remover `@supabase/supabase-js`, `@lovable.dev/cloud-auth-js`, `next-themes` (a avaliar). Adicionar deps que o scaffold traz (validar contra `wiki` ou `forms-nps`).
- `tsconfig.json`: ativar `strict`, `noUnusedLocals: true`, `strictNullChecks: true`. Isto vai expor **muitos** erros latentes no código atual — planejar esforço.
- `vite.config.ts`: remover `componentTagger` (Lovable) e alinhar com o do scaffold escolhido. **Fica protegido**.
- `.env`: substituir as três VITE_SUPABASE_* por **`VITE_GATEWAY_URL`** (única variável permitida pelo envContract).
- `components.json` (shadcn): manter/alinhar com scaffold `wiki`. **Fica protegido**.
- **`package-lock.json` commitado** e `vite build` **passando limpo, zero unused imports** — pré-requisito de publish (§B10).

---

## 9. Manifest `masi.template.json` (novo — §B7)

Precisa ser criado com, no mínimo:

- `id`: ex. `linkbio`
- `name`, `description`, `version: "1.0.0"`
- `engine: "vite-react-gateway"`
- `schemaVersion: 1`
- `migrations: ["0001_business_schema.sql"]`
- `auth: { provider: "better-auth", roles: ["admin","manager","rep"] }`
- `screens`: listar cada tela do dashboard (`/app`, `/app/links`, `/app/leads`, `/app/design`, `/app/analytics`, `/app/settings`, `/app/shortlinks`, `/app/form`) + página pública se aplicável
- `editable.allow`: `src/screens/**`, `src/components/**` (exceto `ui/**`), `src/lib/data/*.repo.ts`, `src/lib/format.ts`, `src/app.css`
- `editable.protect`: `src/lib/data/client.ts`, `types.gen.ts`, `registry.tsx`, `main.tsx`, `supabase/migrations/**`, `src/components/ui/**`, `src/lib/utils.ts`, `vite.config.ts`, `components.json`, `preview-fixtures.ts`
- `composio.toolkits: []` (ou os que fizerem sentido — ex. Mailchimp para leads)
- `envContract: ["VITE_GATEWAY_URL"]`

---

## 10. Publish / catálogo (§B10)

Fora de escopo deste projeto (é feito no monorepo `masi-ai-orquestration`), mas ficar ciente:

1. `cp -R` o template para `masi-ai-orquestration/clone-templates/linkbio/`.
2. `pnpm templates:publish linkbio https://masi-tenant-gateway.fly.dev` (**sempre** com o URL público — o guardrail bloqueia localhost).
3. `pnpm demo:publish linkbio`.
4. Criar migration em `masi-ai-orquestration/supabase/migrations/` inserindo em `clone_templates` + `clone_template_versions`.
5. **Redeploy do Fly** (API + worker) — sem isso, provisão dá `ENOENT`.
6. **Re-clonar** para testar (clones existentes ficam pinados).

---

## 11. Checklist final de mudanças (agrupado por esforço)

### 🔴 Alto esforço (reescrita)
- [ ] Reescrever schema em **uma** migration idempotente (§3)
- [ ] Migrar todas FKs de `auth.users(id) uuid` para `"user"(id) text`
- [ ] Adicionar `owner_id` em **toda** tabela escrita pelo `rep` — inclusive filhas
- [ ] Remover **RLS**, `auth.uid()`, triggers `handle_new_user`, `custom_access_token_hook`, tabela `profiles`, tabela `user_roles`
- [ ] Deletar `src/integrations/supabase/**` e `src/integrations/lovable/**`
- [ ] Reescrever **todos** os hooks para consumirem repos `db.table(...)`
- [ ] Rewrite `useAuth` → `src/lib/auth.tsx` (Better-Auth)
- [ ] Deletar **4 edge functions**; alinhar rotas públicas com o dono do gateway (§4)
- [ ] Ativar `strict` no tsconfig e corrigir erros expostos

### 🟡 Médio esforço
- [ ] Renomear `src/pages/**` → `src/screens/**` (menos as auth pages, que somem se Better-Auth cobrir tudo)
- [ ] Trocar padrão de rotas para `App.tsx` + `app.routes.tsx` + `AppShell` + `RequireAuth`
- [ ] Ajustar telas para o padrão **list-then-find** (sem get-by-id, sem filter, sem join)
- [ ] Subir para React 19, Vite 6, react-router-dom 7
- [ ] Remover `@supabase/supabase-js`, `@lovable.dev/cloud-auth-js`, avaliar `next-themes`
- [ ] Escolher scaffold (`wiki` recomendado — Pro shadcn) e portar tokens de design
- [ ] Criar `masi.template.json` (§9)
- [ ] Criar `preview-fixtures.ts` para o editor por IA

### 🟢 Baixo esforço
- [ ] Trocar `.env` para apenas `VITE_GATEWAY_URL`
- [ ] Remover `supabase/config.toml`, `componentTagger` do `vite.config.ts`
- [ ] `THIRD_PARTY.md` se houver markup copiado de OSS
- [ ] Garantir `package-lock.json` commitado, build limpo, zero unused imports

---

## 12. Bloqueadores / decisões pendentes (levantar ANTES de começar)

1. **Rotas públicas do gateway**: as `LinkHub` públicas existentes (`/public/profile`, `/public/links`, `/public/links/:id/click`) atendem 100% das necessidades? E `track-view` e `resolve-short-link`? — **Falar com o dono do gateway.**
2. **OAuth (Google)**: Better-Auth no gateway está com Google provider habilitado? Se não, a tela de login por Google **sai** do template.
3. **Reset/forgot password**: Better-Auth expõe? Se não, `ForgotPassword`/`ResetPassword` saem.
4. **`themes`**: catálogo global (sem `owner_id`) ou temas por usuário (com `owner_id`)? Afeta modelagem.
5. **Papéis**: link-in-bio single-user-per-tenant justifica `admin/manager/rep`? Provavelmente **todos são admin do próprio tenant** — validar UX.
6. **Analytics (`page_views`/`link_clicks`)**: dono é o `owner_id` da página, mesmo que o evento venha do público? Sim — o gateway grava via rota pública com `owner_id` derivado da página, não do visitante.

---

**Próximo passo sugerido:** levar este documento (em especial §4 e §12) para o dono do `tenant-gateway` e fechar as decisões pendentes antes de começar qualquer código.
