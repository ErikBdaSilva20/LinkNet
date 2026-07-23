# Bloco 5 — Telas & Rotas

> **Pré-requisito de leitura:** `Importantdoc.md` inteiro, com foco em **§B2** (mapa de
> repositórios), **§B7** (manifest, campo `screens`), **§B8** (auth & papéis) e a "Receita
> rápida" (passo 7). Leia também `docs/plano-construcao/00-INDEX.md` (princípios e decisões
> globais) antes de começar. Este arquivo é autocontido: quem abrir só ele, numa sessão nova,
> consegue executar sem reler a conversa que o originou.

## Objetivo

Mover as telas do dashboard de `src/pages/app/*.tsx` e as telas soltas de `src/pages/*.tsx`
para `src/screens/*.tsx` (uma tela = um arquivo, nome final em PascalCase + `Screen`), criar
`App.tsx` + `src/app.routes.tsx` seguindo o padrão da fundação Masia, ajustar/criar `AppShell`
e `src/components/registry.tsx`, e garantir que nenhuma tela dependa de busca por id/slug
via filtro server-side — tudo em list-then-find explícito, consumindo os hooks/repos que o
Bloco 4 já reescreveu.

## Por que este bloco existe

O contrato da fundação Masia (`Importantdoc.md` §B7) exige que o app clonável tenha uma pasta
`src/screens/**` (é o que entra em `editable.allow` e no manifest `screens: [...]`), um
`App.tsx`/`app.routes.tsx` de composição de rotas, e um `src/components/registry.tsx`
protegido. O app atual (clone Lovable) tem essa estrutura em `src/pages/**`, com rotas inline
dentro de `src/App.tsx` e sem `registry.tsx`. Sem este bloco, o template não bate com o formato
que o editor por IA e o empacotador (Bloco 7) esperam — a IA não teria uma pasta previsível
pra editar telas, e o manifest não teria como apontar `file: "src/screens/..."` pra nada real.

## Depende de / Habilita

- **Depende de:** Bloco 4 (camada de dados) — os hooks/repos que as telas vão consumir já
  existem com a assinatura `list-then-find` (sem `get-by-id`). Depende também, por extensão, do
  Bloco 3 (auth) — `RequireAuth` e `src/lib/auth.tsx` já existem e só são consumidos aqui.
- **Habilita:** Bloco 6 (página pública & tracking) — que só pode implementar o comportamento
  de `PublicProfileScreen`/`ShortLinkRedirectScreen` depois que este bloco decidir onde esses
  arquivos moram e com que hooks eles conversam. Habilita também o Bloco 7 (manifest &
  empacotamento), que usa a lista de telas produzida aqui pra preencher `screens: [...]` e
  `editable.allow`/`protect`.

## Decisões já tomadas (não reabrir)

Estas vieram do pedido original e de decisões globais do `00-INDEX.md` — não questione, só
aplique:

| Tema | Decisão |
|---|---|
| Auth (Bloco 3) | `RequireAuth` e `src/lib/auth.tsx` já existem e expõem sessão/papel/`signOut` etc. Este bloco só consome — não reimplementa nenhuma lógica de login/sessão. |
| Camada de dados (Bloco 4) | Hooks (`src/hooks/*`) e repos (`src/lib/data/*.repo.ts`) já foram reescritos para `list-then-find`, sem filtro server-side, imagens em base64. Este bloco só troca **quem chama** os hooks (as telas), nunca reimplementa o hook em si. |
| Produtos digitais / pagamento | Cortado. Nenhuma tela sobre isso — não recrie nenhum arquivo equivalente em `src/screens/`. |
| HTML customizado no `<head>` | Cortado (mantém só GA measurement ID e Meta Pixel ID). **Achado da investigação:** esse campo hoje **não** está em `SettingsPage.tsx` — está na aba de Integrações dentro de `LinksPage.tsx` (é lá que `IntegrationScripts`/`useIntegrations` são usados). Ao mover para `LinksScreen.tsx`, não é responsabilidade deste bloco remover o campo (isso é comportamento de tracking, Bloco 6) — só carregue o arquivo como está e **deixe uma nota inline** (`// TODO Bloco 6: remover campo de HTML customizado`) apontando pro Bloco 6 corrigir no lugar certo. |
| Escopo de telas públicas | `PublicProfileScreen`/`ShortLinkRedirectScreen`: este bloco decide só **onde o arquivo mora**; comportamento de tracking/agendamento/GA-Pixel é do Bloco 6. |
| Extensão de fundação | Fora de escopo em qualquer story. Se uma story parecer exigir mexer no gateway, ela está desenhada errado. |

