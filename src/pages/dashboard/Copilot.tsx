import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, Send, Bot, User, Zap, ShieldAlert, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  runCopilot,
  synthesizeInsights,
  type CopilotMessage,
  type CopilotInsight,
} from "@/lib/copilot";
import { subscribeIncidents } from "@/lib/incidentStore";
import { subscribeVault } from "@/lib/vaultStore";

const sevColor: Record<CopilotInsight["severity"], string> = {
  Critical: "text-primary border-primary/40 bg-primary/10",
  High:     "text-glow-amber border-glow-amber/40 bg-glow-amber/10",
  Medium:   "text-secondary border-secondary/40 bg-secondary/10",
  Low:      "text-glow-green border-glow-green/40 bg-glow-green/10",
  Info:     "text-muted-foreground border-border bg-muted/20",
};

const suggestions = [
  "Give me a cockpit status",
  "What incidents are open?",
  "Recent IOCs",
  "Recommend next action",
];

const Copilot = () => {
  const nav = useNavigate();
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "welcome",
      role: "copilot",
      at: Date.now(),
      content:
        "I'm your cockpit copilot. I read live signals, incidents, IOCs, and the Evidence Vault to surface what matters. Ask me for a status, recommendations, or a specific module.",
    },
  ]);
  const [input, setInput] = useState("");
  const [insights, setInsights] = useState<CopilotInsight[]>(synthesizeInsights());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Refresh insights when incident/vault state changes.
  useEffect(() => {
    const u1 = subscribeIncidents(() => setInsights(synthesizeInsights()));
    const u2 = subscribeVault(() => setInsights(synthesizeInsights()));
    const id = setInterval(() => setInsights(synthesizeInsights()), 15000);
    return () => { u1(); u2(); clearInterval(id); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const stats = useMemo(() => ({
    critical: insights.filter((i) => i.severity === "Critical").length,
    high:     insights.filter((i) => i.severity === "High").length,
    total:    insights.length,
  }), [insights]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    const userMsg: CopilotMessage = { id: `u-${Date.now()}`, role: "user", content: q, at: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    // Simulate a tick of "thinking" for cinematic feel.
    setTimeout(() => {
      const reply = runCopilot(q);
      setMessages((prev) => [...prev, reply]);
    }, 320);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Copilot
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Client-side reasoning over live cockpit state — no data leaves the browser
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats.critical > 0 && (
            <div className="px-3 py-1.5 rounded border border-primary/40 bg-primary/10 font-mono text-xs text-primary">
              {stats.critical} critical
            </div>
          )}
          {stats.high > 0 && (
            <div className="px-3 py-1.5 rounded border border-glow-amber/40 bg-glow-amber/10 font-mono text-xs text-glow-amber">
              {stats.high} high
            </div>
          )}
          <div className="px-3 py-1.5 rounded border border-border bg-card/40 font-mono text-xs text-muted-foreground">
            {stats.total} insights
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat */}
        <div className="lg:col-span-2 rounded-lg border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden flex flex-col" style={{ height: 560 }}>
          <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
            <span className="status-dot" />
            <span className="font-mono text-xs text-muted-foreground">COPILOT · session live</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "copilot" && (
                    <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap font-mono leading-relaxed ${
                      m.role === "user"
                        ? "bg-secondary/15 border border-secondary/30 text-foreground"
                        : "bg-muted/30 border border-border/50 text-foreground"
                    }`}
                  >
                    {m.content}
                    {m.actions && m.actions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.actions.map((a, i) => (
                          <button
                            key={i}
                            onClick={() => a.route && nav(a.route)}
                            className="px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary font-mono text-[10px] hover:bg-primary/20"
                          >
                            {a.label} →
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-secondary/15 border border-secondary/40 flex items-center justify-center flex-shrink-0">
                      <User className="h-3.5 w-3.5 text-secondary" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="px-4 py-2 border-t border-border/50 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="px-2 py-1 rounded border border-border/50 bg-muted/20 hover:bg-muted/40 font-mono text-[10px] text-muted-foreground"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="p-3 border-t border-border/50 flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the copilot…"
              className="font-mono text-sm bg-background/60 border-border/60"
            />
            <Button type="submit" size="sm" className="font-mono bg-primary hover:bg-primary/90 text-primary-foreground">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>

        {/* Insight feed */}
        <div className="rounded-lg border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden flex flex-col" style={{ height: 560 }}>
          <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-glow-cyan" />
            <span className="font-mono text-xs text-muted-foreground">LIVE INSIGHTS</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/30">
            {insights.length === 0 && (
              <div className="p-6 text-center font-mono text-xs text-muted-foreground">
                No insights yet. Trigger a scan or wait for signal traffic.
              </div>
            )}
            {insights.map((i) => (
              <motion.button
                key={i.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => i.route && nav(i.route)}
                className="w-full text-left p-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start gap-2 mb-1">
                  {i.severity === "Critical" ? (
                    <ShieldAlert className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <Radio className="h-3.5 w-3.5 text-secondary flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${sevColor[i.severity]}`}>
                    {i.severity}
                  </span>
                  <span className="text-xs font-semibold text-foreground">{i.title}</span>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground leading-relaxed pl-6">{i.detail}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Copilot;
