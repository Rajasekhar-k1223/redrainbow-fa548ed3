import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { ShieldAlert, Globe2, Server, CalendarClock } from "lucide-react";
import { verdictStyle, type IntelReport } from "@/lib/threatIntel";

interface Props {
  report: IntelReport | null;
  onClose: () => void;
}

export function IntelDrawer({ report, onClose }: Props) {
  return (
    <Sheet open={!!report} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md bg-card border-border/50 overflow-y-auto">
        {report && (
          <>
            <SheetHeader>
              <SheetTitle className="font-mono text-sm text-foreground break-all">
                {report.value}
              </SheetTitle>
            </SheetHeader>

            <div className="mt-5 space-y-6">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded border font-mono text-xs ${verdictStyle[report.verdict]}`}>
                  {report.verdict}
                </span>
                <span className="font-mono text-xs text-muted-foreground uppercase">{report.type}</span>
              </div>

              <div>
                <div className="flex items-center justify-between font-mono text-xs text-muted-foreground mb-1">
                  <span className="flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Risk score</span>
                  <span className="text-foreground">{report.risk}/100</span>
                </div>
                <Progress value={report.risk} className="h-1.5" />
                <div className="flex justify-between font-mono text-[10px] text-muted-foreground mt-2">
                  <span>Reputation {report.reputation}</span>
                  <span>Confidence {report.confidence}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Globe2, label: "Country", value: report.country },
                  { icon: Server, label: "ASN", value: report.asn },
                  { icon: Server, label: "Organization", value: report.org },
                  { icon: CalendarClock, label: "First seen (WHOIS)", value: report.firstRegistered },
                ].map((f) => (
                  <div key={f.label} className="p-3 rounded border border-border/50 bg-background/40">
                    <f.icon className="h-3 w-3 text-secondary mb-1.5" />
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</p>
                    <p className="font-mono text-xs text-foreground truncate">{f.value}</p>
                  </div>
                ))}
              </div>

              {report.categories.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Categories</p>
                  <div className="flex flex-wrap gap-1">
                    {report.categories.map((c) => (
                      <span key={c} className="px-1.5 py-0.5 rounded bg-muted/40 font-mono text-[10px] text-foreground">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Feed correlation</p>
                <div className="divide-y divide-border/30 rounded border border-border/50">
                  {report.feeds.map((f) => (
                    <div key={f.feed} className="flex items-center justify-between px-3 py-2">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-foreground">{f.feed}</p>
                        <p className="font-mono text-[10px] text-muted-foreground truncate">{f.hit ? f.category : "no records"}</p>
                      </div>
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${f.hit ? "text-primary border-primary/30 bg-primary/10" : "text-muted-foreground border-border"}`}>
                        {f.hit ? `+${f.score}` : "clean"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="font-mono text-[10px] text-muted-foreground">
                Enriched {new Date(report.enrichedAt).toLocaleString()}
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