## Regras obrigatórias (Importantdoc.md)

- **§B7 — manifest:** toda tela editável mora em `src/screens/**`; `src/components/registry.tsx`
  e `src/main.tsx` são **protegidos** (nunca editáveis pela IA, nunca reescritos à mão fora de
  uma mudança de contrato deliberada).
- **Receita rápida, passo 7:** "Telas: escreva `src/screens/*` + `App.tsx`/`app.routes.tsx`.
  Reaproveite `LoginScreen`/`AppShell`/`auth.tsx`/`RequireAuth`/`registry`/`main` (não mexa
  nesses)." — ou seja: `auth.tsx`, `RequireAuth`, `main.tsx` são consumidos, não recriados.
  `LoginScreen`, `AppShell` e `registry.tsx` são artefatos que este bloco cria/organiza no
  formato certo (eles não existiam ainda nesta base, que veio direto do Lovable).
- **Checklist do template:** "Telas fazem **list-then-filter** (sem get-by-id)." Nenhuma tela
  pode assumir que existe `GET /data/:table/:id` ou filtro server-side por slug/id.
- **§B5:** "NÃO há get-by-id nem filtro por query. Só `list/create/update/remove`." — qualquer
  tela que hoje pareça precisar de "pegar 1 registro específico" precisa on `.find()`/`.filter()`
  no client, em cima da lista completa que o hook devolve.
- **§B4/§B6:** este bloco não mexe em schema nem em rotas do gateway — só client-side.

## Boas práticas obrigatórias neste bloco

1. **Uma tela = uma responsabilidade = um arquivo.** Nada de duas telas conceituais dividindo o
   mesmo arquivo (ex.: config do formulário de captura e lista de leads são conceitos
   diferentes → ficam `LeadFormScreen.tsx` e `LeadsScreen.tsx`, nunca fundidos).
2. **Nada de lógica de fetch dentro do componente de tela.** Telas só chamam hooks (`useLinks`,
   `usePages`, etc.) ou `registry`/context (`useActivePage`). Nenhuma tela importa
   `@/integrations/supabase/client` nem qualquer client de dados diretamente — isso é sintoma de
   fetch vazando pra tela (achado real: `LinksPage.tsx` hoje importa `supabase` direto para
   upload de ícone; ver Story 5.1).
3. **Nomes de rota/arquivo consistentes.** Toda tela nova termina em `Screen` (ex.:
   `LinksScreen.tsx`), o nome do arquivo bate com o nome do componente exportado, e a rota no
   `app.routes.tsx` usa o mesmo segmento que já existia em produção (não renomeie URLs sem
   necessidade — evita quebrar links/QR codes/bookmarks já compartilhados pelos usuários finais).
4. **Evitar prop drilling usando contexto só onde já é padrão do projeto.** O projeto já usa
   `ActivePageContext` pra distribuir "qual página está ativa" entre telas do dashboard — continue
   usando esse padrão (não invente um segundo mecanismo). Não introduza contexto novo pra
   problemas que um hook simples resolve.
5. **Elimine duplicação estrutural ao mover.** Hoje cada uma das 8 telas de dashboard importa e
   envolve manualmente `<DashboardLayout>` dentro de si mesma. Ao migrar para `AppShell`, essa
   duplicação de import/wrap desaparece: o layout passa a viver **uma vez** na rota (`/app` como
   rota-pai com `<Outlet/>`), e cada tela vira conteúdo puro. Isso é uma mudança estrutural
   deliberada deste bloco (documentada na Story 5.4), não invenção — ela resolve uma duplicação
   real encontrada na investigação.

## Stories

### Story 5.1 — Mover as 8 telas do dashboard para `src/screens/*Screen.tsx`

