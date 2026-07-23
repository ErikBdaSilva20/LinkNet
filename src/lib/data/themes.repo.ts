import { db } from "./client";
import type { Tables } from "./types.gen";

export type Theme = Tables<"themes">;

const themesTable = db.table<Theme>("themes");

export const listThemes = () => themesTable.list();
export const createTheme = (input: Partial<Theme>) => themesTable.create(input);
export const updateTheme = (id: string, patch: Partial<Theme>) => themesTable.update(id, patch);
