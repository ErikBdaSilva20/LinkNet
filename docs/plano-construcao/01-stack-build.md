# Bloco 1 — Stack & Build

## Objetivo
Colocar a base de build/tooling do repo (`package.json`, `tsconfig*.json`, `vite.config.ts`,
`vitest.config.ts`) em conformidade com o contrato técnico da fundação Masia (§B3 do
`Importantdoc.md`), e decidir/registrar a escolha do scaffold visual de origem. Este bloco não
reescreve código de aplicação — só a fundação de build sobre a qual os Blocos 2–7 vão trabalhar.

## Por que este bloco existe
Investigação direta dos arquivos de config do repo (`c:/__Projetos_/MasIABoirerplate/LinGuild/`)
encontrou:

- `package.json` está preso ao stack antigo do Lovable: `react`/`react-dom` `^18.3.1`,
  `react-router-dom` `^6.30.1`, `vite` `^5.4.19`, `@vitejs/plugin-react-swc` `^3.11.0`,
  `typescript` `^5.8.3`. O guia (§B3) exige **React 19 / Vite 6 / react-router-dom 7**.
- `tsconfig.json` e `tsconfig.app.json` têm **todas as flags de rigor desligadas**:
  `noImplicitAny: false`, `noUnusedLocals: false`, `noUnusedParameters: false`,
  `strictNullChecks: false`, e `tsconfig.app.json` ainda tem `strict: false` explícito. O guia
  (§B3) exige TypeScript **strict**, com `noUnusedLocals` — "imports não usados **quebram o
  build**".
- `vite.config.ts` importa `componentTagger` de `lovable-tagger` e o ativa em modo
  `development` — ferramenta de telemetria específica do editor Lovable, que não existe (nem
  deve existir) no ambiente novo. Este arquivo vira **protegido** (não editável pela IA) depois
  de publicado (§B7/§B9), então a versão final tem que já nascer limpa.
- `vitest.config.ts` já usa `@vitejs/plugin-react-swc` e roda sobre `jsdom` com
  `setupFiles: ["./src/test/setup.ts"]` — estrutura compatível com Vite 6, só precisa acompanhar
  o bump de versão do plugin.
- O repo tem **dois sistemas de lockfile coexistindo**: `package-lock.json` (raiz),
  `bun.lock` e `bun.lockb`. O guia (§B10, "Pré-requisitos do template") exige
  `package-lock.json` **commitado** e a receita de publish roda `npm install` — os lockfiles do
  Bun são resíduo do fluxo antigo e criam risco de divergência de versões resolvidas.
- `tailwind.config.ts` (Tailwind v3, tokens HSL em `--variável`, cores customizadas
  `cyan`/`teal`, plugin `tailwindcss-animate`) e `components.json` (`style: "default"`,
  `baseColor: "slate"`, `cssVariables: true`) mostram que o app **já é Tailwind v3 + shadcn/ui**
  de forma profunda: `src/components/ui/` tem **49 primitivos shadcn** e **84 arquivos** em
  `src/` usam `className=` diretamente. Isso pesa a favor de manter Tailwind + shadcn (scaffold
  `wiki`) em vez de reescrever tudo para CSS puro (scaffold `forms-nps`) — ver Story 1.7.
- `next-themes` (`^0.3.0`) está em uso real em 3 arquivos (`src/components/ui/sonner.tsx`,
  `src/components/ThemeToggle.tsx`, `src/App.tsx`), não é só uma dependência morta.

## Depende de / Habilita
- **Depende de:** nada — é o primeiro bloco do plano.
- **Habilita:**
  - **Bloco 2 (Schema)** e **Bloco 3 (Auth)** podem escrever migrations/tipos assumindo já
    TypeScript strict e React 19 disponíveis.
  - **Blocos 3–6** (auth, dados, telas, página pública) escrevem/reescrevem código **direto em
    conformidade com strict mode**, em vez de herdar código não tipado e ter que "descobrir"
    depois que o flip quebrou tudo.
  - **Bloco 7 (manifest/empacotamento)** usa a Story 1.4 deste bloco como o gate final de
    `vite build` limpo exigido por §B10, e confirma que `@supabase/supabase-js`,
    `@lovable.dev/cloud-auth-js` e `lovable-tagger` sumiram do `package.json` (removidos pelos
    Blocos 3 e 4, não por este bloco).

