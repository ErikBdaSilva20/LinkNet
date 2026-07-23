import { db } from "./client";
import type { Tables } from "./types.gen";

export type LinkClick = Tables<"link_clicks">;

// Só leitura pelo app autenticado — a escrita acontece via rota pública (Story 4.9/Bloco 6),
// nunca via /data/:table (o gateway já popula owner_id a partir de links/pages).
const linkClicksTable = db.table<LinkClick>("link_clicks");

export const listLinkClicks = () => linkClicksTable.list();
