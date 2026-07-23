import { db } from "./client";
import type { Tables } from "./types.gen";

export type ShortLink = Tables<"short_links">;

const shortLinksTable = db.table<ShortLink>("short_links");

export const listShortLinks = () => shortLinksTable.list();
export const createShortLink = (input: Partial<ShortLink>) => shortLinksTable.create(input);
export const removeShortLink = (id: string) => shortLinksTable.remove(id);
