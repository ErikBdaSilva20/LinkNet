# 01 — Gaps de código, código morto e refatorações

> Levantado por Amelia (dev), 2026-07-23, em cima do estado atual de `src/**` (pós Bloco 7,
> commit `6d90e2b`). Metodologia: pipeline de auditoria (entry points → data flow → domínio →
> dados) + heurísticas de SRP/conexão/duplicação semântica. Achados ordenados por prioridade
> (P0 = corrige logo, P3 = cosmético).

## P0 — Gaps funcionais (parece pronto, não está)

### 1. Dashboard Home mostra estatísticas fixas em "0"
`src/screens/HomeScreen.tsx:28-33` — o array `stats` é hardcoded:

```ts
const stats = [
  { label: "Total de Links", value: "0", ... },
  { label: "Views", value: "0", ... },
  { label: "Cliques", value: "0", ... },
  { label: "CTR", value: "0%", ... },
];
```

Isso **nunca muda**, mesmo com links/cliques reais — não é loading state, é literal. O dado já
existe e já está resolvido em outro lugar do próprio app: `useLinks()` (contagem de links) e
`useAnalytics()` (`totalViews`, `totalClicks`, `ctr` — usados de verdade em
`src/screens/AnalyticsScreen.tsx`). É a primeira tela que o usuário vê depois de logar — hoje
ela mente. Conserto é conectar os hooks já existentes, não inventar nada novo.

### 2. Vazamento de marca de outro produto (não é só cosmético)
Três nomes de marca diferentes convivem no mesmo produto:

| Onde | O que tem | Devia ser |
|---|---|---|
| `src/screens/LandingScreen.tsx:121-123` | `<span>LinkBio</span>` + `© 2024 Viver de IA. Todos os direitos reservados.` | Nome/copyright do LinkGuild, não de outro produto |
| `src/index.css:5-8` (comentário) | `/* Design System - Viver de IA ... */` | Nome do projeto atual ou nada |
| `src/components/AppShell.tsx:52,74` | `LinkBio` no header/sidebar | `LinkGuild` (ou o nome comercial final) |
| `src/screens/PublicProfileScreen.tsx:346` | `Powered by LinkBio` no rodapé da página **pública** (a que o cliente final vê) | idem |
| `package.json:2` | `"name": "linkbio"` | `"linkguild"` (ou o slug real) |

"Viver de IA" é o nome de um produto/marca **completamente diferente** que ficou entalado num
comentário de CSS — sinal de que o design system inteiro (cores cyan/teal, glassmorphism) foi
herdado sem revisão de outro projeto Lovable, não desenhado pra este. Isso não é só estética:
se isso for ao ar como está, o cliente final vê "Powered by LinkBio" na própria página pública
dele, e o rodapé da landing menciona uma empresa que não é a Masia nem o LinkGuild.

## P1 — Qualidade de tipo / lint real (não é só estilo)

Rodei `npx eslint . --ext .ts,.tsx` — 5 erros, 12 warnings. Os que importam:

- **`src/screens/LinksScreen.tsx:839`** — `page.lead_form_fields as any[]` pra montar a prop
  `leadForm.fields` do `MobilePreview`. O projeto já tem um jeito tipado de fazer exatamente
  isso: `parseFormFields()` (exportado de `LeadFormFieldsConfigurator.tsx`, já usado em
  `PublicProfileScreen.tsx:218`). Duas implementações da mesma coisa — uma tipada, uma com
  `any` — é duplicação semântica clássica (a regra "como interpretar `lead_form_fields`" existe
  em dois lugares; mudou o formato, tem que lembrar de mudar nos dois).
- **`src/components/IntegrationScripts.tsx:69`** — usa `.apply()` onde um spread resolve
  (`prefer-spread`). Trivial, mas é o tipo de coisa que o lint já pega de graça.
- **`tailwind.config.ts:131`** — `require("tailwindcss-animate")` num arquivo `.ts` (ESM) —
  `no-require-imports`. Troca por `import tailwindcssAnimate from "tailwindcss-animate"`.
- **`src/components/ui/command.tsx:24`, `src/components/ui/textarea.tsx:5`** — interfaces
  vazias que só reexportam o tipo do pai (`@typescript-eslint/no-empty-object-type`). São
  ruído puro do scaffold shadcn — baixo risco, mas contam pro "zero erro de lint" que o
  princípio #1 do `00-INDEX.md` do plano promete.
- **`src/screens/LinksScreen.tsx:336`** — `useCallback` com dependência `profile` que o
  exhaustive-deps aponta como desnecessária. Não investiguei se é bug real (closure presa)
  ou só sobra de refactor — vale um olhar antes de simplesmente silenciar o lint.

## P1 — Código morto

### `src/components/registry.tsx` nunca é importado
Busquei `components/registry` em todo `src/**` — zero resultado. O arquivo existe, está
protegido no `masi.template.json` (`editable.protect`), e o comentário do próprio arquivo diz
que é o "barrel de componentes reaproveitados por mais de uma tela" — mas nenhuma tela ou
componente do app importa dele. Duas hipóteses, preciso confirmar qual:

