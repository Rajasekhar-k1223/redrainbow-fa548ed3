// Global shortcuts help. Press "?" (Shift+/) anywhere to open.
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

const shortcuts: Array<{ keys: string[]; label: string }> = [
  { keys: ["⌘", "K"], label: "Open command palette" },
  { keys: ["Ctrl", "K"], label: "Open command palette (Win/Linux)" },
  { keys: ["?"], label: "Show keyboard shortcuts" },
  { keys: ["Esc"], label: "Close overlays" },
  { keys: ["Enter"], label: "Submit note / send prompt" },
];

export function ShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "?" || (e.shiftKey && e.key === "/")) { e.preventDefault(); setOpen((v) => !v); }
      else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-border/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono tracking-wider text-sm">
            <Keyboard className="h-4 w-4 text-secondary" /> KEYBOARD SHORTCUTS
          </DialogTitle>
        </DialogHeader>
        <div className="divide-y divide-border/30">
          {shortcuts.map((s) => (
            <div key={s.label} className="flex items-center justify-between py-3">
              <span className="text-sm text-foreground">{s.label}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="font-mono text-[10px] text-muted-foreground text-center">Press ? anywhere to reopen this panel.</p>
      </DialogContent>
    </Dialog>
  );
}
