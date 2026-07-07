import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Terminal as TerminalIcon, Send, BookOpen, Download, Archive, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { publishToVault } from "@/lib/vaultStore";

type Log = { type: "system" | "input" | "output" | "ok" | "warn" | "err"; text: string };

const initialLogs: Log[] = [
  { type: "system", text: "RedRainbow Command Terminal v3.2.1 — secure session sealed to vault" },
  { type: "system", text: "Operator: ghost.7 • Node: synaptic-hub-01 • Cipher: AES-256-GCM" },
  { type: "system", text: 'Type "help" for commands, or launch a curated playbook from the right panel.' },
];

const helpText: Log[] = [
  { type: "output", text: "Available commands:" },
  { type: "output", text: "  status                       System & node health" },
  { type: "output", text: "  scan <cidr>                  Subnet discovery + port sweep" },
  { type: "output", text: "  vuln <host>                  Pull CVE findings for host" },
  { type: "output", text: "  vault list                   Recent sealed evidence" },
  { type: "output", text: "  mission start <name>         Launch orchestration playbook" },
  { type: "output", text: "  node <id>                    Inspect constellation node" },
  { type: "output", text: "  capture save                 Seal current log to vault" },
  { type: "output", text: "  capture export               Download log as .txt" },
  { type: "output", text: "  whoami | clear | help" },
];

const commands: Record<string, (args: string[]) => Log[]> = {
  help: () => helpText,
  whoami: () => [{ type: "output", text: "ghost.7 • clearance: TS/SCI • role: Lead Operator" }],
  status: () => [
    { type: "ok", text: "✓ Synaptic Hub        ONLINE   42ms" },
    { type: "ok", text: "✓ Live Telemetry      STREAM   2418 ev/s" },
    { type: "ok", text: "✓ Stable Vault        SEALED   integrity 99.999%" },
    { type: "ok", text: "✓ Network Isolated    ENFORCED zones 6/6" },
    { type: "output", text: "12 nodes • 7 missions active • 14 open exposures" },
  ],
  scan: (args) => {
    const target = args[0] || "10.0.1.0/24";
    return [
      { type: "output", text: `→ Sweeping ${target}...` },
      { type: "output", text: "  10.0.1.4   open: 22,80,443      [bastion-mgmt-02]" },
      { type: "output", text: "  10.0.1.7   open: 80,443,8080    [edge-gateway-07]" },
      { type: "output", text: "  10.0.1.12  open: 22,5432        [db-internal-01]" },
      { type: "output", text: "  10.0.1.18  open: 80,443         [api.redrain.sec]" },
      { type: "warn", text: "! 10.0.1.21  open: 23 (telnet)     UNEXPECTED — flagged" },
      { type: "ok", text: `✓ Scan complete. 5 hosts • 11 services.` },
    ];
  },
  vuln: (args) => {
    const host = args[0] || "edge-gateway-07";
    return [
      { type: "output", text: `→ Querying CVE database for ${host}...` },
      { type: "err",    text: "  CRIT  CVE-2024-4577  PHP CGI argument injection      CVSS 9.8" },
      { type: "warn",   text: "  HIGH  CVE-2024-1086  Linux netfilter UAF             CVSS 7.8" },
      { type: "warn",   text: "  HIGH  CVE-2023-44487 HTTP/2 Rapid Reset              CVSS 7.5" },
      { type: "output", text: "  MED   CVE-2024-2961  glibc iconv buffer overflow     CVSS 6.5" },
      { type: "ok",     text: "✓ 4 findings pushed to triage queue." },
    ];
  },
  vault: (args) => {
    if (args[0] !== "list") return [{ type: "err", text: "usage: vault list" }];
    return [
      { type: "output", text: "EV-2847  packet_capture_0412.pcap     24.7MB  a3f7...c9d2  2m" },
      { type: "output", text: "EV-2846  lateral_movement_log.json    1.2MB   b8e1...4f7a  45m" },
      { type: "output", text: "EV-2845  c2_screenshot_proof.png      3.4MB   d2c9...8b3e  1h" },
      { type: "ok", text: "✓ Chain-of-custody intact." },
    ];
  },
  mission: (args) => {
    if (args[0] !== "start" || !args[1]) return [{ type: "err", text: "usage: mission start <name>" }];
    const name = args.slice(1).join(" ");
    const id = `M-0${48 + Math.floor(Math.random() * 9)}`;
    return [
      { type: "output", text: `→ Allocating cyber-range for "${name}"...` },
      { type: "output", text: "  • Provisioning isolated zone…  OK" },
      { type: "output", text: "  • Snapshotting baselines…       OK" },
      { type: "output", text: "  • Wiring Red + Blue telemetry…  OK" },
      { type: "ok", text: `✓ Mission ${id} launched. Audit trail sealed.` },
    ];
  },
  node: (args) => {
    const id = args[0] || "kali-01";
    return [
      { type: "output", text: `Node: ${id}` },
      { type: "output", text: "  os: kali-rolling 2026.1   cpu: 14%   mem: 38%   net: isolated" },
      { type: "output", text: "  toolset: nmap, metasploit, burp, sliver, evil-winrm" },
      { type: "ok", text: "✓ Node ready for tasking." },
    ];
  },
};