- **Arquivos afetados** (mapeamento final; todos em `src/screens/`, pasta plana, sem
  subpastas — decisão consistente com o único exemplo do manifest em §B7, que usa
  `src/screens/TarefasScreen`, sem aninhamento):

  | Arquivo atual | Arquivo novo | Rota |
  |---|---|---|
  | `src/pages/app/AppHome.tsx` | `src/screens/HomeScreen.tsx` | `/app` |
  | `src/pages/app/LinksPage.tsx` | `src/screens/LinksScreen.tsx` | `/app/links` |
  | `src/pages/app/ShortLinksPage.tsx` | `src/screens/ShortLinksScreen.tsx` | `/app/shortlinks` |
  | `src/pages/app/FormPage.tsx` | `src/screens/LeadFormScreen.tsx` | `/app/form` |
  | `src/pages/app/LeadsPage.tsx` | `src/screens/LeadsScreen.tsx` | `/app/leads` |
  | `src/pages/app/DesignPage.tsx` | `src/screens/DesignScreen.tsx` | `/app/design` |
  | `src/pages/app/AnalyticsPage.tsx` | `src/screens/AnalyticsScreen.tsx` | `/app/analytics` |
  | `src/pages/app/SettingsPage.tsx` | `src/screens/SettingsScreen.tsx` | `/app/settings` |

- **O que fazer:**
  1. Mover (`git mv`) cada arquivo pro novo caminho/nome; renomear o componente exportado e o
     `export default` de acordo (ex.: `AppHome` → `HomeScreen`).
  2. Remover o `import { DashboardLayout } ...` e o wrap `<DashboardLayout>...</DashboardLayout>`
     de dentro de cada tela — o layout passa a vir da rota-pai (ver Story 5.4). A tela retorna
     só o conteúdo que hoje fica dentro do wrap.
  3. Atualizar imports internos que apontavam pro caminho antigo (`@/components/DashboardLayout`
     não deve mais aparecer em nenhuma tela).
  4. **`LinksScreen.tsx` especificamente:** remover o `import { supabase } from
     "@/integrations/supabase/client"` (hoje usado pra montar `fileName` de upload de ícone em
     Storage) e trocar pela função do hook/repo do Bloco 4 que já faz o upload como base64.
     Trocar `import type { Enums } from "@/integrations/supabase/types"` pelo tipo equivalente
     exposto pelo novo `src/lib/data/types.gen.ts` (Bloco 4) — é troca de import, não
     reimplementação de lógica de dados.
  5. **`DesignScreen.tsx` especificamente:** trocar `import type { Database } from
     "@/integrations/supabase/types"` pelo tipo equivalente em `src/lib/data/types.gen.ts`.
  6. Ajustar todos os imports em cada tela que ainda referenciam `@/integrations/supabase/*`
     para os módulos novos do Bloco 4 (hooks já devem ter sido migrados; se algum import velho
     sobreviver, é sinal de que a tela está chamando Supabase direto — troque pela chamada de
     hook equivalente).
- **Critério de aceite:**
  - As 8 telas existem em `src/screens/*Screen.tsx`, compilando (`tsc`) sem erros e sem import
    de `@/integrations/supabase/*` em nenhuma delas.
  - Nenhuma tela importa ou renderiza `DashboardLayout`/`AppShell` diretamente — todas retornam
    conteúdo puro.
  - `LinksScreen.tsx` não tem mais nenhum import de client de dados direto; upload de ícone passa
    pelo hook/repo do Bloco 4.
- **Fora de escopo:** reimplementar a lógica de upload/base64 (Bloco 4), reimplementar
  `types.gen.ts` (Bloco 4), remover o campo de HTML customizado da aba de Integrações (Bloco 6).

### Story 5.2 — Mover as telas do fluxo de auth e utilitárias

- **Arquivos afetados:**

  | Arquivo atual | Arquivo novo | Rota |
  |---|---|---|
  | `src/pages/Login.tsx` | `src/screens/LoginScreen.tsx` | `/login` |
  | `src/pages/Register.tsx` | `src/screens/RegisterScreen.tsx` | `/register` |
  | `src/pages/ForgotPassword.tsx` | `src/screens/ForgotPasswordScreen.tsx` | `/forgot-password` |
  | `src/pages/ResetPassword.tsx` | `src/screens/ResetPasswordScreen.tsx` | `/reset-password` |
  | `src/pages/Index.tsx` | `src/screens/LandingScreen.tsx` | `/` |
  | `src/pages/NotFound.tsx` | `src/screens/NotFoundScreen.tsx` | `*` |

- **Decisão:** essas telas fazem parte do fluxo de auth (Login/Register/Forgot/Reset) ou são
  utilitárias (Index é a landing pública, NotFound é o catch-all) — nenhuma delas é "dashboard",
  mas o guia não separa fisicamente auth/landing de dashboard dentro de `src/screens/`: o
  contrato só define `src/screens/**` como pasta única de telas editáveis. Por isso todas movem
  pra lá também, mantendo a pasta plana.