## Decisões já tomadas (não reabrir)
- Auth final será e-mail/senha via Better-Auth; a **remoção do código** de
  `@lovable.dev/cloud-auth-js` é do **Bloco 3**. Aqui só preparamos o terreno de build — a
  dependência **continua no `package.json`** até o Bloco 3 terminar.
- Imagens virarão base64 em coluna de texto; a **remoção do runtime** `@supabase/supabase-js` é
  do **Bloco 4** (camada de dados). Aqui a dependência **continua no `package.json`**.
- Produtos digitais/Stripe, HTML customizado no `<head>` público: fora do escopo deste bloco por
  completo (schema é Bloco 2, página pública é Bloco 6).
- Nenhuma story deste bloco pode pedir mudança no `tenant-gateway` ou na fundação — é só
  configuração dentro do repo do template.

## Regras obrigatórias (Importantdoc.md)
- **§B3 (Tecnologias)** — tabela: Framework **React 19**; Build **Vite 6** (SPA estático,
  `tsc && vite build`, "**Sem Next.js / SSR**"); Rotas **react-router-dom 7** (SPA,
  `BrowserRouter`); Linguagem **TypeScript strict (`noUnusedLocals`)** — "imports não usados
  **quebram o build**"; Estilo — **2 opções** (ver §B9): CSS+tokens (`forms-nps`) **ou**
  Tailwind v4 + shadcn "Atelier" (`wiki`).
- **§B3 ("Proibido")** — "Next.js, SSR/SSG, servidor/API por app, Supabase, Firebase, ORM no
  browser, libs de UI gigantes não justificadas." (a remoção efetiva do Supabase é de outro
  bloco, mas nenhuma story deste bloco pode introduzir algo desta lista).
- **§B9 (Os dois scaffolds)** — `forms-nps`: "App simples/leve, sem dependências pesadas... CSS
  puro + tokens... Mais leve." `wiki`: "App **'Pro'**/sofisticado... Tailwind v4 + shadcn/ui —
  design system 'Atelier'... scaffold canônico dos Pro; `crm-pro` e `recrutamento` nasceram
  dele."
- **§B10 ("Pré-requisitos do template")** — "`package-lock.json` commitado, **`vite build`
  passa**, **zero imports não usados**."
- **§B7 (Manifest)** — lista `vite.config.ts` e `components.json` como **protegidos** no
  scaffold `wiki` ("também ficam protegidos... `vite.config.ts` e `components.json`").
- **Checklist do template** — "SPA Vite + React 19, sem Next/SSR, sem backend próprio" e
  "`package-lock.json` commitado; `vite build` passa; sem imports não usados."
- **Erros comuns** — "`pnpm templates:publish <slug>` **sem** a URL https do gateway" não é
  deste bloco, mas o pré-requisito de lockfile/build limpo que essa receita assume, **é**.

## Boas práticas obrigatórias neste bloco
- **Um único lockfile.** O template é buildado/publicado via `npm install` (§B10). Escolha
  `npm` como gerenciador canônico, mantenha `package-lock.json` commitado e remova
  `bun.lock`/`bun.lockb` do repo (ou explique por que ficam, se algum outro bloco depender do
  Bun — não deveria).
- **Não misture a remoção de dependências com o bump de versões.** `@supabase/supabase-js`,
  `@lovable.dev/cloud-auth-js` e `lovable-tagger` permanecem no `package.json` até os Blocos 3/4
  removerem o código que os usa — remover a dependência antes quebraria o build por import
  faltante nesses arquivos que ainda não foram reescritos.
