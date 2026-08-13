import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Crosshair, Save, Play, Trash2, ShieldAlert, Lock, Fingerprint, AlertOctagon,
  ScrollText, Download, Radar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  runHunt, saveQuery, removeQuery, subscribeQueries, subscribeRules,
  deployRule, retireRule, ruleTemplates,
  type HuntCorpus, type HuntResult, type SavedQuery, type DetectionRule,
} from "@/lib/huntStore";
import { useCan } from "@/lib/rbac";
import { techniqueById, tactics, coverageOf } from "@/lib/mitre";

const corpusMeta: Record<HuntCorpus, { label: string; icon: typeof Lock; tone: string }> = {
  vault:    { label: "Vault",     icon: Lock,         tone: "text-secondary border-secondary/30 bg-secondary/10" },
  ioc:      { label: "IOC",       icon: Fingerprint,  tone: "text-glow-amber border-glow-amber/30 bg-glow-amber/10" },
  incident: { label: "Incident",  icon: AlertOctagon, tone: "text-primary border-primary/30 bg-primary/10" },
  audit:    { label: "Audit",     icon: ScrollText,   tone: "text-glow-green border-glow-green/30 bg-glow-green/10" },
};

const allCorpora: HuntCorpus[] = ["vault", "ioc", "incident", "audit"];

const sevTone: Record<string, string> = {
  Critical: "text-primary border-primary/30 bg-primary/10",
  High: "text-glow-amber border-glow-amber/30 bg-glow-amber/10",
  Medium: "text-secondary border-secondary/30 bg-secondary/10",
  Low: "text-muted-foreground border-border/50 bg-muted/20",
};

