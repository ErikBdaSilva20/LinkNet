import { db } from "./client";
import type { Tables } from "./types.gen";

export type Lead = Tables<"leads">;

// Sem createLead aqui: captura de lead é escrita anônima via rota pública do gateway
// (ver docs/plano-construcao/06-pagina-publica-tracking.md), não pelo painel autenticado.
const leadsTable = db.table<Lead>("leads");

export const listLeads = () => leadsTable.list();
export const removeLead = (id: string) => leadsTable.remove(id);