- **Convenção de versão:** siga o padrão já usado no arquivo (`^x.y.z`, caret range) — não troque
  pra `~` nem para versão exata sem motivo.
- **`vite.config.ts` nasce definitivo.** Como vira protegido após publicado, não deixe nada
  "provisório" nele (sem comentários tipo `// TODO revisar depois`); o `server.host`/`port`/`hmr`
  atuais podem ser mantidos se não conflitarem com o padrão do scaffold escolhido.
- **Não invente número de versão que não dá pra confirmar.** Onde a compatibilidade exata de uma
  dependência (ex: versão mínima de `@vitejs/plugin-react-swc` para Vite 6) não puder ser
  verificada só lendo os arquivos deste repo, a story deve dizer "confira no npm/changelog da
  lib no momento da execução" em vez de cravar um número.
- **Trio de tsconfig** (`tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`) continua
  como está estruturalmente — não colapse em um arquivo só; é o padrão que o Vite/shadcn
  esperam.
- **Nome do pacote:** `package.json.name` hoje é `"vite_react_shadcn_ts"` (resíduo do scaffold
  Lovable). Ajuste para algo que identifique o template (ex.: `"linkbio"`, alinhado ao `id` que o
  Bloco 7 vai usar no `masi.template.json`) — troca de string simples, sem risco.

## Stories

### Story 1.1 — Bump de React, Vite, Router e tipos no `package.json`
- Arquivos afetados: `package.json`, `package-lock.json`.
- O que fazer:
  1. Atualizar `dependencies`: `react` `^18.3.1` → `^19.0.0`, `react-dom` `^18.3.1` →
     `^19.0.0`, `react-router-dom` `^6.30.1` → `^7.0.0`.
  2. Atualizar `devDependencies`: `@types/react` `^18.3.23` → `^19.0.0`, `@types/react-dom`
     `^18.3.7` → `^19.0.0`, `vite` `^5.4.19` → `^6.0.0`, `@vitejs/plugin-react-swc` `^3.11.0` →
     a versão mínima documentada como compatível com Vite 6 no momento da execução (confirme no
     npm/changelog da lib — não copie o `^3.11.0` atual sem checar).
  3. **Não tocar** em `@supabase/supabase-js`, `@lovable.dev/cloud-auth-js`, `lovable-tagger` —
     ficam no arquivo (ver "Decisões já tomadas").
  4. Ajustar `package.json.name` de `"vite_react_shadcn_ts"` para o nome do template.
  5. Rodar `npm install` e commitar o `package-lock.json` resultante.
- Critério de aceite:
  - [x] `react`, `react-dom` em `^19.x`; `react-router-dom` em `^7.x`; `vite` em `^6.x` no
        `package.json`. **Instalado:** `react@19.2.8`, `react-router-dom@7.18.1`, `vite@6.4.3`.
  - [x] `@types/react`/`@types/react-dom` em `^19.x`.
  - [x] `@vitejs/plugin-react-swc` numa versão confirmada compatível com Vite 6 — confirmado via
        `npm view @vitejs/plugin-react-swc peerDependencies` em 2026-07-23:
        `{ vite: '^4 || ^5 || ^6 || ^7 || ^8' }`. Instalado `@vitejs/plugin-react-swc@4.3.2`.
  - [x] `@supabase/supabase-js`, `@lovable.dev/cloud-auth-js`, `lovable-tagger` continuam
        presentes e inalterados no `package.json`.
  - [x] `package-lock.json` foi regenerado via `npm install` e commitado.
  - [x] `package.json.name` não é mais `"vite_react_shadcn_ts"` (agora `"linkbio"`).

