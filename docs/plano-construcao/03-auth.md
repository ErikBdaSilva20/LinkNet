# Bloco 3 — Auth

## Objetivo

Substituir o auth atual (Supabase Auth + OAuth Google/Apple via `@lovable.dev/cloud-auth-js`)
por **email/senha via Better-Auth do `tenant-gateway`**, com um único ponto de verdade de
sessão/papel no app (`src/lib/auth.tsx`), consumido por todas as telas e componentes que hoje
dependem do hook antigo.

## Por que este bloco existe

O app clonado **nunca** deve ter auth próprio nem falar com Supabase — o login/sessão é 100%
do `tenant-gateway` (Better-Auth). Hoje `src/hooks/useAuth.tsx` fala direto com
`supabase.auth.*`, e `src/integrations/lovable/index.ts` é um pacote **proprietário da
Lovable** (não existe fora da plataforma deles) usado só pra OAuth. Os dois têm que sumir do
runtime de auth antes de o app poder rodar na fundação Masia.

## Depende de / Habilita

- **Depende de:**
  - Bloco 2 (schema/migração) — papéis `admin/manager/rep` + `owner_id text references "user"(id)`
    já definidos no modelo mental do projeto (o app só *lê* `role`, quem decide é o gateway).
  - `src/lib/data/client.ts` — o arquivo **protegido** que expõe `db` **e** `auth`. **Correção de
    execução (2026-07-23):** este arquivo é tecnicamente escopo do **Bloco 4** (Story 4.1), não
    do Bloco 1 como este texto dizia originalmente — era uma dependência circular no plano (Bloco
    3 dependia de um arquivo que só o Bloco 4, posterior, criava). Resolvido puxando a Story 4.1
    do Bloco 4 pra ser executada **antes** do resto deste bloco: `src/lib/data/client.ts`,
    `types.gen.ts` e `preview-fixtures.ts` já existem no repo neste ponto da execução. Ver nota
    espelhada em `04-camada-de-dados.md`.
- **Habilita:**
  - Bloco 4 (Camada de dados/Repos) — os repos podem assumir que existe sessão autenticada e
    que `owner_id` é setado pelo gateway a partir dela (nunca pelo front).
  - Bloco 5 (Telas & Rotas) — as telas de dashboard podem usar `role` só pra esconder/mostrar
    ações de UI, sabendo que a real autorização já está garantida no gateway.

## Decisões já tomadas (não reabrir)

- **Auth final: email/senha via Better-Auth, ponto final.** Sem OAuth Google/Apple.
- `@lovable.dev/cloud-auth-js` e `src/integrations/lovable/**` são **deletados** — não são
  código genérico portável, são proprietários da Lovable.
- `@supabase/supabase-js` sai do runtime de **auth** neste bloco. A remoção do pacote inteiro do
  `package.json` (incluindo usos em dados, que ainda existem até o Bloco 4) é conferida no
  **Bloco 7** — não é trabalho deste bloco.
- Papéis `admin / manager / rep` (+ owner = criador) e "1º usuário do tenant vira admin" são
  **comportamento do gateway**. Este bloco só **lê** `role` de `auth.me()` pra UI — não
  implementa nem simula essa regra no app.
- Nenhuma story aqui pode pedir extensão de fundação (o gateway já expõe o que este bloco
  precisa para login/cadastro/logout; qualquer capacidade além disso é a pergunta em aberto
  abaixo, não uma feature nova a pedir).

## Pergunta em aberto (depende de informação externa, não é decisão de produto)

**O `tenant-gateway` (Better-Auth) expõe recuperação/redefinição de senha (forget-password /
reset-password) hoje?** O `Importantdoc.md` (§B8) não confirma isso — é capacidade técnica do
gateway, fora do controle desta sessão, e **precisa ser checada** (no repo `tenant-gateway` ou
com quem o mantém) antes de decidir o destino de `ForgotPassword.tsx`/`ResetPassword.tsx`.
Não adivinhe a resposta. A Story 3.5 abaixo descreve os dois caminhos possíveis (A/B) — quem
executar este bloco escolhe o caminho **depois** de confirmar a capacidade real do gateway.

