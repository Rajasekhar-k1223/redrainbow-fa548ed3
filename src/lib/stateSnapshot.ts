// Export/import cockpit state (localStorage only). Useful for demo resets
// and for handing a triage snapshot to another operator.

const KEYS = [
  "redrainbow.vault.v1",
  "redrainbow.vault.counter.v1",
  "redrainbow.incidents.v1",
  "redrainbow.iocs.v1",
  "redrainbow.operators.v1",
  "redrainbow.integrations.v1",
  "redrainbow.prefs.v1",
  "redrainbow.currentOperator.v1",
];

export type Snapshot = { version: 1; createdAt: number; data: Record<string, unknown> };

export const exportSnapshot = (): Snapshot => {
  const data: Record<string, unknown> = {};
  for (const k of KEYS) {
    try {
      const raw = window.localStorage.getItem(k);
      if (raw != null) data[k] = JSON.parse(raw);
    } catch { /* ignore */ }
  }
  return { version: 1, createdAt: Date.now(), data };
};

export const downloadSnapshot = () => {
  const snap = exportSnapshot();
  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `redrainbow-snapshot-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};

export const importSnapshot = async (file: File): Promise<void> => {
  const text = await file.text();
  const snap = JSON.parse(text) as Snapshot;
  if (!snap || snap.version !== 1 || !snap.data) throw new Error("Invalid snapshot");
  for (const k of KEYS) {
    if (k in snap.data) window.localStorage.setItem(k, JSON.stringify(snap.data[k]));
  }
  // Full reload so every store re-hydrates from localStorage.
  window.location.reload();
};