**Nota de execução (peer deps):** `npm install` reporta `ERESOLVE overriding peer dependency`
para `next-themes@0.3.0`, `react-day-picker@8.10.1` e `vaul@0.9.9` (todas declaram peer só até
React 18). São warnings, não erros — `npm install` completou e `react@19.2.8` foi deduplicado em
toda a árvore. `next-themes` já tem remoção planejada (Story 1.6/Bloco 5); `react-day-picker`/
`vaul` ficam fora do escopo deste bloco — se travarem em runtime, é achado para o Bloco 5
registrar, não algo a resolver aqui.
- Fora de escopo: corrigir os erros de tipo/runtime que o bump de React 19/RRD 7 vai expor no
  código de páginas/hooks — isso é dos Blocos 3–6. Remover as três dependências marcadas acima —
  Blocos 3 e 4.

### Story 1.2 — Consolidar em um único lockfile (npm)
- Arquivos afetados: `bun.lock`, `bun.lockb`, `package-lock.json`, `.gitignore`.
- O que fazer:
  1. Confirmar que `npm` é o gerenciador canônico (é o que a receita de publish do §B10 usa:
     `npm install`).
  2. Remover `bun.lock` e `bun.lockb` do repo (`git rm`).
  3. Adicionar `bun.lock`/`bun.lockb`/`bun.lockb` (e, por segurança, `yarn.lock`/`pnpm-lock.yaml`)
     ao `.gitignore` para impedir que voltem a ser commitados por engano.
  4. Garantir que `package-lock.json` está atualizado (pós Story 1.1) e commitado.
- Critério de aceite:
  - [x] `bun.lock` e `bun.lockb` não existem mais no repo (`git rm --cached` + remoção física).
  - [x] `.gitignore` cobre lockfiles de outros gerenciadores (`bun.lock`, `bun.lockb`, `yarn.lock`,
        `pnpm-lock.yaml`).
  - [x] `package-lock.json` presente, atualizado e commitado.
  - [x] `npm install` a partir de um clone limpo do repo funciona sem erro (rodado nesta sessão,
        574 pacotes instalados, sem erro fatal — só os warnings de peer dep já documentados).
- Fora de escopo: mudar o gerenciador de pacotes usado em CI/scripts fora deste repo (isso é
  orquestração, `masi-ai-orquestration`, fora do escopo de qualquer bloco deste plano).

### Story 1.3 — `vite.config.ts`: remover `lovable-tagger`, deixar no formato definitivo
- Arquivos afetados: `vite.config.ts`.
- O que fazer:
  1. Remover o import `import { componentTagger } from "lovable-tagger";` e o uso de
     `componentTagger()` no array `plugins`.
  2. Deixar `plugins: [react()]` (sem `.filter(Boolean)` condicional, já que não há mais plugin
     opcional).
  3. Manter `resolve.alias["@"]` apontando para `./src` (contrato usado em todo o resto do
     código via `paths` do `tsconfig`).
  4. Manter/ajustar `server.host`/`port`/`hmr.overlay` conforme necessário — sem introduzir
     nada específico do Lovable.
  5. Não decidir aqui a estrutura de plugins do Tailwind v4 (`@tailwindcss/vite`) — isso só
     entra se a Story 1.7 escolher o scaffold `wiki`; se escolhido, quem aplica a mudança de
     plugin do Tailwind é quem migrar `tailwind.config.ts`/`postcss.config.js` (fora deste
     bloco, ver Story 1.7).
- Critério de aceite:
  - [x] Nenhuma referência a `lovable-tagger`/`componentTagger` em `vite.config.ts`.
  - [x] `npx vite build --mode development` não falha por import quebrado de `lovable-tagger` —
        rodado nesta sessão: `✓ 3353 modules transformed`, build concluído em 15.98s (só o
        warning de chunk >500kB já esperado/documentado pelo guia, §B10).
  - [x] Alias `@` → `src` preservado.
- Fora de escopo: remover `lovable-tagger` do `package.json` (Story 1.1 mantém a dependência —
  ela só deixa de ser importada por código; a remoção do `package.json` é dos Blocos 3/4/7 depois
  que mais nenhum arquivo do template a referenciar).