- **O que fazer:**
  1. Mover e renomear cada arquivo/componente conforme a tabela.
  2. **Não tocar em lógica interna de auth** — Login/Register/ForgotPassword/ResetPassword já
     tiveram a lógica de sessão resolvida no Bloco 3 (devem estar chamando `auth.signIn` /
     `auth.signUp` / `auth.resetPassword` de `src/lib/auth.tsx`, não mais `supabase.auth.*`). Se
     ao mover você encontrar algum import de `@/integrations/supabase/client` sobrevivendo
     nessas 4 telas, **não conserte aqui** — isso é uma pendência do Bloco 3 que ficou pra trás;
     registre como achado e sinalize, mas não implemente a troca de auth neste bloco.
  3. `Index.tsx`/`LandingScreen.tsx` e `NotFound.tsx`/`NotFoundScreen.tsx` não têm nenhuma
     dependência de dados ou auth — é mover/renomear puro, sem ajuste de import.
- **Critério de aceite:**
  - 6 arquivos existem em `src/screens/*Screen.tsx` com esses nomes exatos.
  - Nenhuma mudança de comportamento visível nessas telas além do rename.
  - Qualquer import de Supabase remanescente nas 4 telas de auth foi **anotado** (comentário ou
    lista no PR), não corrigido aqui.
- **Fora de escopo:** lógica de `signIn`/`signUp`/`resetPassword` (Bloco 3).

### Story 5.3 — Mover as telas públicas (`PublicProfile`/`ShortLink`)

- **Arquivos afetados:**

  | Arquivo atual | Arquivo novo | Rota(s) |
  |---|---|---|
  | `src/pages/PublicProfile.tsx` | `src/screens/PublicProfileScreen.tsx` | `/:handle`, `/:handle/:pageSlug` |
  | `src/pages/ShortLink.tsx` | `src/screens/ShortLinkRedirectScreen.tsx` | `/l/:slug` |

- **Decisão (registrada por não haver regra explícita no guia sobre pasta pública vs.
  dashboard):** ambas ficam em `src/screens/` junto com as demais, na mesma pasta plana. Razão:
  o manifest (§B7) só reconhece uma raiz de telas editáveis (`src/screens/**` em
  `editable.allow`); criar uma segunda pasta (`src/screens/public/` ou `src/pages/public/`) fora
  desse padrão faria essas duas telas escaparem do allow-list do editor por IA sem necessidade —
  e elas continuam sendo telas React normais, só que sem `RequireAuth` em volta na rota. A
  distinção "pública vs. autenticada" é resolvida **na rota** (`app.routes.tsx`), não na
  localização do arquivo.
- **O que fazer:**
  1. Mover e renomear os dois arquivos.
  2. **Não alterar comportamento de tracking, agendamento (`schedule_enabled`) nem
     GA/Pixel** — isso é Bloco 6. A única mudança aqui é local do arquivo e nome do componente/
     export default.
  3. Confirmar que ambos continuam usando `useParams` (`:handle`/`:pageSlug` e `:slug`) — isso é
     normal e esperado: são as únicas duas telas do app que legitimamente recebem parâmetro de
     rota, porque são o destino final do link público, não uma consulta ao gateway autenticado.
     O jeito como o hook por trás delas (`usePublicProfile`, hook de short link) resolve esse
     parâmetro em cima da lista completa (list-then-find) é decisão de dado do Bloco 4/6, não
     deste bloco.
- **Critério de aceite:**
  - Os 2 arquivos existem em `src/screens/*Screen.tsx`.
  - Nenhuma diferença de comportamento/import de dados além do rename.
- **Fora de escopo:** qualquer ajuste de tracking, GA/Pixel, agendamento, ou lógica interna do
  hook de resolução de handle/slug (Bloco 6).

### Story 5.4 — Criar `AppShell` como layout de rota

- **Arquivos afetados:** `src/components/DashboardLayout.tsx` → `src/components/AppShell.tsx`
  (rename), `src/app.routes.tsx` (consumo).
- **O que fazer:**
  1. Renomear o arquivo e o componente exportado de `DashboardLayout` para `AppShell`.
  2. Trocar a prop `children: React.ReactNode` por render via `<Outlet/>` do
     `react-router-dom` — `AppShell` deixa de receber conteúdo por prop e passa a ser usado como
     `element` de uma rota-pai (`/app`) que engloba as 8 rotas-filhas do dashboard.
  3. Manter toda a lógica visual existente (sidebar, `navItems`, `PageSelector`, `ThemeToggle`,
     botão de sair via `useAuth`/`auth.tsx`) — só troca `{children}` por `<Outlet/>` e o nome do
     componente. `navItems` continua apontando pros mesmos 8 paths (`/app`, `/app/links`, etc.).
  4. Trocar o import de `useAuth` do hook antigo pro `auth.tsx`/`RequireAuth` do Bloco 3 (mesma
     função — `signOut`, `user` —, módulo novo).
