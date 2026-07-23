import { db } from "./client";
import type { Tables } from "./types.gen";

export type Link = Tables<"links">;

const linksTable = db.table<Link>("links");

export const listLinks = () => linksTable.list();
export const createLink = (input: Partial<Link>) => linksTable.create(input);
export const updateLink = (id: string, patch: Partial<Link>) => linksTable.update(id, patch);
export const removeLink = (id: string) => linksTable.remove(id);
