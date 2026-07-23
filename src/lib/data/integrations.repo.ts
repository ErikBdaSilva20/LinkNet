import { db } from "./client";
import type { Tables } from "./types.gen";

export type Integration = Tables<"integrations">;

const integrationsTable = db.table<Integration>("integrations");

export const listIntegrations = () => integrationsTable.list();
export const createIntegration = (input: Partial<Integration>) => integrationsTable.create(input);
export const updateIntegration = (id: string, patch: Partial<Integration>) =>
  integrationsTable.update(id, patch);