### Story 1.4 — `tsconfig.json`/`tsconfig.app.json`: ativar strict mode
- Arquivos afetados: `tsconfig.json`, `tsconfig.app.json`.
- O que fazer:
  1. Em `tsconfig.app.json`: trocar `"strict": false` → `"strict": true`; remover (ou trocar
     para `true`) os overrides `noImplicitAny: false` e `strictNullChecks: false` — com
     `strict: true` eles já ficam implícitos, então o mais limpo é **remover** as três linhas
     duplicadas e deixar só `strict: true`. Trocar `noUnusedLocals: false` → `true` e
     `noUnusedParameters: false` → `true`.
  2. Em `tsconfig.json`: mesma mudança nos overrides equivalentes (`noImplicitAny`,
     `noUnusedLocals`, `noUnusedParameters`, `strictNullChecks`) — hoje todos `false` — trocar
     para consistente com o `tsconfig.app.json` (adicionar `"strict": true` e remover os
     overrides redundantes, ou defini-los `true` explicitamente).
  3. **Decisão de sequenciamento (não reabrir):** o flip acontece **agora**, neste bloco, não no
     final. Justificativa: o contrato da fundação (§B3) já exige strict mode incondicionalmente;
     se o flip for adiado para o Bloco 7, todo o débito de tipagem acumulado pelos Blocos 2–6 cai
     de uma vez no bloco de empacotamento — exatamente o pior momento, porque é quando o build
     também precisa passar limpo para publish (§B10). Ativando agora, cada bloco seguinte (2–6)
     escreve/reescreve seus próprios arquivos **já em conformidade** com strict, e o Bloco 7 só
     **confirma** que não sobrou nada — não corrige uma pilha de erros de todo mundo.
  4. Documentar explicitamente (no PR/commit desta story) que, a partir daqui, `npm run build`
     (`tsc && vite build`) **vai falhar** até que os Blocos 3–6 terminem de reescrever
     hooks/páginas — isso é esperado e não é regressão desta story. O Bloco 7 é quem tem o
     critério de aceite de "`vite build` passa limpo, zero unused imports" como gate final
     (§B10, Checklist do template).
  5. Não editar `tsconfig.node.json` nesta story — ele já está `strict: true` e só compila
     `vite.config.ts` (um arquivo pequeno, baixo risco); se sobrar tempo, alinhar
     `noUnusedLocals`/`noUnusedParameters` nele também por consistência, mas não é bloqueante.
- Critério de aceite:
  - [x] `tsconfig.app.json` tem `"strict": true`, `"noUnusedLocals": true`,
        `"noUnusedParameters": true`, sem overrides redundantes que reduzam o rigor.
  - [x] `tsconfig.json` alinhado (mesmas flags de rigor, sem overrides `false` residuais).
  - [x] Rodar `npx tsc --noEmit -p tsconfig.app.json` e **registrar** (não precisa corrigir) a
        contagem aproximada de erros expostos — vira o "baseline conhecido" que os Blocos 3–6 vão
        reduzir a zero.
  - [x] Existe uma nota explícita (neste arquivo de plano, seção já escrita acima) avisando que o
        build fica vermelho até o Bloco 7.

**Baseline real registrado em 2026-07-23 (`npx tsc --noEmit -p tsconfig.app.json`): 25 erros.**
Bem menor do que o previsto ("MUITOS erros") — a maioria (21/25) é `TS6133`/`TS6198` (import ou
destructure não usado, mecânico, sem risco). Só 4 são substantivos:

- `src/hooks/useAnalytics.ts(88,3)` — `TopLink.url` espera `string`, mas o dado tem `string | null`
  (Bloco 4, Story 4.8, ao mexer em `aggregateTopLinks`).
- `src/hooks/useShortLinks.ts(136,11)` — mesma família: `string | null` não atribuível a
  `string | undefined` (Bloco 4, Story 4.4).
