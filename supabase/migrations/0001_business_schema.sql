-- =====================================================
-- Schema consolidado — template "linkbio" (fundação Masia)
-- Substitui as 24 migrations incrementais do Supabase original.
-- Sem RLS, sem auth.uid(), sem tabela profiles — autorização é 100% do
-- tenant-gateway (app-layer). Ver docs/plano-construcao/02-schema-migracao.md
-- para a justificativa completa de cada decisão tomada aqui.
-- =====================================================

-- ---------------------------------------------------
-- Enums (guarda idempotente — create type não aceita "if not exists")
-- ---------------------------------------------------

do $$ begin
  create type thumbnail_type as enum ('none', 'upload', 'icon');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type link_type as enum ('link', 'header');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type background_type as enum ('color', 'gradient', 'image');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------
-- Função compartilhada de updated_at
-- ---------------------------------------------------

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

-- ---------------------------------------------------
-- pages (fusão de profiles + pages do schema original — Decisão 1)
-- ---------------------------------------------------

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

-- ---------------------------------------------------
-- links
-- ---------------------------------------------------

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

-- ---------------------------------------------------
-- themes (1:1 por page — Decisão 2: dado do usuário, não catálogo)
-- ---------------------------------------------------

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
  button_radius          integer not null default 16,
  text_color             text,
  accent_color           text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
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

-- ---------------------------------------------------
-- integrations (1:1 por page — sem custom_head_html, decisão travada)
-- ---------------------------------------------------

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

-- ---------------------------------------------------
-- leads (escrita anônima via rota pública do gateway — ver §B6)
-- ---------------------------------------------------

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
comment on column leads.email is 'NOT NULL mesmo quando o formulário não coleta e-mail de verdade — o gateway grava um valor de placeholder nesse caso.';

-- ---------------------------------------------------
-- short_links e link_clicks
-- ---------------------------------------------------

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

-- ---------------------------------------------------
-- page_views
-- ---------------------------------------------------

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
