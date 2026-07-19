// Inline Copilot recommendation panel — surfaces synthesized insights on any
// page that wants them. Filter by route or by max count.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ChevronRight } from "lucide-react";
import { synthesizeInsights, type CopilotInsight } from "@/lib/copilot";
import { subscribeIncidents } from "@/lib/incidentStore";

const sevStyle: Record<CopilotInsight["severity"], string> = {
  Critical: "text-primary border-primary/40 bg-primary/10",
  High:     "text-glow-amber border-glow-amber/40 bg-glow-amber/10",
  Medium:   "text-secondary border-secondary/40 bg-secondary/10",
  Low:      "text-glow-green border-glow-green/40 bg-glow-green/10",
  Info:     "text-muted-foreground border-border bg-muted/30",
};

interface Props {
  route?: string;   // only show insights linked to this route
  limit?: number;
  title?: string;
}

export const CopilotInline = ({ route, limit = 3, title = "Copilot Recommendations" }: Props) => {
  const [insights, setInsights] = useState<CopilotInsight[]>([]);

  useEffect(() => {
    const refresh = () => {
      const all = synthesizeInsights();
      const filtered = route ? all.filter((i) => !i.route || i.route === route) : all;
      setInsights(filtered.slice(0, limit));
    };
    refresh();
    // Re-synthesize when incidents change (proxy for cockpit state churn).
    const u = subscribeIncidents(refresh);
    const iv = setInterval(refresh, 5000);
    return () => { u(); clearInterval(iv); };
  }, [route, limit]);

  if (!insights.length) return null;

  return (
    <div className="rounded-lg border border-secondary/30 bg-gradient-to-br from-secondary/5 to-transparent p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-secondary" />
        <span className="font-mono text-xs text-secondary tracking-wider uppercase">{title}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {insights.map((ins) => (
          <div key={ins.id} className="p-3 rounded border border-border/40 bg-card/40">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${sevStyle[ins.severity]}`}>
                {ins.severity}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">{ins.title}</p>
            <p className="font-mono text-[11px] text-muted-foreground mt-1 leading-relaxed">{ins.detail}</p>
            {ins.route && (
              <Link to={ins.route} className="inline-flex items-center gap-1 mt-2 font-mono text-[10px] text-secondary hover:text-secondary/80">
                Investigate <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