- `src/components/IntegrationScripts.tsx(97,9)` — `TS2774`, bug pré-existente real (não é
  unused-import): `if (n.callMethod)` numa função sempre definida, condição sempre verdadeira —
  sinalizar para o Bloco 6 (Story 6.5) corrigir junto da limpeza desse arquivo.

Lista completa dos 25 arquivos/linhas fica no output do comando acima — cada bloco que reescrever
o arquivo correspondente (3, 4, 5) resolve os que forem seus por consequência natural da
reescrita, não precisa de uma "story de correção de lint" à parte.
- Fora de escopo: corrigir qualquer um dos erros de tipo expostos — isso é dos Blocos 3, 4, 5 e 6,
  cada um nos arquivos que já está reescrevendo. Este bloco só liga a flag e documenta o estado.

### Story 1.5 — `vitest.config.ts`: confirmar compatibilidade com o stack novo
- Arquivos afetados: `vitest.config.ts` (validação; só editar se algo quebrar).
- O que fazer:
  1. Depois da Story 1.1 (bump de `@vitejs/plugin-react-swc`/Vite), rodar `npm run test` e
     confirmar que `vitest` (`^3.2.4`, já compatível com Vite 6) sobe normalmente com
     `environment: "jsdom"`, `globals: true` e `setupFiles: ["./src/test/setup.ts"]`.
  2. Se o bump de `@vitejs/plugin-react-swc` exigir opções novas no plugin (raro), refletir aqui
     também, já que `vitest.config.ts` instancia o plugin separadamente do `vite.config.ts`.
  3. Não reescrever nenhum teste existente em `src/test/` — apenas confirmar que o executor
     sobe. Testes que hoje mockam Supabase (`src/test/example.test.ts` e afins) vão parar de
     fazer sentido conceitual assim que os Blocos 3/4 trocarem a camada de dados — a
     **reescrita** desses testes é responsabilidade de quem reescrever o código que eles testam,
     não deste bloco.
- Critério de aceite:
  - [x] `npm run test` executa (sobe o runner) sem erro de configuração/plugin após os bumps da
        Story 1.1 — rodado nesta sessão: `vitest v3.2.4`, 1 arquivo/1 teste, todos passando.
  - [x] `vitest.config.ts` não precisou de nenhuma mudança estrutural.
- Fora de escopo: reescrever qualquer teste em `src/test/**` ou criar testes novos — isso é do
  bloco que reescreve o código testado (Blocos 3–6), não do Bloco 1.

### Story 1.6 — Decidir o destino de `next-themes`
- Arquivos afetados: `package.json` (decisão registrada aqui; a remoção efetiva do código é do
  Bloco 5 — ver abaixo).
- O que fazer:
  1. Confirmado por investigação: `next-themes` (`^0.3.0`) está em uso ativo em
     `src/components/ui/sonner.tsx`, `src/components/ThemeToggle.tsx` e `src/App.tsx` — não é
     dependência morta.
  2. **Decisão:** remover `next-themes` do `package.json` **assim que** o scaffold escolhido na
     Story 1.7 for adotado, porque tanto `forms-nps` quanto `wiki` trazem o próprio esquema de
     dark mode (classe no `<html>`/`localStorage` próprios do scaffold) — manter `next-themes`
     em paralelo criaria dois mecanismos de tema concorrentes.
  3. Este bloco **não remove a dependência ainda** (ela ainda é usada pelo código atual, que só
     é reescrito no Bloco 5 — Telas). Registrar aqui a decisão e sinalizar explicitamente para o
     Bloco 5: ao portar `ThemeToggle`/`App.tsx`/o wrapper de toast (`sonner.tsx` ou equivalente),
     trocar `next-themes` pelo mecanismo de dark mode nativo do scaffold escolhido, e só então
     remover `next-themes` do `package.json` (o Bloco 7 confere que sumiu, junto com Supabase e
     lovable-auth).
