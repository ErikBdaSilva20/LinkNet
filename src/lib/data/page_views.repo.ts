import { db } from "./client";
import type { Tables } from "./types.gen";

export type PageView = Tables<"page_views">;

// Só leitura pelo app autenticado — a escrita (se existir) acontece via rota pública (Bloco 6).
const pageViewsTable = db.table<PageView>("page_views");

export const listPageViews = () => pageViewsTable.list();
