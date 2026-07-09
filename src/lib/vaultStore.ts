// Lightweight in-memory pub/sub for evidence sealed by the Command Terminal.
// Vault page subscribes and prepends new items; Terminal calls publishToVault().
// Also forwards to the global eventBus as `vault.saved` so the whole cockpit
// (Dashboard KPIs, Compliance risk) can react.

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

const listeners = new Set<(items: VaultItem[]) => void>();
let published: VaultItem[] = [];
let counter = 2848;

const randHex = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");

export const publishToVault = (partial: Omit<VaultItem, "id" | "sealed" | "hash" | "custody"> & { custody?: VaultItem["custody"] }): VaultItem => {
  const item: VaultItem = {
    id: `EV-${counter++}`,
    sealed: "just now",
    hash: `${randHex(4)}...${randHex(4)}`,
    custody: partial.custody ?? "Sealed",
    ...partial,
  };
  published = [item, ...published];
  listeners.forEach((l) => l(published));
  // Broadcast on the shared bus for cross-module reactivity.
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

export const subscribeVault = (cb: (items: VaultItem[]) => void) => {
  listeners.add(cb);
  cb(published);
  return () => listeners.delete(cb);
};
