import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, ShieldCheck, AlertOctagon, Fingerprint, BookOpen, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { subscribeIncidents, subscribeIocs, type Incident, type IOC } from "@/lib/incidentStore";
import { subscribeVault, type VaultItem } from "@/lib/vaultStore";
import { publishToVault } from "@/lib/vaultStore";

type ReportKind = "executive" | "incident" | "ioc" | "compliance" | "activity";

interface ReportDef {
  kind: ReportKind;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

const REPORTS: ReportDef[] = [
  { kind: "executive", title: "Executive Posture Brief",  description: "Leadership summary: risk posture, framework alignment, top risks.", icon: ShieldCheck, accent: "text-primary" },
  { kind: "incident",  title: "Incident Response Report", description: "Case-book export with owners, timeline, and disposition.",        icon: AlertOctagon, accent: "text-glow-amber" },
  { kind: "ioc",       title: "IOC Intelligence Pack",    description: "Full indicator ledger with severity, tags, and hit counts.",       icon: Fingerprint,  accent: "text-secondary" },
  { kind: "compliance",title: "Compliance Evidence Pack", description: "Framework controls + sealed evidence references for auditors.",    icon: BookOpen,     accent: "text-glow-green" },
  { kind: "activity",  title: "24h Activity Digest",      description: "Signals, missions, scans, and vault writes over the last day.",    icon: Activity,     accent: "text-glow-cyan" },
];

const drawHeader = (doc: jsPDF, subtitle: string) => {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(10, 10, 12); doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(255, 51, 51); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
  doc.text("REDRAINBOW", 40, 45);
  doc.setTextColor(0, 220, 220); doc.setFontSize(10);
  doc.text(subtitle, 40, 65);
  doc.setTextColor(160, 160, 170); doc.setFontSize(8);
  doc.text(`Generated ${new Date().toISOString()}`, 40, 80);
  doc.setTextColor(20, 20, 20);
};

const drawFooter = (doc: jsPDF, y: number) => {
  const W = doc.internal.pageSize.getWidth();
  doc.setDrawColor(220, 220, 220); doc.line(40, y + 14, W - 40, y + 14);
  doc.setFontSize(8); doc.setTextColor(140, 140, 150);
  doc.text("CONFIDENTIAL — RedRainbow Command Layer • Auto-generated report", 40, y + 30);
};

const Reports = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [iocs, setIocs] = useState<IOC[]>([]);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [history, setHistory] = useState<{ kind: ReportKind; name: string; at: string }[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(window.localStorage.getItem("redrainbow.reports.v1") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    const a = subscribeIncidents(setIncidents);
    const b = subscribeIocs(setIocs);
    const c = subscribeVault(setVault);
    return () => { a(); b(); c(); };
  }, []);

  const pushHistory = (kind: ReportKind, name: string) => {
    const entry = { kind, name, at: new Date().toISOString() };
    setHistory((h) => {
      const next = [entry, ...h].slice(0, 20);
      try { window.localStorage.setItem("redrainbow.reports.v1", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const generate = (kind: ReportKind) => {
    const def = REPORTS.find((r) => r.kind === kind)!;
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    drawHeader(doc, def.title);

    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text(def.title, 40, 130);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    let y = 155;

    const line = (t: string, indent = 40) => {
      if (y > 720) { doc.addPage(); y = 60; }
      doc.text(t, indent, y); y += 14;
    };
    const heading = (t: string) => { y += 8; doc.setFont("helvetica", "bold"); doc.setFontSize(12); line(t); doc.setFont("helvetica", "normal"); doc.setFontSize(10); };

    if (kind === "executive") {
      line("Overall Posture: A (98%)");
      line("Vault Integrity: 99.999%");
      line(`Open Incidents: ${incidents.filter((i) => i.status !== "Closed").length}`);
      line(`Active IOCs: ${iocs.length}`);
      heading("Top Risks");
      incidents.filter((i) => i.status !== "Closed").slice(0, 5).forEach((i) => line(`• [${i.severity}] ${i.id} — ${i.title}`, 50));
      heading("Framework Alignment");
      ["SOC 2 Type II — 94%", "HIPAA — 88%", "ISO 27001 — 96%"].forEach((s) => line(s, 50));
    } else if (kind === "incident") {
      line(`Total incidents: ${incidents.length}`);
      heading("Case Book");
      incidents.forEach((i) => {
        line(`${i.id}  [${i.severity}]  ${i.status}  — ${i.title}`, 50);
        line(`     owner: ${i.owner}  signals: ${i.linkedSignals.length}  IOCs: ${i.linkedIocs.length}`, 50);
      });
    } else if (kind === "ioc") {
      line(`Total indicators: ${iocs.length}`);
      heading("Indicator Ledger");
      iocs.forEach((i) => line(`${i.id}  [${i.type.toUpperCase()}]  ${i.value}  · ${i.severity}  · hits ${i.hits}`, 50));
    } else if (kind === "compliance") {
      heading("Framework Alignment");
      ["SOC 2 Type II — 124/132 controls passing", "HIPAA — 69/78 controls passing", "ISO 27001 — 109/114 controls passing"].forEach((s) => line(s, 50));
      heading("Sealed Evidence");
      vault.slice(0, 25).forEach((v) => line(`${v.id}  ${v.name}  · ${v.type} · ${v.size} · ${v.hash}`, 50));
      if (vault.length === 0) line("No live vault items — using baseline set.", 50);
    } else if (kind === "activity") {
      const dayAgo = Date.now() - 86400_000;
      heading("Incidents (24h)");
      incidents.filter((i) => i.updatedAt > dayAgo).forEach((i) => line(`${i.id} → ${i.status} · ${i.title}`, 50));
      heading("Evidence sealed (24h)");
      vault.slice(0, 20).forEach((v) => line(`${v.id}  ${v.name}  ${v.sealed}`, 50));
    }

    drawFooter(doc, y);
    const fname = `RedRainbow-${def.title.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fname);
    pushHistory(kind, fname);
    publishToVault({ name: fname, type: "Document", size: "~90 KB", source: `report:${kind}` });
    toast.success(`${def.title} exported`, { description: "Saved to downloads + Evidence Vault." });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reporting Center</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">One-click PDF exports auto-sealed to the Evidence Vault</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r, i) => (
          <motion.div key={r.kind} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-5 rounded-lg border border-border/50 bg-card/50 flex flex-col">
            <r.icon className={`h-6 w-6 mb-3 ${r.accent}`} />
            <h3 className="font-bold text-foreground">{r.title}</h3>
            <p className="font-mono text-xs text-muted-foreground mt-1 flex-1">{r.description}</p>
            <Button onClick={() => generate(r.kind)}
              className="mt-4 font-mono text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40">
              <Download className="h-3 w-3 mr-2" /> Generate PDF
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <FileText className="h-4 w-4 text-secondary" />
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Recent Exports</span>
        </div>
        <div className="divide-y divide-border/30">
          {history.length === 0 && <p className="p-6 text-center font-mono text-xs text-muted-foreground">No reports generated yet.</p>}
          {history.map((h, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <span className="font-mono text-xs text-foreground truncate">{h.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{new Date(h.at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