- **Critério de aceite:**
  - `src/components/AppShell.tsx` existe, exporta `AppShell`, usa `<Outlet/>`.
  - Nenhuma das 8 telas de dashboard importa mais `AppShell` ou `DashboardLayout` diretamente
    (isso já foi garantido na Story 5.1) — só `app.routes.tsx` importa `AppShell`.
  - `DashboardLayout.tsx` não existe mais (foi renomeado, não duplicado).
- **Fora de escopo:** redesenhar o layout visualmente; isso é só uma mudança estrutural
  (prop → Outlet), não uma reforma de UI.

### Story 5.5 — Criar `src/components/registry.tsx` (protegido)

- **Arquivos afetados:** `src/components/registry.tsx` (novo, arquivo protegido conforme §B7).
- **O que fazer:**
  1. Criar um barrel file que reexporta os componentes de `src/components/*` que são
     reaproveitados por mais de uma tela (não os primitivos de `src/components/ui/**`, que já
     são a "biblioteca base" do shadcn e não precisam de um segundo nível de indireção). Lista
     levantada na investigação (usados em ≥2 dos arquivos movidos nas Stories 5.1–5.3):
     `GlassCard`, `PageContainer`, `AppShell`, `ThemeToggle`, `NavLink`, `PageSelector`,
     `SortableLinksList`, `SortableLinkCard`, `IconSelector`/`DynamicIcon`, `QRCodeGenerator`,
     `FileUpload`, `MobilePreview`, `AddLinkModal`, `CreatePageModal`, `LeadCaptureForm`,
     `LeadFormFieldsConfigurator`, `IntegrationScripts`, `SocialIconsBar`, `AnimatedBackground`,
     `SEOHead`.
  2. Marcar o arquivo como protegido: ele entra na lista `protect` do `masi.template.json` (a
     edição desse campo é do Bloco 7, mas deixe um comentário no topo do arquivo — `// PROTEGIDO
     — não editável pela IA (ver masi.template.json > editable.protect)` — pra quem olhar o
     arquivo sem o manifest à mão já saber a regra).
  3. Não mover os arquivos-fonte dos componentes (eles continuam em `src/components/*.tsx`); o
     registry só reexporta.
- **Critério de aceite:**
  - `src/components/registry.tsx` existe, compila, reexporta pelo menos os componentes
    listados acima, e nenhuma tela em `src/screens/` **precisa** importar diretamente de
    `src/components/<Nome>.tsx` quando o componente já está no registry (prefira importar via
    registry nas telas novas/tocadas neste bloco — não é obrigatório caçar e trocar 100% dos
    imports em telas que não foram tocadas, mas qualquer tela movida nas Stories 5.1–5.3 deve
    importar do registry, não do arquivo individual).
- **Fora de escopo:** decidir o conteúdo final de `editable.allow`/`protect` no manifest (Bloco
  7 grava o JSON; aqui só criamos o arquivo e documentamos a intenção).

### Story 5.6 — Criar `App.tsx` + `src/app.routes.tsx`

- **Arquivos afetados:** `src/App.tsx` (reescrito), `src/app.routes.tsx` (novo). `src/main.tsx`
  **não muda** (é protegido — só importa `App` de `./App.tsx`, que já é o contrato hoje).