- Critério de aceite:
  - [ ] Decisão de remoção de `next-themes` está escrita neste arquivo (feito) e é referenciada
        como responsabilidade do Bloco 5 para execução de código + do Bloco 7 para conferência
        de que a dependência sumiu do `package.json`.
  - [ ] `package.json` **não** é alterado nesta story (a remoção acontece depois, junto da
        reescrita do Bloco 5).
- Fora de escopo: reescrever `ThemeToggle.tsx`, `App.tsx` ou `sonner.tsx` — isso é do Bloco 5.

### Story 1.7 — Escolha do scaffold visual: `forms-nps` vs `wiki` (decisão em aberto)
- Arquivos afetados: nenhum ainda — esta story só produz a decisão que orienta
  `package.json`/`tailwind.config.ts`/`components.json` finais (mudanças de fato ficam para quem
  portar as telas, Blocos 5/6, depois que a decisão estiver confirmada).
- O que fazer:
  1. Ler `Importantdoc.md` §B9 (tabela dos dois scaffolds) e `docs/AUDITORIA-ADAPTACAO-MASIA.md`
     §7/§8/§11 (que já registra uma inclinação prévia pelo `wiki`).
  2. Levar em conta os achados deste bloco: o app atual **já é** Tailwind v3 + shadcn/ui — 49
     componentes em `src/components/ui/` seguindo o padrão shadcn "default" (`components.json`:
     `style: "default"`, `baseColor: "slate"`, `cssVariables: true`), tokens em HSL customizados
     em `tailwind.config.ts`/`index.css` (`--cyan-primary`, `--teal-primary`, etc.), e **84
     arquivos** usando `className=` do Tailwind diretamente.
  3. Ponderar o trade-off, sem decidir sozinho o lado de produto/visual:
     - **`forms-nps`** (CSS puro + tokens): exigiria reescrever manualmente os 49 componentes
       shadcn e as 84 telas/arquivos que hoje dependem de classes utilitárias Tailwind — o maior
       esforço de reescrita do template inteiro, mas resulta num app mais leve, sem dependência
       de Tailwind.
     - **`wiki`** (Tailwind v4 + shadcn "Atelier"): mantém o modelo mental atual (Tailwind +
       shadcn), mas exige migrar de Tailwind v3 → v4 (mudança de config CSS-first, possível troca
       de `tailwindcss-animate` pelo equivalente v4, `components.json` alinhado ao estilo
       "Atelier" do scaffold) — upgrade de versão em vez de reescrita total de markup.
  4. **Registrar a recomendação técnica** (dado o volume de Tailwind/shadcn já existente, `wiki`
     parece exigir menos retrabalho de UI do que `forms-nps`), mas **deixar a decisão final como
     pergunta em aberto para o usuário/dono do produto** antes que o Bloco 5 (Telas) ou o Bloco 6
     (Página pública) comecem a depender dela — é escolha de identidade visual do produto, não
     só técnica.
  5. Assim que a decisão for confirmada pelo usuário, quem herda a execução (Bloco 5, ao portar
     `src/components/**`/`src/pages/**` para `src/screens/**`) atualiza `package.json`
     (dependências do scaffold escolhido), `tailwind.config.ts` (ou remove, se `wiki` v4 for
     CSS-first) e `components.json` de acordo — essa execução **não é** deste bloco.
- Critério de aceite:
  - [x] O documento registra claramente: dados que embasam a recomendação (49 componentes
        shadcn, 84 arquivos com `className=`, tokens HSL já customizados).
  - [x] Uma recomendação técnica explícita está escrita (favorecendo `wiki` pelo volume de
        Tailwind/shadcn já existente).
  - [x] A decisão final está marcada como **pergunta aberta para o usuário**, não fechada
        unilateralmente neste bloco.
  - [x] Fica explícito que a resposta a essa pergunta é pré-requisito para os Blocos 5 e 6
        começarem a portar telas/componentes visuais.

