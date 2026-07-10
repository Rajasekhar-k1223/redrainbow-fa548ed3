// Lightweight pub/sub for evidence sealed by the Command Terminal.
// Vault page subscribes and prepends new items; Terminal calls publishToVault().
// Also forwards to the global eventBus as `vault.saved` so the whole cockpit
// (Dashboard KPIs, Compliance risk) can react.
//
// Persisted to localStorage so reloads don't wipe the cockpit's sealed evidence.

import { bus } from "./eventBus";

export type VaultItem = {
  id: string;
  name: string;
  type: string;
  size: string;
  sealed: string;
  hash: string;
  custody: "Sealed" | "In Review" | "Transferred";
  source?: string;
};

const STORAGE_KEY = "redrainbow.vault.v1";
const COUNTER_KEY = "redrainbow.vault.counter.v1";

const listeners = new Set<(items: VaultItem[]) => void>();

const loadInitial = (): { items: VaultItem[]; counter: number } => {
  if (typeof window === "undefined") return { items: [], counter: 2848 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const rawC = window.localStorage.getItem(COUNTER_KEY);
    const items = raw ? (JSON.parse(raw) as VaultItem[]) : [];
    const counter = rawC ? Number(rawC) || 2848 : 2848;
    return { items: Array.isArray(items) ? items : [], counter };
  } catch {
    return { items: [], counter: 2848 };
  }
};

const initial = loadInitial();
let published: VaultItem[] = initial.items;
let counter = initial.counter;

const persist = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(published.slice(0, 200)));
    window.localStorage.setItem(COUNTER_KEY, String(counter));
  } catch {
    /* quota / private mode — ignore */
  }
};

const randHex = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");

export const publishToVault = (
  partial: Omit<VaultItem, "id" | "sealed" | "hash" | "custody"> & { custody?: VaultItem["custody"] },
): VaultItem => {
  const item: VaultItem = {
    id: `EV-${counter++}`,
    sealed: "just now",
    hash: `${randHex(4)}...${randHex(4)}`,
    custody: partial.custody ?? "Sealed",
    ...partial,
  };
  published = [item, ...published];
  persist();
  listeners.forEach((l) => l(published));
  bus.emit("vault.saved", {
    id: item.id,
    name: item.name,
    type: item.type,
    size: item.size,
    hash: item.hash,
    source: item.source,
  });
  return item;
};

export const getPublished = () => published;

export const clearVault = () => {
  published = [];
  persist();
  listeners.forEach((l) => l(published));
};

export const subscribeVault = (cb: (items: VaultItem[]) => void) => {
  listeners.add(cb);
  cb(published);
  return () => listeners.delete(cb);
};
