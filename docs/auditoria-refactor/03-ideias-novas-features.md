# 03 — Ideias de coisa nova que faça sentido

> Amelia + Sally, 2026-07-23. Ideação, não spec. Separado em duas categorias porque isso
> importa pro Importantdoc.md (§A3): o que **cabe no CRUD genérico hoje** (dá pra construir sem
> tocar no gateway) vs. o que **exigiria estender a fundação** (fica pra alinhar antes, Onda 2).
> Nenhuma dessas ideias foi validada com o dono do gateway nem priorizada — é ponto de partida
> pra conversa.

## Cabe hoje (dado já existe, é só interface/lógica client-side)

### 1. Home de verdade (pré-requisito, não é "ideia nova")
Antes de qualquer feature nova: conectar `HomeScreen.tsx` aos hooks que já existem
(`useLinks`, `useAnalytics`) em vez dos `"0"` fixos — ver `01-codigo-gaps-dead-code-refactor.md`
item P0.1. Mencionando aqui porque é o degrau zero de qualquer ideia de "melhorar o dashboard".

### 2. "Melhor link" / insight automático em cima do que já é coletado
`link_clicks` e `page_views` já guardam `clicked_at`/`created_at`, `device_type`, `referrer`.
Dá pra derivar, 100% client-side (mesmo padrão de agregação que `useAnalytics.ts` já faz):
- Horário/dia da semana com mais cliques ("seus links performam melhor às 19h de quinta").
- Link mais clicado da semana vs. semana anterior (`calculateChange` já existe, é só aplicar
  por link em vez de só no total).
- Sugestão de reordenar: "Instagram" tem 3x mais clique que "Loja Online" mas está mais embaixo
  na lista — nenhum schema novo, só ler `topLinks` (já existe em `useAnalytics`) e cruzar com a
  posição atual em `links.position`.

### 3. Exportar leads em CSV
`leads.list()` já traz tudo (`email`, `name`, `phone`, `custom_fields`). Gerar CSV no browser
(sem endpoint novo) e disparar download — feature clássica de "captura de lead" que hoje não
existe na `LeadsScreen`.

### 4. QR code com identidade do tema
`QRCodeGenerator.tsx` já existe. Hoje (preciso confirmar ao abrir o componente, não chequei a
fundo) provavelmente gera QR genérico preto/branco. Dá pra colorir o QR com `accent_color` do
tema ativo da página — puro canvas/client-side, reaproveitando dado que já está carregado.

### 5. Duplicar página como ponto de partida
`pages` já suporta múltiplas páginas por `owner_id` (handle único por página, não por conta) —
e `PageSelector.tsx`/`CreatePageModal.tsx` já existem pra trocar/criar página. "Duplicar esta
página" (copiar `pages` + `links` + `themes` do owner atual pra uma página nova) é só uma
sequência de `create()` no modo genérico, nenhuma tabela nova.

### 6. Short link com UTM automático
`integrations` já guarda `utm_source`/`utm_medium`/`utm_campaign` por página. `short_links` tem
`destination_url` solto. Dá pra, na hora de criar um short link, oferecer "adicionar UTM da
página automaticamente" — concatenar os params na `destination_url` antes de salvar. Zero
schema novo, só junta dois dados que já existem em tabelas diferentes.

### 7. Badge de agendamento mais visível
`schedule_enabled`/`starts_at`/`ends_at` já existe no schema e a visibilidade já é resolvida
client-side (decisão travada do Bloco 2). Hoje (a confirmar na tela) provavelmente não mostra
contagem regressiva. "Vai ao ar em 2 dias" / "expira em 3h" na lista de links é só formatação
de data que já está disponível — sem tocar em regra de negócio nenhuma.

## Exigiria estender a fundação (Onda 2 — não começar sem alinhar com o dono do gateway)

Marcando aqui só pra não perder a ideia, **não** pra propor implementar — todas essas batem
direto em alguma das categorias do §A3 do `Importantdoc.md`:

- **Resumo semanal de leads por e-mail** → precisa de job agendado/cron no gateway (§A3: "Jobs
  agendados"). Hoje o app não tem como "fazer algo quando o usuário não está olhando".
- **Webhook de novo lead pra Zapier/Make/n8n** → precisa de endpoint server-side novo
  (§A3: "Webhooks de terceiros").
- **Domínio customizado de verdade** (o schema já tem `custom_domain` na tabela `pages`, mas
  hoje é só um campo de texto sem nenhuma verificação/roteamento por trás) → provisionar
  domínio custom é infra (DNS/certificado), não cabe em CRUD genérico.

## Não investiguei a fundo (levantar antes de discutir)
- `QRCodeGenerator.tsx` e a tela de Settings não foram lidos em detalhe nesta rodada — pode já
  ter parte do item 4/7 acima implementado. Confirmar antes de propor como "novo".