**Decisão confirmada pelo usuário em 2026-07-23: `wiki` (Tailwind v4 + shadcn "Atelier").** Os
Blocos 5/6 já podem assumir isso como travado — não é mais pergunta em aberto. A migração de fato
de `tailwind.config.ts`/`components.json`/dependências Tailwind v3→v4 continua sendo execução do
Bloco 5 (Telas), não deste bloco.
- Fora de escopo: migrar de fato qualquer componente, `tailwind.config.ts` ou `components.json`
  para o scaffold escolhido — isso é dos Blocos 5/6, depois da decisão confirmada.

## Definition of Done do bloco

**Status: concluído em 2026-07-23.**

- [x] `package.json`: `react`/`react-dom` em `^19.x`, `react-router-dom` em `^7.x`, `vite` em
      `^6.x`, `@vitejs/plugin-react-swc` numa versão confirmada compatível com Vite 6; tipos
      (`@types/react`/`@types/react-dom`) em `^19.x`.
- [x] `@supabase/supabase-js`, `@lovable.dev/cloud-auth-js`, `lovable-tagger` **continuam** no
      `package.json` (remoção é dos Blocos 3/4, conferência final é do Bloco 7).
- [x] Um único lockfile no repo (`package-lock.json`, commitado); `bun.lock`/`bun.lockb`
      removidos.
- [x] `vite.config.ts` sem qualquer referência a `lovable-tagger`/`componentTagger`, no formato
      definitivo (arquivo é protegido depois de publicado).
- [x] `tsconfig.json` e `tsconfig.app.json` com `strict: true`, `noUnusedLocals: true`,
      `noUnusedParameters: true` — sem overrides que reduzam o rigor.
- [x] Estado do build documentado: `npm run build` (`vite build`, sem `tsc` no script atual — ver
      nota abaixo) passa limpo; `npx tsc --noEmit -p tsconfig.app.json` expõe 25 erros conhecidos
      (baseline registrado na Story 1.4) para os Blocos 3–6 reduzirem a zero.
- [x] `vitest.config.ts` validado como compatível com as versões novas — sem mudança estrutural.
- [x] Decisão sobre `next-themes` registrada (remoção após Bloco 5 portar os 3 arquivos que o
      usam), sem alterar `package.json` ainda.
- [x] Escolha de scaffold: **`wiki`** confirmada pelo usuário (Story 1.7) — não é mais pergunta
      em aberto para os Blocos 5/6.

**Achado de execução (fora das stories originais, registrar para o Bloco 7):** o script
`"build": "vite build"` do `package.json` **não roda `tsc`** antes do build (diferente do que
§B3/§B10 do guia descrevem: `"tsc && vite build"`). Isso significa que hoje `npm run build` passa
mesmo com os 25 erros de tipo do baseline acima — o Vite/esbuild transpila sem checar tipos. O
guia exige que o build final rejeite tipo errado. **Ação para o Bloco 7 (ou quem finalizar o
Bloco 6):** trocar o script para `"build": "tsc && vite build"` antes de considerar o template
publicável — sem isso, o gate de "zero erro de tipo" do §B10 não é realmente aplicado pelo
`npm run build`, só pelo `tsc --noEmit` manual usado nesta sessão.

**Também restaurado nesta sessão (não fazia parte do escopo, achado de segurança):**
`README.md`, `.lovable/plan.md`, `bun.lock` e `bun.lockb` estavam apagados do disco no início da
execução deste bloco, sem relação com nenhuma story planejada aqui. Foram restaurados via
`git checkout -- <arquivo>` antes de qualquer outra alteração, e só então `bun.lock`/`bun.lockb`
foram removidos de novo — desta vez intencionalmente, via Story 1.2. Não foi possível determinar
a causa da deleção original; nenhuma mudança de conteúdo foi perdida (restauração veio do HEAD do
git, idêntica ao commit anterior).