type Playbook = {
  id: string;
  name: string;
  team: "Red" | "Blue" | "Purple";
  desc: string;
  steps: { cmd: string; note: string }[];
};

const playbooks: Playbook[] = [
  {
    id: "pb-recon",
    name: "External Recon Sweep",
    team: "Red",
    desc: "Enumerate perimeter, fingerprint services, flag unexpected exposures.",
    steps: [
      { cmd: "status",              note: "Verify sensor mesh online" },
      { cmd: "scan 10.0.1.0/24",    note: "Sweep DMZ subnet" },
      { cmd: "vuln edge-gateway-07",note: "Pull CVEs for exposed edge" },
    ],
  },
  {
    id: "pb-incident",
    name: "Incident Triage — C2 Beacon",
    team: "Blue",
    desc: "Confirm live C2 activity, snapshot state, seal evidence chain.",
    steps: [
      { cmd: "status",                    note: "Confirm telemetry uplink" },
      { cmd: "node kali-01",              note: "Inspect suspected pivot host" },
      { cmd: "vuln bastion-mgmt-02",      note: "Correlate exploited CVEs" },
      { cmd: "vault list",                note: "Log current evidence chain" },
    ],
  },
  {
    id: "pb-purple",
    name: "Purple Team Exercise",
    team: "Purple",
    desc: "Red simulates lateral movement while Blue captures detection gaps.",
    steps: [
      { cmd: "mission start purple-drill-42", note: "Provision isolated arena" },
      { cmd: "scan 10.0.1.0/24",              note: "Baseline surface" },
      { cmd: "node kali-01",                  note: "Attacker toolset check" },
    ],
  },
];

const teamColor: Record<Playbook["team"], string> = {
  Red: "text-primary border-primary/40 bg-primary/10",
  Blue: "text-secondary border-secondary/40 bg-secondary/10",
  Purple: "text-glow-amber border-glow-amber/40 bg-glow-amber/10",
};

