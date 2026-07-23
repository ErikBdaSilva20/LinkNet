# Plano de Construção — Port LinkBio → Template Masia

> **Como usar este plano:** cada bloco abaixo é um arquivo próprio, autocontido, pensado pra
> ser retomado numa sessão nova (sem memória da conversa que originou este plano). Trabalhe
> **um bloco por vez**, na ordem sugerida — cada arquivo diz do que ele depende e o que ele
> destrava. Não pule a leitura das seções "Decisões já tomadas" e "Regras obrigatórias" de
> cada bloco: elas existem pra você não precisar re-perguntar o que já foi decidido.

## Fontes da verdade (leia antes de qualquer bloco)

- **`Importantdoc.md`** — regras técnicas da fundação Masia (gateway, schema, auth, publish). Contrato inegociável.
- **`docs/AUDITORIA-ADAPTACAO-MASIA.md`** — inventário original (gerado pelo Lovable) do que muda.
- Este plano nasceu de uma auditoria complementar feita em cima da auditoria acima, que achou
  gaps reais no código (storage, schema morto de produtos digitais/Stripe, agendamento via RLS,
  HTML customizado na página pública). As decisões abaixo resolvem esses gaps **sem estender a
  fundação** — em alguns casos cortando escopo, não reimplementando.

## Princípios que valem para TODOS os blocos

Isso não é comentário solto — é critério de aceite implícito em toda story deste plano:

1. **Boas práticas de código**: TypeScript tipado de ponta a ponta (sem `any` implícito depois
   do Bloco 1), nomes de função/variável que dizem o que fazem sem precisar de comentário,
   funções pequenas e com uma responsabilidade, sem duplicação de lógica entre telas/hooks.
2. **Organização**: cada arquivo mora onde o contrato do template espera (`src/screens`,
   `src/lib/data/*.repo.ts`, etc. — ver `Importantdoc.md` §B2/§B7). Nada de lógica de dados
   dentro de componente de tela; nada de fetch direto fora de `src/lib/data`.
3. **Escalabilidade**: qualquer coisa escrita aqui deve continuar funcionando se o número de
   tenants ou de linhas por tabela crescer — nada de padrão que dependa de rodar tudo em
   memória do client sem paginação/limite quando o volume não for pequeno por natureza (ex:
   analytics). Onde o modo genérico do gateway impõe um limite (sem filtro server-side, sem
   join), a story deve dizer explicitamente como o front absorve isso sem degradar com o tempo.

## Decisões já travadas (não reabrir sem motivo novo)

| Tema | Decisão |
|---|---|
| Autenticação | **Email/senha via Better-Auth apenas.** Sem OAuth Google/Apple, sem `@lovable.dev/cloud-auth-js`. |
| Imagens (avatar, ícone de link, capa de tema) | **Base64 (`data:` URI) direto na coluna de texto**, com resize/compressão no client antes de salvar. Sem Supabase Storage, sem serviço de upload de terceiro. |
| Produtos digitais / pagamento (`digital_products`, `orders`, bucket `product-files`, Stripe) | **Cortado completamente.** Não entra em nenhuma migration, tela ou tipo. Se um dia isso for prioridade, é projeto novo de extensão de fundação — fora deste plano. |
| Agendamento de link (`schedule_enabled`/`starts_at`/`ends_at`) | **Mantido**, mas a garantia de visibilidade passa a ser só client-side (sem RLS por trás). Aceitável por não ser dado sensível. |
| HTML customizado no `<head>` da página pública | **Cortado.** Mantém só Google Analytics measurement ID e Meta Pixel ID (IDs estruturados, já validados por regex). |
| Extensão de fundação (gateway/Neon/storage compartilhado) | **Fora de escopo em qualquer bloco.** Se uma story parecer exigir isso, ela está desenhada errado — volte e simplifique. |

## Os blocos, em ordem sugerida de execução

| # | Bloco | Arquivo | Depende de |
|---|---|---|---|
| 1 | Stack & Build | `01-stack-build.md` | — |
| 2 | Schema & Migração | `02-schema-migracao.md` | Bloco 1 (tsconfig/build já ajustado) |
| 3 | Auth | `03-auth.md` | Bloco 2 (papéis/`owner_id` definidos) |
| 4 | Camada de dados / Repos | `04-camada-de-dados.md` | Blocos 2 e 3 |
| 5 | Telas & Rotas | `05-telas-rotas.md` | Bloco 4 |
| 6 | Página pública & Tracking | `06-pagina-publica-tracking.md` | Blocos 2, 4 e 5 |
| 7 | Manifest, empacotamento & limpeza | `07-manifest-empacotamento.md` | Todos os anteriores |

A ordem importa: schema antes de repos, repos antes de telas, tudo antes de empacotar. Dá pra
adiantar leitura/planejamento de um bloco mais à frente, mas não dá pra **executar** fora de
ordem sem retrabalho.

## Como retomar numa sessão nova

Abra o arquivo do bloco que você vai atacar. Ele tem tudo que precisa: objetivo, o que já foi
decidido, as regras do `Importantdoc.md` que se aplicam, boas práticas específicas daquele
bloco, e as stories numeradas com critério de aceite. Não precisa reler esta conversa nem os
outros blocos — só o que o bloco atual declara como dependência.