1. É consumido **fora deste repo**, pela ferramenta de edição por IA (Sandpack, no
   `masi-ai-orquestration`) pra saber que componentes existem — nesse caso está certo do jeito
   que está, só não vai aparecer em nenhuma busca de uso dentro deste repo.
2. É sobra de scaffold que nunca chegou a ser ligada em nada — nesse caso é código morto
   protegido por engano (protegendo um arquivo que ninguém usa não erra nada, mas também não
   ajuda).

Não apaguei nem toquei — só registrando pra confirmarmos antes de decidir.

### `tailwind.config.ts` com globs mortos
`content: [..., "./pages/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"]` — os
dois primeiros caminhos não existem mais desde que o Bloco 5 moveu tudo pra `src/screens/**`.
Inofensivo (o terceiro glob já cobre tudo), mas é configuração enganosa — quem ler acha que o
projeto ainda tem `pages/` ou `app/` na raiz.

## P2 — Refatoração / arquitetura

### `LinksScreen.tsx` é o maior arquivo do repo (902 linhas) e acumula responsabilidades demais
Contagem de linhas dos maiores arquivos de `src/`:

```
902  src/screens/LinksScreen.tsx
544  src/screens/DesignScreen.tsx
509  src/screens/ShortLinksScreen.tsx
475  src/components/IconSelector.tsx   (é majoritariamente tabela de dados de ícone — ok)
423  src/screens/AnalyticsScreen.tsx
```

`LinksScreen.tsx` sozinho contém: estado + validação do formulário completo de link (título,
url, tipo, thumbnail/upload, ícone, agendamento, link-pra-outra-página), orquestração de 4
hooks de dados (`useLinks`, `useIntegrations`, `useTheme`, `useProfile`), montagem das props do
`MobilePreview`, e a renderização da lista com drag-and-drop. São pelo menos 3 "razões pra
mudar" diferentes (regra de agendamento muda por razão de negócio; layout do formulário muda
por razão de design; montagem do preview muda por razão do próprio `MobilePreview`) morando no
mesmo arquivo — heurística clássica de SRP violada. Candidato a quebrar em:
- `useLinkForm` (hook: estado do formulário + validação, hoje misturado no componente),
- `LinkFormDialog`/`LinkFormFields` (UI pura do formulário),
- `LinksScreen` fica só como orquestrador fino (lista + abre formulário + preview).

`DesignScreen.tsx` (544) e `ShortLinksScreen.tsx` (509) têm a mesma tendência em escala menor —
não é urgente, mas se for mexer neles vale considerar a mesma quebra.

### Duplicação semântica entre `PublicProfileScreen.tsx` e `MobilePreview.tsx`
As duas telas "desenham como a página pública fica" de forma independente: uma é o real (o que
o visitante vê), a outra é o preview em miniatura dentro do editor de Design/Links. Isso é
esperado até certo ponto (preview simplificado é um padrão razoável), mas hoje não há nenhum
vínculo entre os dois — se alguém mudar o visual do link real (ex: novo jeito de mostrar o
badge de "featured", novo raio de borda no ícone), o preview não acompanha sozinho, precisa
lembrar de replicar à mão em `MobilePreview.tsx`. Não precisa virar um componente só (o preview
tem motivo de ser mais simples), mas vale extrair pelo menos os pedaços puramente visuais (ex:
função que decide o estilo do botão/link a partir do tema) pra um helper compartilhado entre os
dois, em vez de duas implementações que só coincidem por enquanto.

### Fast-refresh warnings (múltiplos arquivos misturam export de componente + função/constante)
`LeadFormFieldsConfigurator.tsx`, `registry.tsx`, `ActivePageContext.tsx`, `lib/auth.tsx`, e
vários `components/ui/*` (herdados do shadcn) disparam o aviso
`react-refresh/only-export-components`. Baixa prioridade — não é bug, só custa um pouco de DX
(perde fast-refresh ao editar). Vale separar só se for mexer nesses arquivos por outro motivo.

## P3 — Observações de infraestrutura leve

- **Bundle único de 1.33 MB** (`vite build` avisa chunk >500kB) — SPA inteiro sem code-split.
  Não é bug hoje, mas cresce rápido se entrar lib pesada (ex: um editor tipo Excalidraw em
  outro clone da mesma base). Sugestão pra considerar: `React.lazy` nas rotas públicas vs. área
  `/app/*` — não fiz isso agora, é decisão de arquitetura, não conserto de bug.
- **`package.json` `"build"` não roda `tsc`** (script é só `vite build`) — já registrado na
  auditoria do Bloco 7 (`docs/plano-construcao/07-manifest-empacotamento.md`), repetindo aqui
  porque é o tipo de coisa que deixa erro de tipo passar batido em CI se alguém não rodar
  `tsc --noEmit` manualmente.

## Não é achado (checado e está OK)
- `src/data/linkTemplates.ts` e `src/utils/socialDetection.ts` — usados de verdade (não são
  código morto, cheguei a suspeitar e confirmei via grep de uso).
- Nenhum `console.log`/`TODO`/`FIXME` esquecido em `src/**`.
- `AddLinkModal.tsx` não duplica o formulário de `LinksScreen.tsx` — é o seletor de
  template/categoria de link (outra responsabilidade), não o formulário de edição.
