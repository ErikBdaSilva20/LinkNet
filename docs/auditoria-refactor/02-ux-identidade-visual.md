# 02 — Identidade visual: o quanto isso ainda é o Lovable clonado

> 🎨 Levantado por Sally (UX), 2026-07-23. Auditoria visual/UX em cima do código real
> (`src/index.css`, `tailwind.config.ts`, `curatedThemes.ts`, `LandingScreen`, `HomeScreen`,
> `AppShell`, `PublicProfileScreen`, `MobilePreview`). Só ideação — nada aqui foi implementado.

## Diagnóstico: sim, ainda é claramente um clone

Não é impressão — dá pra apontar exatamente onde.

1. **O comentário do próprio design system entrega**: `src/index.css:5-8` abre com
   `/* Design System - Viver de IA — Cores principais: Cyan/Teal — Tema: Dark mode com
   glassmorphism */`. "Viver de IA" é outro produto. Isso significa que a paleta cyan/teal, o
   glassmorphism, os orbs flutuantes — **nada disso foi uma decisão tomada para o LinkGuild**.
   Foi herdado inteiro de outro projeto e ninguém tocou.

2. **A Landing é o template de AI-SaaS mais genérico que existe**: hero centralizado + badge
   com ícone de sparkle + título com uma palavra em gradiente + parágrafo + 2 botões + grid de
   4 feature-cards com ícone/título/descrição + CTA final + footer. Isso é literalmente a forma
   que qualquer ferramenta de IA (Lovable, v0, bolt.new) produz por padrão quando você pede
   "landing page para um SaaS". Nada na estrutura, na copy ("Todos os seus links em um só
   lugar", "Simples, rápido e profissional") ou no layout fala especificamente sobre
   link-in-bio, sobre captura de lead ou sobre analytics — dá pra trocar o texto e reusar pra
   qualquer produto.

3. **Glassmorphism + orbs + partículas animadas em TODA tela, inclusive o dashboard logado**.
   `AnimatedBackground.tsx` (grid tech + 3 orbs + 20 partículas) e `.glass-card` (blur +
   borda translúcida) são usados tanto na Landing (onde motion/ambiente faz sentido pra vender
   o produto) quanto no Home/Links/Design/Analytics logados (onde o usuário está tentando
   *trabalhar* — gerenciar links, ler números). Ambiente de "página de vendas" vazando pra
   dentro da ferramenta de produtividade é a marca registrada de template de IA genérico: tudo
   parece "impressionante" na primeira olhada e cansativo no uso diário.

4. **A página pública (o produto de verdade) usa o mesmo gradiente navy-cyan do admin como
   default**. Quando `theme` é `null`, `PublicProfileScreen.tsx:32-38` cai pro mesmo
   `#0f172a → #1e293b` que é a cor de fundo do dashboard inteiro. O produto final que o cliente
   do cliente vê (o visitante da bio) começa parecendo "o admin de um SaaS", não uma página de
   link-in-bio com identidade própria — só ganha cara própria depois que alguém escolhe um dos
   `CURATED_THEMES`.

5. **Três nomes de marca disputando o mesmo produto** (ver também achado #2 do doc de código):
   "LinkBio" no sidebar e no rodapé da página pública, "LinkGuild" no manifesto/produto real,
   "Viver de IA" no copyright da landing e no comentário do CSS. Não dá pra desenhar uma
   identidade visual em cima de um produto que ainda não decidiu como se chama.

**Por que isso importa além da estética**: cada "app pronto" do hub Masia nasce do mesmo
scaffold `wiki` (Tailwind + shadcn + esse mesmo `.glass-card`/`gradient-text`/orbs). Se o
LinkGuild não investir em nada visualmente específico do domínio dele, o único diferencial
entre um clone de CRM, um de wiki e este de link-in-bio vira só o texto dos botões — todos com
a mesma "personalidade de IA genérica". Quem clona pelo Marketplace not vai perceber diferença
de qualidade de design entre os templates, porque não tem diferença.

## Oportunidades de diferenciação (ideias pra discutir, não specs)

**A. Separar "modo palco" de "modo ferramenta".** Reservar glassmorphism + orbs + partículas +
gradientes animados pras telas *não-autenticadas* que existem pra vender o produto (Landing,
Login, Register) e pra quando o tema escolhido do cliente final pedir esse visual na página
pública. Tirar tudo isso do `/app/*` autenticado — dashboard vira uma superfície calma, densa,
de alto contraste, mais perto de Linear/Notion do que de uma página de vendas. Essa mudança
sozinha já resolveria a maior parte da sensação de "clone de IA genérico" nas telas que o
usuário realmente usa todo dia (que são as internas, não a landing).

**B. A página pública é o produto — investir a diferenciação visual ali, não no admin.** O
schema já suporta bastante (tema por página: `background_type`, `font_family`, `button_style`,
`button_radius`, `accent_color`) mas hoje isso só troca cor/gradiente de fundo. Dá pra pensar em
diferenciação de *forma*, não só de cor: os `CURATED_THEMES` já variam `button_style` (rounded/
pill/square) — vale explorar se cada tema também muda a "linguagem" do card de link (borda vs.
preenchido vs. underline-only), não só a paleta. Isso faria cada página pública parecer
genuinamente diferente das outras, em vez de "mesmo card, cor trocada".

**C. Levar o `MobilePreview` (o frame de celular) pro centro da experiência do admin, não só um
widget de canto em Links/Design.** O valor real do produto é "como minha página vai ficar" — a
maioria dos apps de link-in-bio de mercado (Linktree, Beacons) usa o preview ao vivo como o
elemento visual dominante da tela inteira, não um acessório. Hoje o preview já existe e já é
funcional — é mais uma escolha de hierarquia visual (dar mais espaço/destaque a ele) do que
trabalho novo.

**D. Resolver a colisão de nome antes de desenhar qualquer identidade nova.** LinkBio vs.
LinkGuild vs. Viver de IA precisa virar 1 nome só (isso é decisão de produto, não de design —
mas bloqueia qualquer trabalho visual sério).

**E. Diferenciar por propósito de tela, não só reusar `GlassCard` em tudo.** O Analytics já é o
que mais foge do genérico — usa `recharts` de verdade, tabelas, densidade de dado. Home/Links/
Design ainda são só grids de `GlassCard` com ícone+número ou ícone+texto. Vale considerar um
registro visual mais "lista/tarefa" pra Links (foco em ação rápida: reordenar, ativar/
desativar) vs. mais "galeria" pra Design (já é o que `ThemeGallery`/`ThemeCard` fazem bem) vs.
mais "dado" pro Analytics (já ok) — em vez de nivelar tudo pelo mesmo card com blur.

## Esboço de direção (só ideação)

- **Modo produtividade** pro `/app/*`: fundo sólido (sem gradiente animado), `.glass-card` vira
  um card comum (borda + sombra leve, sem blur), radius menor, paleta com mais neutro e menos
  glow. Motion continua existindo mas some da tela de fundo, sobra só em microinterações
  (hover, transição de rota).
- **Modo palco** continua existindo, mas só pra Landing/Login/Register e pro preview público
  quando o tema do cliente pedir.
- **Tipografia própria pro chrome do produto**: hoje é só Inter em tudo, inclusive nos temas
  públicos (`font_family` do tema só é usado na página pública mesmo, o que já está certo — mas
  o chrome do dashboard em si nunca teve uma escolha tipográfica própria, só herdou a fonte
  default do scaffold).
- **Empty states com mais que ícone Lucide solto**: "Nenhum link disponível ainda" (público) e
  "Comece a criar seus links" (Home) são texto + ícone genérico. Pouco custo pra dar um pouco
  mais de personalidade sem precisar de ilustração custom (ex: usar o próprio `MobilePreview`
  vazio como empty state, reforçando a ideia C acima).

## O que eu NÃO mudaria

- `lucide-react` como biblioteca de ícone — é leve, consistente, e trocar não traria
  diferenciação real (usuário final não reconhece "esse é ícone Lucide").
- O sistema de temas curados em si (`curatedThemes.ts`) — a lista de 19 temas é um bom ativo,
  o problema não é a variedade, é que o *chrome do admin* não tem nenhuma identidade própria
  fora desses temas (que são pro cliente final, não pra ferramenta).