const TerminalPage = () => {
  const [logs, setLogs] = useState<Log[]>(initialLogs);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const [autoSeal, setAutoSeal] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<Log[]>(initialLogs);

  useEffect(() => { logsRef.current = logs; }, [logs]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [logs]);

  const serialize = (arr: Log[]) =>
    arr.map((l) => {
      const tag = l.type === "input" ? ">" : l.type === "err" ? "[ERR]" : l.type === "warn" ? "[WARN]" : l.type === "ok" ? "[OK]" : l.type === "system" ? "[SYS]" : "   ";
      return `${tag} ${l.text}`;
    }).join("\n");

  const sealCurrent = (label: string, source: string) => {
    const body = serialize(logsRef.current);
    const bytes = new Blob([body]).size;
    const size = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
    const item = publishToVault({
      name: `${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString(36)}.log`,
      type: "Log",
      size,
      source,
    });
    toast.success(`Sealed to vault as ${item.id}`, { description: item.name });
    return item;
  };

  const exportLog = () => {
    const body = serialize(logsRef.current);
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rrc-terminal-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Log exported", { description: "Downloaded as .txt" });
  };

  const run = (raw: string): Log[] => {
    const trimmed = raw.trim();
    if (!trimmed) return logsRef.current;
    const next: Log[] = [...logsRef.current, { type: "input", text: `$ ${trimmed}` }];

    if (trimmed === "clear") {
      setLogs(initialLogs);
      return initialLogs;
    }
    const [cmd, ...args] = trimmed.split(/\s+/);

    if (cmd === "capture") {
      if (args[0] === "save") {
        const item = sealCurrent("Terminal Capture", "terminal");
        const out: Log[] = [...next, { type: "ok", text: `✓ Log sealed to vault ${item.id} • ${item.hash}` }];
        setLogs(out);
        return out;
      }
      if (args[0] === "export") {
        exportLog();
        const out: Log[] = [...next, { type: "ok", text: "✓ Log exported to disk." }];
        setLogs(out);
        return out;
      }
      const out: Log[] = [...next, { type: "err", text: "usage: capture save | capture export" }];
      setLogs(out);
      return out;
    }

    const fn = commands[cmd];
    if (fn) {
      const out = [...next, ...fn(args)];
      setLogs(out);
      return out;
    }
    const out: Log[] = [
      ...next,
      { type: "err", text: `rrc: command not found: ${cmd}` },
      { type: "output", text: 'Type "help" for available commands.' },
    ];
    setLogs(out);
    return out;
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setHistory((h) => [input, ...h]);
    setHIdx(-1);
    run(input);
    setInput("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      const i = Math.min(hIdx + 1, history.length - 1);
      setHIdx(i);
      setInput(history[i]);
    } else if (e.key === "ArrowDown" && hIdx > -1) {
      e.preventDefault();
      const i = hIdx - 1;
      setHIdx(i);
      setInput(i < 0 ? "" : history[i]);
    }
  };

  const runPlaybook = async (pb: Playbook) => {
    if (running) return;
    setRunning(pb.id);
    setLogs((l) => [...l, { type: "system", text: `▶ Playbook: ${pb.name} (${pb.team} team)` }]);
    const tid = toast.loading(`Playbook running — ${pb.name}`, { description: `${pb.steps.length} steps queued` });
    for (let i = 0; i < pb.steps.length; i++) {
      const step = pb.steps[i];
      toast.loading(`Step ${i + 1}/${pb.steps.length} — ${step.note}`, { id: tid });
      await new Promise((r) => setTimeout(r, 750));
      setLogs((l) => [...l, { type: "system", text: `  · step ${i + 1}: ${step.note}` }]);
      run(step.cmd);
      await new Promise((r) => setTimeout(r, 550));
    }
    setLogs((l) => [...l, { type: "ok", text: `✓ Playbook "${pb.name}" complete.` }]);
    if (autoSeal) {
      const item = sealCurrent(`Playbook ${pb.name}`, `playbook:${pb.id}`);
      setLogs((l) => [...l, { type: "ok", text: `✓ Auto-published to vault ${item.id} • ${item.hash}` }]);
      toast.success(`Playbook complete — sealed ${item.id}`, { id: tid, description: pb.name });
    } else {
      toast.success(`Playbook complete — ${pb.name}`, { id: tid });
    }
    setRunning(null);
  };

  const colorFor = (t: Log["type"]) =>
    t === "system" ? "text-muted-foreground" :
    t === "input" ? "text-secondary" :
    t === "ok" ? "text-glow-green" :
    t === "warn" ? "text-glow-amber" :
    t === "err" ? "text-primary" :
    "text-foreground/90";

  const lineCount = useMemo(() => logs.length, [logs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Command Terminal</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">Curated playbooks • log capture • auto-seal to Evidence Vault</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded border border-border/50 bg-card/50 font-mono text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={autoSeal} onChange={(e) => setAutoSeal(e.target.checked)} className="accent-primary" />
            Auto-seal playbook output
          </label>
          <Button onClick={() => run("capture save")} size="sm" variant="outline" className="font-mono text-xs border-glow-green/40 text-glow-green hover:bg-glow-green/10">
            <Archive className="h-3 w-3 mr-2" /> Seal to Vault
          </Button>
          <Button onClick={exportLog} size="sm" variant="outline" className="font-mono text-xs border-secondary/40 text-secondary hover:bg-secondary/10">
            <Download className="h-3 w-3 mr-2" /> Export Log
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:col-span-2 rounded-lg border border-border/50 bg-background/80 overflow-hidden flex flex-col min-h-[560px]"
        >
          <div className="p-3 border-b border-border/50 flex items-center gap-2">
            <TerminalIcon className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs text-muted-foreground">rrc-terminal — secure session</span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">{lineCount} lines</span>
            <span className="status-dot" />
            <span className="font-mono text-xs text-muted-foreground">CONNECTED</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-auto p-4 font-mono text-sm space-y-0.5 max-h-[560px]">
            {logs.map((log, i) => (
              <div key={i} className={`whitespace-pre-wrap ${colorFor(log.type)}`}>{log.text}</div>
            ))}
          </div>

          <form onSubmit={handleCommand} className="p-3 border-t border-border/50 flex items-center gap-2">
            <span className="font-mono text-sm text-secondary">$</span>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={running ? `Playbook running — ${running}` : "Enter command... (↑/↓ history)"}
              disabled={!!running}
              className="flex-1 bg-transparent border-none font-mono text-sm text-foreground focus-visible:ring-0 h-8 p-0"
              autoFocus
            />
            <Button type="submit" size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </motion.div>

        <div className="rounded-lg border border-border/50 bg-card/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Curated Playbooks</h2>
          </div>
          <div className="space-y-3">
            {playbooks.map((pb) => (
              <motion.div key={pb.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded border border-border/50 bg-background/40 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{pb.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${teamColor[pb.team]}`}>{pb.team}</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">{pb.desc}</p>
                <ul className="font-mono text-[11px] text-muted-foreground/80 space-y-0.5 pl-3 border-l border-border/50">
                  {pb.steps.map((s, i) => (
                    <li key={i}><span className="text-secondary">$</span> {s.cmd}</li>
                  ))}
                </ul>
                <Button
                  onClick={() => runPlaybook(pb)}
                  disabled={!!running}
                  size="sm"
                  className="w-full h-7 font-mono text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40"
                >
                  <Play className="h-3 w-3 mr-2" />
                  {running === pb.id ? "Running…" : "Execute Playbook"}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalPage;
