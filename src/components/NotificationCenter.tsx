import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { bus, useBusEvent, type EventMap } from "@/lib/eventBus";
import { AnimatePresence, motion } from "framer-motion";

type Notif = EventMap["notification.created"] & { id: string; at: number; read: boolean };

const levelStyles: Record<Notif["level"], string> = {
  info:    "text-secondary border-secondary/30",
  success: "text-glow-green border-glow-green/30",
  warn:    "text-glow-amber border-glow-amber/30",
  error:   "text-primary border-primary/30",
};

let counter = 0;

export function NotificationCenter() {
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useBusEvent("notification.created", (p) => {
    setItems((prev) => [{ ...p, id: `N-${++counter}`, at: Date.now(), read: false }, ...prev].slice(0, 50));
  });

  // Auto-forward key cockpit events into the notification center.
  useBusEvent("signal.created", (p) => {
    if (p.severity === "Critical" || p.severity === "High") {
      bus.emit("notification.created", {
        level: p.severity === "Critical" ? "error" : "warn",
        title: `${p.severity} signal: ${p.type}`,
        detail: `${p.source} • ${p.id}`,
      });
    }
  });
  useBusEvent("mission.created", (p) => {
    bus.emit("notification.created", { level: "info", title: `Mission dispatched: ${p.name}`, detail: `${p.team} • ${p.id}` });
  });
  useBusEvent("vault.saved", (p) => {
    bus.emit("notification.created", { level: "success", title: `Sealed to Vault: ${p.name}`, detail: p.id });
  });

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = items.filter((i) => !i.read).length;

  const toggle = () => {
    setOpen((v) => !v);
    if (!open) setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative flex items-center gap-2 px-2 py-1 rounded border border-border/40 bg-card/40 hover:bg-card/80 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-3.5 w-3.5 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[9px] font-mono font-bold text-primary-foreground grid place-items-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 mt-2 w-[360px] max-h-[420px] overflow-auto rounded-lg border border-border/60 bg-card/95 backdrop-blur-xl shadow-xl z-50"
          >
            <div className="p-3 border-b border-border/50 flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">NOTIFICATIONS</span>
              <button onClick={() => setItems([])} className="font-mono text-[10px] text-muted-foreground hover:text-foreground">CLEAR</button>
            </div>
            {items.length === 0 ? (
              <div className="p-6 text-center font-mono text-xs text-muted-foreground">No signals</div>
            ) : (
              <div className="divide-y divide-border/30">
                {items.map((n) => (
                  <div key={n.id} className={`p-3 border-l-2 ${levelStyles[n.level]} bg-background/30`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{n.title}</p>
                        {n.detail && <p className="font-mono text-[10px] text-muted-foreground truncate mt-0.5">{n.detail}</p>}
                      </div>
                      <button
                        onClick={() => setItems((prev) => prev.filter((i) => i.id !== n.id))}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="font-mono text-[9px] text-muted-foreground mt-1">
                      {new Date(n.at).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
