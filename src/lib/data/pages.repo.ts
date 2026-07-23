import { db } from "./client";
import type { Tables } from "./types.gen";

export type Page = Tables<"pages">;

const pagesTable = db.table<Page>("pages");

export const listPages = () => pagesTable.list();
export const createPage = (input: Partial<Page>) => pagesTable.create(input);
export const updatePage = (id: string, patch: Partial<Page>) => pagesTable.update(id, patch);
export const removePage = (id: string) => pagesTable.remove(id);