## Regras obrigatórias (Importantdoc.md)

- §B3: Auth é **Better-Auth via `auth` de `client.ts`** — "NUNCA implemente auth próprio".
  Nenhuma chamada a `supabase.auth.*` pode sobrar em código de sessão/login/cadastro/logout.
- §B8: "Login/cadastro são do Better-Auth no gateway (`auth.signIn/signUp/signOut`)". Papéis
  `admin/manager/rep` (+owner); 1º usuário do tenant vira admin automaticamente (comportamento
  do gateway, não do app). `src/lib/auth.tsx` lê sessão + papel (`auth.me()` → `{ user, role }`).
  **Use `role` só pra UI** (esconder botões) — a segurança real é no gateway.
- Recipe (item 7, seção "Receita rápida"): reaproveite o padrão `auth.tsx` / `RequireAuth` —
  são os nomes que a fundação usa para essa camada, não invente nomes alternativos.
- Checklist do template: "Zero `@supabase`, zero fetch cru pro banco, zero auth próprio. Acesso
  só via `db`/`auth`." — vale integralmente para tudo que este bloco toca.

## Boas práticas obrigatórias neste bloco

- **Um único ponto de verdade pra sessão**: só `src/lib/auth.tsx` chama o cliente Better-Auth
  (`auth.me()`/`signIn`/`signUp`/`signOut`). Nenhum componente ou outro hook deve importar o
  cliente Better-Auth diretamente nem duplicar o `useEffect` de carregar sessão.
- **Nunca checar `role` no client como única barreira de segurança** — é só UI (esconder
  botão/rota visualmente). A autorização de verdade é sempre no gateway.
- **Não duplicar lógica de redirect em cada tela**: quem decide redirecionar por falta de
  sessão é **só** `RequireAuth`. Telas de dashboard não devem reimplementar checagem de
  `user`/`loading` para decidir navegar pro `/login`.
- Nomes e formato de retorno de `useAuth()`/`auth.me()` seguem o contrato do guia
  (`{ user, role }`) — isso é o que permite trocar de scaffold no futuro sem retrabalho.
- Mensagens de erro de login/cadastro seguem o padrão de toast já usado no app (`useToast`),
  sem vazar detalhes internos da resposta do gateway.

## Stories

### Story 3.1 — Remover auth antigo (Supabase hook + OAuth Lovable)

- **Arquivos afetados:**
  - `src/hooks/useAuth.tsx` (deletar)
  - `src/integrations/lovable/index.ts` (deletar — é o único arquivo da pasta; deletar a pasta
    `src/integrations/lovable/` inteira)
- **O que fazer:**
  - Deletar os dois arquivos/pasta acima.
  - Não tocar em `src/integrations/supabase/client.ts` nem `src/integrations/supabase/types.ts`
    — esses seguem existindo até o Bloco 4 remover os hooks de **dados** que ainda usam
    Supabase (`useProfile.ts`, `usePages.ts`, `ActivePageContext.tsx`). Deletar esse client
    agora quebraria código que não é deste bloco.
  - Não editar `package.json` (nem remover `@lovable.dev/cloud-auth-js` / `@supabase/supabase-js`
    das dependências) — isso é conferido no Bloco 7.
- **Critério de aceite:**
  - [x] `src/hooks/useAuth.tsx` e `src/integrations/lovable/` não existem mais no repo.
  - [x] Nenhum arquivo em `src/` importa mais de `@/integrations/lovable` ou de
    `@lovable.dev/cloud-auth-js` (grep limpo — confirmado).
  - [x] `src/integrations/supabase/client.ts` e `types.ts` continuam intactos (ainda usados por
    hooks de dados fora deste bloco).