- **O que fazer:**
  1. Criar `src/app.routes.tsx` exportando um componente `AppRoutes` com toda a árvore de
     `<Routes>`/`<Route>`, importando as telas de `src/screens/*` (nomes da Story 5.1–5.3) e
     `RequireAuth` de `src/lib/auth.tsx` (Bloco 3) e `AppShell` de `@/components/AppShell`
     (Story 5.4). Esboço de referência (implementar exatamente esta forma, ajustando só nomes
     se algo mudar nas stories anteriores):

     ```tsx
     // src/app.routes.tsx
     import { Routes, Route } from "react-router-dom";
     import { RequireAuth } from "@/lib/auth";
     import { AppShell } from "@/components/AppShell";

     import LandingScreen from "@/screens/LandingScreen";
     import LoginScreen from "@/screens/LoginScreen";
     import RegisterScreen from "@/screens/RegisterScreen";
     import ForgotPasswordScreen from "@/screens/ForgotPasswordScreen";
     import ResetPasswordScreen from "@/screens/ResetPasswordScreen";
     import PublicProfileScreen from "@/screens/PublicProfileScreen";
     import ShortLinkRedirectScreen from "@/screens/ShortLinkRedirectScreen";
     import NotFoundScreen from "@/screens/NotFoundScreen";

     import HomeScreen from "@/screens/HomeScreen";
     import LinksScreen from "@/screens/LinksScreen";
     import ShortLinksScreen from "@/screens/ShortLinksScreen";
     import LeadFormScreen from "@/screens/LeadFormScreen";
     import LeadsScreen from "@/screens/LeadsScreen";
     import DesignScreen from "@/screens/DesignScreen";
     import AnalyticsScreen from "@/screens/AnalyticsScreen";
     import SettingsScreen from "@/screens/SettingsScreen";

     export function AppRoutes() {
       return (
         <Routes>
           <Route path="/" element={<LandingScreen />} />
           <Route path="/login" element={<LoginScreen />} />
           <Route path="/register" element={<RegisterScreen />} />
           <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
           <Route path="/reset-password" element={<ResetPasswordScreen />} />

           <Route path="/:handle" element={<PublicProfileScreen />} />
           <Route path="/:handle/:pageSlug" element={<PublicProfileScreen />} />
           <Route path="/l/:slug" element={<ShortLinkRedirectScreen />} />

           <Route
             path="/app"
             element={
               <RequireAuth>
                 <AppShell />
               </RequireAuth>
             }
           >
             <Route index element={<HomeScreen />} />
             <Route path="links" element={<LinksScreen />} />
             <Route path="shortlinks" element={<ShortLinksScreen />} />
             <Route path="form" element={<LeadFormScreen />} />
             <Route path="leads" element={<LeadsScreen />} />
             <Route path="design" element={<DesignScreen />} />
             <Route path="analytics" element={<AnalyticsScreen />} />
             <Route path="settings" element={<SettingsScreen />} />
           </Route>

           <Route path="*" element={<NotFoundScreen />} />
         </Routes>
       );
     }
     ```

  2. Reescrever `src/App.tsx` pra só compor providers (`QueryClientProvider`, `ThemeProvider`,
     `AuthProvider` — importado de `@/lib/auth`, não mais `@/hooks/useAuth` —,
     `ActivePageProvider`, `TooltipProvider`, `Toaster`/`Sonner`, `BrowserRouter`) em volta de
     `<AppRoutes />`. Nenhuma `<Route>` fica solta dentro de `App.tsx` — toda a árvore de rotas
     vive em `app.routes.tsx`.
  3. Confirmar que `ActivePageProvider` continua envolvendo as rotas do dashboard (ele é
     consumido só pelas telas de `/app/*`, mas por simplicidade pode continuar no topo — o custo
     de montá-lo fora do dashboard é baixo e evita duplicar providers dentro da rota `/app`).
- **Critério de aceite:**
  - `npm run build` (`tsc && vite build`) passa limpo, sem imports não usados.
  - Navegar para cada uma das rotas antigas (`/`, `/login`, `/register`, `/forgot-password`,
    `/reset-password`, `/:handle`, `/l/:slug`, `/app`, `/app/links`, `/app/shortlinks`,
    `/app/form`, `/app/leads`, `/app/design`, `/app/analytics`, `/app/settings`, rota
    inexistente) renderiza a tela certa, com `/app/*` continuando a exigir sessão.
  - `src/App.tsx` não contém nenhum `<Route>` inline — só providers + `<AppRoutes />`.
- **Fora de escopo:** qualquer lógica nova de autorização por papel (`admin`/`manager`/`rep`)
  nas rotas — isso, se necessário, é decisão de UI dentro de cada tela (Bloco 3 já expõe `role`
  pra isso), não deste bloco.

### Story 5.7 — Auditoria e ajuste do padrão list-then-find nas telas