const Hunt = () => {
  const [hypothesis, setHypothesis] = useState("An implant beacons from a lab isolate to a low-reputation ASN.");
  const [query, setQuery] = useState("c2 OR beacon OR tor");
  const [corpora, setCorpora] = useState<HuntCorpus[]>(allCorpora);
  const [result, setResult] = useState<HuntResult | null>(null);
  const [saved, setSaved] = useState<SavedQuery[]>([]);
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [selectedTactics, setSelectedTactics] = useState<string[]>([]);
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const canRun = useCan("scan.run");
  const canPublish = useCan("report.publish");

  useEffect(() => {
    const a = subscribeQueries(setSaved);
    const b = subscribeRules(setRules);
    return () => { a(); b(); };
  }, []);

  const toggleCorpus = (c: HuntCorpus) =>
    setCorpora((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const execute = (q = query, c = corpora) => {
    if (!q.trim()) { toast.error("Enter at least one search term"); return; }
    if (!c.length) { toast.error("Select at least one corpus"); return; }
    const r = runHunt(q, c);
    setResult(r);
    setSelectedTactics([]);
    setSelectedTechniques([]);
    toast.success(`Hunt complete — ${r.hits.length} hits`, { description: q });
  };

  const persistQuery = () => {
    if (!query.trim()) { toast.error("Nothing to save"); return; }
    const q = saveQuery({ name: hypothesis.slice(0, 48) || query, hypothesis, query, corpora });
    toast.success(`Saved as ${q.id}`);
  };

  const loadQuery = (q: SavedQuery) => {
    setHypothesis(q.hypothesis);
    setQuery(q.query);
    setCorpora(q.corpora);
    execute(q.query, q.corpora);
  };

  const exportHits = () => {
    if (!result?.hits.length) { toast.error("No results to export"); return; }
    const payload = {
      generatedAt: new Date().toISOString(),
      hypothesis, query: result.query, corpora, hits: result.hits,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = `hunt_findings_${Date.now()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success("Hunt findings exported");
  };

  const kpis = useMemo(() => {
    const b = result?.byCorpus ?? { vault: 0, ioc: 0, incident: 0, audit: 0 };
    return allCorpora.map((c) => ({ corpus: c, count: b[c] }));
  }, [result]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Threat Hunting Workbench</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Hypothesis-driven search across vault artifacts, IOCs, incidents and the audit ledger
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportHits} variant="outline" className="font-mono text-xs h-9 border-secondary/40 text-secondary hover:bg-secondary/10">
            <Download className="h-3.5 w-3.5 mr-2" /> Export Findings
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-primary/30 bg-primary/5">
            <Crosshair className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs text-primary">{rules.length} rules armed</span>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ corpus, count }) => {
          const m = corpusMeta[corpus];
          return (
            <div key={corpus} className="p-4 rounded-lg border border-border/50 bg-card/50">
              <m.icon className="h-4 w-4 text-muted-foreground mb-2" />
              <p className="text-xl font-bold text-foreground">{count}</p>
              <p className="font-mono text-xs text-muted-foreground">{m.label} hits</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Hunt console */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-4 rounded-lg border border-border/50 bg-card/50 space-y-3">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">HYPOTHESIS</p>
            <Textarea value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} rows={2}
              placeholder="Describe what you believe is happening…" className="font-mono text-xs" />
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">SEARCH TERMS</p>
            <Input value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") execute(); }}
              placeholder='e.g. memory OR dump OR lsass' className="font-mono text-xs h-9" />
            <div className="flex flex-wrap items-center gap-2">
              {allCorpora.map((c) => {
                const m = corpusMeta[c];
                const on = corpora.includes(c);
                return (
                  <button key={c} onClick={() => toggleCorpus(c)}
                    className={`px-2 py-1 rounded font-mono text-[10px] border transition-colors ${on ? m.tone : "text-muted-foreground border-border/50 hover:text-foreground"}`}>
                    {m.label}
                  </button>
                );
              })}
              <div className="ml-auto flex items-center gap-2">
                <Button onClick={persistQuery} variant="outline" className="font-mono text-xs h-8">
                  <Save className="h-3.5 w-3.5 mr-2" /> Save Query
                </Button>
                <Button onClick={() => execute()} disabled={!canRun}
                  className="font-mono text-xs h-8 bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30">
                  <Play className="h-3.5 w-3.5 mr-2" /> Run Hunt
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Hunt Results</span>
              {result && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  {result.hits.length} hits · {new Date(result.ranAt).toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="divide-y divide-border/30 max-h-[520px] overflow-y-auto">
              {(result?.hits ?? []).map((h, i) => {
                const m = corpusMeta[h.corpus];
                return (
                  <motion.div key={`${h.corpus}-${h.id}-${i}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i, 10) * 0.03 }}
                    className="px-4 py-3 hover:bg-muted/20 transition-colors flex items-start gap-3">
                    <m.icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">{h.title}</p>
                      <p className="font-mono text-xs text-muted-foreground truncate">{h.id} · {h.detail}</p>
                      {!!h.attack?.length && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {h.attack.map((a) => (
                            <span key={a.technique.id} title={`${a.tactic.id} ${a.tactic.name} — matched on "${a.matchedOn}"`}
                              className="px-1.5 py-0.5 rounded font-mono text-[10px] border border-glow-amber/30 bg-glow-amber/10 text-glow-amber">
                              {a.technique.id} · {a.technique.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] border ${m.tone}`}>{m.label}</span>
                      <span className="font-mono text-[10px] text-muted-foreground w-10 text-right">{h.score}%</span>
                    </div>
                  </motion.div>
                );
              })}
              {!result && (
                <div className="p-8 text-center font-mono text-xs text-muted-foreground">
                  Run a hunt to correlate artifacts across the cockpit.
                </div>
              )}
              {result && result.hits.length === 0 && (
                <div className="p-8 text-center font-mono text-xs text-muted-foreground">
                  Hypothesis not supported — no matching artifacts.
                </div>
              )}
            </div>
          </div>

          {/* ATT&CK coverage matrix */}
          <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">MITRE ATT&CK Coverage</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {result?.coverage.length ?? 0}/{tactics.length} tactics touched
              </span>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {tactics.map((tac) => {
                const cov = result?.coverage.find((c) => c.tacticId === tac.id);
                const armedTechs = rules.flatMap((r) => r.techniques);
                const armed = armedTechs.some((id) => techniqueById(id)?.tactic === tac.id);
                return (
                  <div key={tac.id}
                    className={`p-2.5 rounded border transition-colors ${cov ? "border-primary/40 bg-primary/10" : "border-border/40 bg-muted/10"}`}>
                    <p className={`font-mono text-[10px] ${cov ? "text-primary" : "text-muted-foreground"}`}>{tac.id}</p>
                    <p className={`text-xs truncate ${cov ? "text-foreground" : "text-muted-foreground"}`}>{tac.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">
                      {cov ? `${cov.count} hits · ${cov.techniques.length} tech` : "no hits"}
                    </p>
                    {armed && (
                      <p className="font-mono text-[10px] text-glow-green mt-0.5">rule armed</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Saved queries + rules */}
        <div className="space-y-6">
          <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Saved Queries
            </div>
            <div className="divide-y divide-border/30">
              {saved.map((q) => (
                <div key={q.id} className="px-4 py-3 group">
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => loadQuery(q)} className="text-left min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">{q.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground truncate">{q.id} · {q.query}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {q.corpora.join(" · ")}{q.lastHits !== undefined ? ` · last ${q.lastHits} hits` : ""}
                      </p>
                    </button>
                    <button onClick={() => removeQuery(q.id)} title="Delete query"
                      className="text-muted-foreground hover:text-primary transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {saved.length === 0 && (
                <div className="p-6 text-center font-mono text-xs text-muted-foreground">No saved queries.</div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Detection Rule Templates
            </div>
            <div className="divide-y divide-border/30 max-h-[420px] overflow-y-auto">
              {ruleTemplates.map((t) => {
                const armed = rules.some((r) => r.id === t.id);
                return (
                  <div key={t.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{t.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{t.tactic}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] border flex-shrink-0 ${sevTone[t.severity]}`}>
                        {t.severity}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">{t.description}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {t.techniques.map((id) => {
                        const tech = techniqueById(id);
                        return (
                          <span key={id} title={tech?.name}
                            className="px-1.5 py-0.5 rounded font-mono text-[10px] border border-glow-amber/30 bg-glow-amber/10 text-glow-amber">
                            {id}{tech ? ` · ${tech.name}` : ""}
                          </span>
                        );
                      })}
                    </div>
                    <pre className="font-mono text-[10px] text-secondary bg-muted/20 border border-border/40 rounded p-2 whitespace-pre-wrap break-words">{t.logic}</pre>
                    <div className="flex items-center gap-2">
                      {armed ? (
                        <Button onClick={() => retireRule(t.id)} variant="outline" className="font-mono text-[10px] h-7">
                          <ShieldAlert className="h-3 w-3 mr-1.5" /> Retire
                        </Button>
                      ) : (
                        <Button onClick={() => { deployRule(t); toast.success(`${t.name} armed`); }} disabled={!canPublish}
                          variant="outline" className="font-mono text-[10px] h-7 border-glow-green/40 text-glow-green hover:bg-glow-green/10">
                          <ShieldAlert className="h-3 w-3 mr-1.5" /> Arm Rule
                        </Button>
                      )}
                      <button onClick={() => { setQuery(t.name.split(" ").slice(0, 2).join(" OR ").toLowerCase()); }}
                        className="font-mono text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                        <Radar className="h-3 w-3" /> Hunt from rule
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hunt;