- **Fora de escopo:** remover `@supabase/supabase-js`/`@lovable.dev/cloud-auth-js` do
  `package.json`; mexer em qualquer hook de dados (`useProfile.ts`, `usePages.ts`,
  `ActivePageContext.tsx`) além do necessário na Story 3.6.

### Story 3.2 — Criar `src/lib/auth.tsx` (contrato Better-Auth)

- **Arquivos afetados:** `src/lib/auth.tsx` (novo)
- **O que fazer:** criar o arquivo com a interface mínima que os consumidores reais do repo
  precisam (levantados por grep nesta sessão: `App.tsx`, `ProtectedRoute`/`RequireAuth`,
  `Login.tsx`, `Register.tsx`, `ActivePageContext.tsx`, `useProfile.ts`, `DashboardLayout.tsx`,
  `AppHome.tsx`). O guia (§B5/§B8) não dá o código completo — desenhe seguindo este contrato:

  ```tsx
  // src/lib/auth.tsx
  import { createContext, useContext, useEffect, useState, ReactNode } from "react";
  import { auth as gatewayAuth } from "./data/client"; // cliente Better-Auth exposto por client.ts (protegido, §B5)

  export type Role = "admin" | "manager" | "rep";

  export interface AuthUser {
    id: string;
    email: string;
    name?: string | null;
  }

  interface AuthContextValue {
    user: AuthUser | null;
    role: Role | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
  }

  const AuthContext = createContext<AuthContextValue>({
    user: null,
    role: null,
    loading: true,
    signIn: async () => ({ error: "not initialized" }),
    signUp: async () => ({ error: "not initialized" }),
    signOut: async () => {},
  });

  export function AuthProvider({ children }: { children: ReactNode }) {
    // carrega auth.me() no mount, expõe { user, role, loading }
    // implementa signIn/signUp/signOut chamando gatewayAuth e recarregando auth.me()
    // ...
  }

  export const useAuth = () => useContext(AuthContext);
  ```

  - `signIn`/`signUp`/`signOut` **só** email/senha — nenhuma opção de provider OAuth na
    assinatura.
  - `AuthProvider` deve carregar `auth.me()` uma vez no mount (equivalente ao antigo
    `getSession()`) e expor `loading` enquanto isso não resolve — **não** existe mais
    `onAuthStateChange` (isso é padrão específico do Supabase); se o cliente Better-Auth da
    fundação expuser algum listener de mudança de sessão, use-o, senão recarregue `auth.me()`
    logo após `signIn`/`signUp`/`signOut` resolverem.
  - Mantenha os nomes de campo (`user`, `loading`, `signOut`) iguais aos do hook antigo sempre
    que possível, para minimizar o diff nos consumidores atualizados na Story 3.6.
- **Critério de aceite:**
  - [x] `src/lib/auth.tsx` exporta `AuthProvider` e `useAuth()` com a forma acima (implementado
        com `refreshSession` via `auth.me()` + `signIn`/`signUp` recarregando a sessão após
        sucesso, já que o client Better-Auth do gateway não expõe listener de mudança de sessão
        no contrato usado por `client.ts`).
  - [x] `useAuth().user` nunca tem campos específicos do Supabase (`user_metadata`, etc.) — só
    `id`/`email`/`name`.
  - [x] Nenhuma referência a `supabase` ou a `@lovable.dev/cloud-auth-js` neste arquivo.
- **Fora de escopo:** implementar ou redesenhar `src/lib/data/client.ts` (arquivo protegido da
  fundação — só importar o `auth` que ele expõe).

### Story 3.3 — `ProtectedRoute` → `RequireAuth`

- **Arquivos afetados:**
  - `src/components/ProtectedRoute.tsx` → renomear/reescrever para `src/components/RequireAuth.tsx`
  - `src/App.tsx` (8 usos de `<ProtectedRoute>` nas rotas `/app`, `/app/links`, `/app/leads`,
    `/app/design`, `/app/analytics`, `/app/settings`, `/app/shortlinks`, `/app/form`, mais os
    imports de `AuthProvider` e `ProtectedRoute` no topo do arquivo)