- **Investigação já feita (resumo, não repita a varredura):** nenhuma tela de
  `src/pages/app/*.tsx` faz `useParams` ou filtro server-side por id/slug — todas trabalham em
  cima da lista completa devolvida pelos hooks (ex.: `LinksPage.tsx` já faz
  `links.find((l) => l.is_featured && l.id !== link.id)` e `pages.find((p) => p.id ===
  formData.targetPageId)` em cima de arrays vindos de hook, não de query nova). O único ponto
  real de busca "por 1 registro específico" fora dos hooks está em
  `src/contexts/ActivePageContext.tsx`, que hoje:
  1. Busca o profile do usuário com `supabase.from("profiles").select("*").eq("user_id",
     user.id).maybeSingle()` — filtro server-side por `user_id`.
  2. Busca as páginas do profile com `supabase.from("pages").select("*").eq("profile_id",
     profile.id)` — filtro server-side por `profile_id`.

  > **Correção pós-sincronização:** o Bloco 2 (`02-schema-migracao.md`, Decisão 1) eliminou
  > `profiles` — os dois passos acima colapsam num só depois do Bloco 4: `listPages()`, sem
  > indireção nenhuma. O passo a passo abaixo já foi ajustado para refletir isso.
  3. **Já** faz list-then-find corretamente na escolha da página ativa dentro da lista
     (`pages.find((p) => p.id === activePageId) || pages[0] || null`) — esse trecho está certo
     e deve ser preservado como está.
- **Arquivos afetados:** `src/contexts/ActivePageContext.tsx`.
- **O que fazer:**
  1. Trocar as duas queries Supabase diretas (profile por `user_id`, pages por `profile_id`)
     por uma chamada só ao `usePages`/`pages.repo.ts` do Bloco 4 (que já devolve a lista inteira
     que o gateway permite ver — `list()` sem filtro adicional, já que o gateway só devolve as
     `pages` do próprio dono). Não existe mais um "profile" separado para buscar.
  2. Preservar exatamente a lógica já existente de seleção de página ativa (linhas do `find`/
     `useEffect` de auto-seleção) — ela já segue o padrão certo, só troca a origem dos dados.
  3. Confirmar que nenhuma tela movida nas Stories 5.1–5.3 reintroduz busca por id/slug — checagem
     rápida: refazer o mesmo grep usado na investigação (`useParams`, `.eq(`, `.single(`,
     `getById`) dentro de `src/screens/*.tsx` depois da migração; só `PublicProfileScreen` e
     `ShortLinkRedirectScreen` devem aparecer com `useParams` (esperado — são as telas públicas,
     Story 5.3).
- **Critério de aceite:**
  - `ActivePageContext.tsx` não importa mais `@/integrations/supabase/client` nem faz `.eq(`/
    `.maybeSingle()` direto — só consome hooks do Bloco 4 e faz `.find()`/`.filter()`.
  - Grep por `useParams` dentro de `src/screens/` retorna só `PublicProfileScreen.tsx` e
    `ShortLinkRedirectScreen.tsx`.
  - Grep por `.eq(`/`.single(`/`.maybeSingle(`/`getById` dentro de `src/screens/` e
    `src/contexts/` não retorna nada.
- **Fora de escopo:** reescrever o hook `useProfile`/`usePages` em si (Bloco 4) — aqui só se
  troca quem os chama.

### Story 5.8 — Lista de telas candidatas ao manifest (`screens:`)

- **Arquivos afetados:** nenhum (story de documentação/handoff — o `masi.template.json` em si é
  do Bloco 7).
- **O que fazer:** registrar, pra o Bloco 7 usar sem precisar reinvestigar, quais telas fazem
  sentido entrar no array `screens: [...]` do manifest (as que a IA/editor deve listar como
  "telas do app" — tipicamente as telas de dashboard, que são o que o usuário do template edita
  visualmente; telas de auth/landing/pública costumam ficar de fora porque são reaproveitadas da
  fundação ou resolvidas por rota pública, não por edição de tela). Lista proposta:

  | id | route | title | file |
  |---|---|---|---|
  | `home` | `/app` | Início | `src/screens/HomeScreen` |
  | `links` | `/app/links` | Botões/Links | `src/screens/LinksScreen` |
  | `shortlinks` | `/app/shortlinks` | Encurtador | `src/screens/ShortLinksScreen` |
  | `form` | `/app/form` | Formulário de Captura | `src/screens/LeadFormScreen` |
  | `leads` | `/app/leads` | Leads | `src/screens/LeadsScreen` |
  | `design` | `/app/design` | Design | `src/screens/DesignScreen` |
  | `analytics` | `/app/analytics` | Analytics | `src/screens/AnalyticsScreen` |
  | `settings` | `/app/settings` | Configurações | `src/screens/SettingsScreen` |

  Telas fora dessa lista (`LoginScreen`, `RegisterScreen`, `ForgotPasswordScreen`,
  `ResetPasswordScreen`, `LandingScreen`, `NotFoundScreen`, `PublicProfileScreen`,
  `ShortLinkRedirectScreen`) existem em `src/screens/` mas **a decisão de incluí-las ou não em
  `screens:`** é do Bloco 7 — aqui só sinalizamos que elas não são óbvias candidatas por não
  serem "telas de edição do produto do usuário".