- **O que fazer:**
  - Criar `RequireAuth` usando `useAuth()` (de `@/lib/auth`) em vez de `useAuth()` (de
    `@/hooks/useAuth`): trocar a leitura de `session` por `user` (`if (!user) return <Navigate .../>`),
    mantendo o mesmo comportamento de loading (`Loader2` centralizado) e o mesmo redirect com
    `state={{ from: location }}` pro `/login`.
  - Em `App.tsx`: trocar `import { AuthProvider } from "@/hooks/useAuth"` por
    `import { AuthProvider } from "@/lib/auth"`; trocar
    `import { ProtectedRoute } from "@/components/ProtectedRoute"` por
    `import { RequireAuth } from "@/components/RequireAuth"`; renomear as 8 tags
    `<ProtectedRoute>...</ProtectedRoute>` para `<RequireAuth>...</RequireAuth>`.
- **Critério de aceite:**
  - [x] `src/components/ProtectedRoute.tsx` não existe mais; `src/components/RequireAuth.tsx`
        existe e usa só `@/lib/auth`.
  - [x] Todas as 8 rotas protegidas em `App.tsx` renderizam via `RequireAuth`, sem sobrar nenhuma
        referência a `ProtectedRoute` no repo (grep confirmado).
  - [x] Usuário sem sessão acessando qualquer rota `/app/*` continua sendo redirecionado pro
        `/login` com o `state.from` preservado — lógica idêntica à anterior, só trocou a fonte
        de `session`/`user`.
- **Fora de escopo:** mudar o layout/conteúdo de qualquer tela dentro de `/app/*`.

### Story 3.4 — `Login.tsx` e `Register.tsx`: só email/senha

- **Arquivos afetados:** `src/pages/Login.tsx`, `src/pages/Register.tsx`
- **O que fazer:**
  - Em ambos: remover o botão "Continuar com Google" (svg + `variant="outline"` block), o
    `Separator`/"ou", o estado `googleLoading`, as funções `handleGoogleLogin`/
    `handleGoogleSignup`, e o `import { lovable } from "@/integrations/lovable"`.
  - `Login.tsx`: trocar `supabase.auth.signInWithPassword({ email, password })` por
    `useAuth().signIn(email, password)` (de `@/lib/auth`); manter o `toast` de erro e o
    `navigate("/app")` no sucesso; manter o link "Esqueci minha senha" (destino decidido na
    Story 3.5).
  - `Register.tsx`: trocar `supabase.auth.signUp({ email, password, options: {...} })` por
    `useAuth().signUp(email, password, name)`; como o Better-Auth deste contrato não tem
    confirmação de email documentada no guia, simplifique o fluxo de sucesso para navegar
    direto (`navigate("/app")` se `signUp` já autentica, ou `navigate("/login")` com toast
    "Conta criada, faça login" caso não autentique automaticamente — decida com base no que
    `auth.signUp` de `client.ts` realmente retorna quando este bloco for executado). Remova a
    mensagem "Verifique seu email para confirmar a conta" (não se aplica sem OAuth/confirmação
    Supabase).
  - Remover os imports de `supabase` (`@/integrations/supabase/client`) de ambos os arquivos —
    não sobra nenhum uso de Supabase nessas telas.
- **Critério de aceite:**
  - [x] Nenhum botão/texto/ícone de Google (ou qualquer OAuth) em `Login.tsx`/`Register.tsx`.
  - [x] Nenhum import de `supabase` ou de `@/integrations/lovable` nesses dois arquivos.
  - [x] Login e cadastro funcionam só com formulário email/senha, usando `useAuth()` de
    `@/lib/auth`. `Register.tsx` navega direto pra `/app` no sucesso (o `auth.signUp` de
    `client.ts` já autentica e `signUp` do `AuthProvider` recarrega a sessão antes de retornar —
    não há confirmação de e-mail neste contrato).
- **Fora de escopo:** qualquer validação de força de senha além do que já existe
  (`minLength={6}`); redesenho visual das telas.

### Story 3.5 — `ForgotPassword`/`ResetPassword` (condicional — depende da pergunta em aberto)

- **Arquivos afetados:** `src/pages/ForgotPassword.tsx`, `src/pages/ResetPassword.tsx`,
  `src/pages/Login.tsx` (link "Esqueci minha senha"), `src/App.tsx` (rotas `/forgot-password` e
  `/reset-password`)
- **O que fazer — primeiro confirme a capacidade do gateway** (ver "Pergunta em aberto" acima),
  depois siga **um** dos dois caminhos:
  - **Caminho A — gateway expõe reset de senha:** reescrever `ForgotPassword.tsx` para chamar o
    método equivalente do cliente Better-Auth (algo como `auth.forgetPassword({ email,
    redirectTo })` — nome exato a confirmar no `client.ts`/gateway) no lugar de
    `supabase.auth.resetPasswordForEmail`; reescrever `ResetPassword.tsx` para validar o
    token/sessão de recuperação e chamar o equivalente de `auth.resetPassword`/`updateUser` do
    Better-Auth no lugar de `supabase.auth.updateUser`/`getSession`/`signOut`. Manter as duas
    rotas em `App.tsx` e o link em `Login.tsx`.
  - **Caminho B — gateway não expõe reset de senha:** deletar `src/pages/ForgotPassword.tsx` e
    `src/pages/ResetPassword.tsx`; remover as rotas `/forgot-password` e `/reset-password` de
    `App.tsx`; remover o link "Esqueci minha senha" de `Login.tsx`.
- **Critério de aceite:**
  - **Caminho B adotado** (confirmado pelo usuário em 2026-07-23: capacidade do gateway não
    confirmada — "não sei ainda").
  - [x] Não sobra nenhuma referência às duas telas, às duas rotas, nem ao link "Esqueci minha
        senha" em nenhum lugar do repo (grep limpo por `ForgotPassword`, `ResetPassword`,
        `forgot-password`, `reset-password`).
  - [x] Nenhuma chamada a `supabase.auth.*` sobra nesses arquivos (arquivos deletados).

**Reabrir quando a capacidade do gateway for confirmada:** se o Better-Auth do `tenant-gateway`
expuser reset de senha no futuro, reintroduzir as duas telas/rotas/link seguindo o Caminho A
descrito acima — não foi descartado por decisão de produto, só por falta de confirmação técnica.
- **Fora de escopo:** pedir ao dono do gateway para *criar* a capacidade de reset de senha caso
  ela não exista — isso seria extensão de fundação, fora deste plano; nesse caso o caminho é B.

### Story 3.6 — Atualizar consumidores diretos do hook de sessão

- **Arquivos afetados (todos os pontos reais encontrados por grep de `useAuth(` neste
  repo, fora dos já cobertos nas stories 3.3/3.4):**
  - `src/contexts/ActivePageContext.tsx` (linha `const { user } = useAuth();`)
  - `src/hooks/useProfile.ts` (linha `const { user } = useAuth();`)
  - `src/components/DashboardLayout.tsx` (linha `const { signOut, user } = useAuth();`, e uso de
    `user?.email` no card de usuário)
  - `src/pages/app/AppHome.tsx` (linha `const { user } = useAuth();`, e uso de
    `user?.user_metadata?.full_name` no título de boas-vindas)