- **Critério de aceite:** a tabela acima existe neste documento (serve de referência copiável
  pro Bloco 7) e cobre as 8 telas de dashboard com `id`/`route`/`title`/`file` definidos.
- **Fora de escopo:** editar `masi.template.json` de fato (Bloco 7).

## Definition of Done do bloco

**Status: concluído em 2026-07-23.** Correções feitas durante a execução (plano original tinha
premissas que o Bloco 3/4 já haviam mudado):

- Rotas de `ForgotPassword`/`ResetPassword` **não existem** (Bloco 3 escolheu Caminho B) — não
  foram movidas nem entraram em `app.routes.tsx`. Se reintroduzidas no futuro, seguem o padrão
  das demais telas de auth.
- Endereçamento público é `/:handle` (um nível só) — a rota `/:handle/:pageSlug` **não existe**
  mais (Bloco 2 fundiu profiles+pages). `PublicProfileScreen`/`usePublicProfile` ajustados de
  acordo (sem `profile` separado, só `page`).
- `PageSelector.tsx` e `CreatePageModal.tsx` (componentes do registry, não telas) quebravam por
  causa da fusão de schema (`p.slug` não existe mais, `isValidSlug`→`isValidHandle`,
  `CreatePageInput.slug`→`.handle`) — corrigidos aqui mesmo, já que fazem parte do registry
  criado nesta execução e sem eles o registry não compilava.
- A alegação original de que o campo de HTML customizado ficava "na aba de Integrações dentro de
  LinksPage.tsx" **não se confirmou** — não existe nenhuma UI de configuração de GA/Pixel/HTML em
  nenhuma tela atual (só o hook `useIntegrations` existe, sem form consumindo). Não há nada a
  remover/anotar no Bloco 6 além do que já foi tratado em `PublicProfileScreen`/`IntegrationScripts`.

Checklist:

- [x] `src/pages/` não existe mais — todo o conteúdo relevante foi movido para
      `src/screens/*.tsx`, pasta plana, um arquivo por tela, todos terminando em `Screen`.
- [x] `src/components/AppShell.tsx` existe (renomeado de `DashboardLayout.tsx`), usa `<Outlet/>`,
      e nenhuma tela o importa diretamente — só `app.routes.tsx`.
- [x] `src/components/registry.tsx` existe, reexporta os componentes reaproveitados, marcado
      como protegido (comentário no topo).
- [x] `src/App.tsx` só compõe providers + `<AppRoutes />`; `src/app.routes.tsx` concentra toda a
      árvore de rotas, consumindo `RequireAuth` (Bloco 3) e as telas novas.
- [x] Nenhuma tela em `src/screens/` importa `@/integrations/supabase/*`. `src/integrations/supabase/`
      em si **ainda não foi apagado** — nenhum arquivo o importa mais a partir de `src/screens/`
      ou `src/components/`, então o passo final da Story 4.1 (Bloco 4) já pode ser executado por
      quem pegar o Bloco 6/7: rodar `grep -r "@/integrations/supabase" src/` (deve dar vazio) e
      então `rm -rf src/integrations/supabase`.
- [x] `ActivePageContext.tsx` consome `pages.repo.ts` (Bloco 4) com `.find()` no client, sem
      Supabase.
- [x] Grep de `useParams` em `src/screens/` só aparece em `PublicProfileScreen.tsx` e
      `ShortLinkRedirectScreen.tsx`; grep de `.eq(`/`.single(`/`getById` em `src/screens/` e
      `src/contexts/` não retorna nada.
- [x] `npx tsc --noEmit -p tsconfig.app.json` e `npx vite build` passam limpos — **0 erros**,
      exceto 1 erro pré-existente conhecido em `IntegrationScripts.tsx` (`TS2774`, bug real de
      lógica no snippet do Meta Pixel — já era do baseline do Bloco 1, atribuído à Story 6.5 do
      Bloco 6, que reescreve esse arquivo por completo).
- [x] Tabela de telas candidatas ao manifest (Story 5.8) já estava escrita neste arquivo.