- **O que fazer:**
  - Nos quatro arquivos, trocar `import { useAuth } from "@/hooks/useAuth"` (ou
    `from "./useAuth"` em `useProfile.ts`) por `import { useAuth } from "@/lib/auth"`.
  - Em `AppHome.tsx`: trocar `user?.user_metadata?.full_name` por `user?.name` — é a única
    mudança de conteúdo nesta story, feita **só** porque o campo antigo é específico do formato
    de usuário do Supabase e não existe no `AuthUser` novo (sem isso o build quebra). Não mexer
    em mais nada da tela.
  - Em `DashboardLayout.tsx`: `user?.email` continua funcionando sem mudança (campo presente em
    `AuthUser`); só ajustar o import.
  - Em `ActivePageContext.tsx` e `useProfile.ts`: só trocar o import de `useAuth` — as queries a
    `supabase.from("profiles")`/`.from("pages")` dentro desses arquivos **não** mudam aqui (são
    Bloco 4).
- **Critério de aceite:**
  - [x] `grep -r "hooks/useAuth"` em `src/` não retorna nada.
  - [x] `npx tsc --noEmit -p tsconfig.app.json` não tem nenhum erro relacionado a `user`/auth
        nesses quatro arquivos (baseline de 25 caiu pra 24 — só a remoção do `useNavigate` não
        usado do `useAuth.tsx` deletado; zero erro novo introduzido).
  - [x] `AppHome.tsx` mostra o nome do usuário via `user?.name` sem quebrar.
- **Fora de escopo:** reescrever as queries Supabase de dados dentro de
  `ActivePageContext.tsx`, `useProfile.ts` ou `usePages.ts` para usar `db`/repos — isso é
  **Bloco 4**. Nota para quem for executar o Bloco 4: `usePages.ts` também chama
  `supabase.auth.getUser()` (linha ~55, para revalidar dono do perfil antes de criar página) —
  esse uso não foi tocado aqui por ser dentro de um hook de dados, mas vai precisar de
  equivalente via `auth.me()`/`db` quando o Bloco 4 rodar.

## Definition of Done do bloco

**Status: concluído em 2026-07-23.**

- [x] `src/hooks/useAuth.tsx` e `src/integrations/lovable/**` não existem mais.
- [x] `src/lib/auth.tsx` existe, expõe `AuthProvider`/`useAuth()` com `{ user, role, loading,
  signIn, signUp, signOut }`, e é a **única** porta de entrada pro cliente Better-Auth no app.
- [x] `RequireAuth` substitui `ProtectedRoute` em todas as 8 rotas de `App.tsx`.
- [x] `Login.tsx`/`Register.tsx` só têm formulário email/senha — zero OAuth, zero import de
  `supabase`/`lovable`.
- [x] `ForgotPassword.tsx`/`ResetPassword.tsx`: Caminho B adotado (telas/rotas/link removidos) —
  capacidade do gateway não confirmada nesta sessão; reabrir se confirmada no futuro.
- [x] Todos os consumidores reais de `useAuth` (`ActivePageContext.tsx`, `useProfile.ts`,
  `DashboardLayout.tsx`, `AppHome.tsx`, mais os já cobertos em `App.tsx`/`RequireAuth`) importam
  de `@/lib/auth`.
- [x] Nenhuma chamada a `supabase.auth.*` sobra em nenhum arquivo de auth/sessão/login/cadastro
  (`usePages.ts` é a única exceção conhecida, documentada como nota pro Bloco 4).
- [x] `npx tsc --noEmit -p tsconfig.app.json` sem erro novo introduzido por este bloco (baseline
  24, era 25 — só a queda natural do `useNavigate` não usado no arquivo deletado).

**Achado de execução (pré-requisito puxado do Bloco 4):** `src/lib/data/client.ts`,
`types.gen.ts` e `preview-fixtures.ts` foram criados durante este bloco, não durante o Bloco 4,
para resolver uma dependência circular do plano original. Ver nota espelhada em
`04-camada-de-dados.md`, Story 4.1. O `auth` exposto por `client.ts` assume endpoints padrão do
Better-Auth (`/api/auth/sign-in/email`, `/sign-up/email`, `/sign-out`, `/get-session`) — **não
confirmado contra o `tenant-gateway` real**; se os paths divergirem, o ajuste é isolado nesse
arquivo, nenhum outro consumidor precisa mudar.
