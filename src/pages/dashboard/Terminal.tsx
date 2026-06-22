import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Terminal as TerminalIcon, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Log = { type: "system" | "input" | "output" | "ok" | "warn" | "err"; text: string };

const initialLogs: Log[] = [
  { type: "system", text: "RedRainbowCommand Terminal v3.2.1 — secure session sealed to vault" },
  { type: "system", text: "Operator: ghost.7 • Node: synaptic-hub-01 • Cipher: AES-256-GCM" },
  { type: "system", text: 'Type "help" for available commands.' },
];

const helpText: Log[] = [
  { type: "output", text: "Available commands:" },
  { type: "output", text: "  status                       System & node health" },
  { type: "output", text: "  scan <cidr>                  Subnet discovery + port sweep" },
  { type: "output", text: "  vuln <host>                  Pull CVE findings for host" },
  { type: "output", text: "  vault list                   Recent sealed evidence" },
  { type: "output", text: "  mission start <name>         Launch orchestration playbook" },
  { type: "output", text: "  node <id>                    Inspect constellation node" },
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
      { type: "ok", text: `✓ Scan complete. 5 hosts • 11 services • sealed to vault EV-${2848 + Math.floor(Math.random() * 50)}` },
    ];
  },
  vuln: (args) => {
    const host = args[0] || "edge-gateway-07";
    return [
      { type: "output", text: `→ Querying CVE database for ${host}...` },
      { type: "err", text: "  CRIT  CVE-2024-4577  PHP CGI argument injection      CVSS 9.8" },
      { type: "warn", text: "  HIGH  CVE-2024-1086  Linux netfilter UAF             CVSS 7.8" },
      { type: "warn", text: "  HIGH  CVE-2023-44487 HTTP/2 Rapid Reset              CVSS 7.5" },
      { type: "output", text: "  MED   CVE-2024-2961  glibc iconv buffer overflow     CVSS 6.5" },
      { type: "ok", text: "✓ 4 findings pushed to triage queue." },
    ];
  },
  vault: (args) => {
    if (args[0] !== "list") return [{ type: "err", text: "usage: vault list" }];
    return [
      { type: "output", text: "EV-2847  packet_capture_0412.pcap     24.7MB  a3f7...c9d2  2m" },
      { type: "output", text: "EV-2846  lateral_movement_log.json    1.2MB   b8e1...4f7a  45m" },
      { type: "output", text: "EV-2845  c2_screenshot_proof.png      3.4MB   d2c9...8b3e  1h" },
      { type: "ok", text: "✓ Chain-of-custody intact. 6 items in vault." },
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

const TerminalPage = () => {
  const [logs, setLogs] = useState<Log[]>(initialLogs);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [logs]);

  const run = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const next: Log[] = [...logs, { type: "input", text: `$ ${trimmed}` }];

    if (trimmed === "clear") {
      setLogs(initialLogs);
      return;
    }
    const [cmd, ...args] = trimmed.split(/\s+/);
    const fn = commands[cmd];
    if (fn) {
      setLogs([...next, ...fn(args)]);
    } else {
      setLogs([
        ...next,
        { type: "err", text: `rrc: command not found: ${cmd}` },
        { type: "output", text: 'Type "help" for available commands.' },
      ]);
    }
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

  const colorFor = (t: Log["type"]) =>
    t === "system" ? "text-muted-foreground" :
    t === "input" ? "text-secondary" :
    t === "ok" ? "text-glow-green" :
    t === "warn" ? "text-glow-amber" :
    t === "err" ? "text-primary" :
    "text-foreground/90";

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Live Command Terminal</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Execute playbooks and capture findings — try: status, scan 10.0.1.0/24, vuln, vault list</p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 rounded-lg border border-border/50 bg-background/80 overflow-hidden flex flex-col min-h-[480px]"
      >
        <div className="p-3 border-b border-border/50 flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs text-muted-foreground">rrc-terminal — secure session</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="status-dot" />
            <span className="font-mono text-xs text-muted-foreground">CONNECTED</span>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-auto p-4 font-mono text-sm space-y-0.5">
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
            placeholder="Enter command... (↑/↓ history)"
            className="flex-1 bg-transparent border-none font-mono text-sm text-foreground focus-visible:ring-0 h-8 p-0"
            autoFocus
          />
          <Button type="submit" size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default TerminalPage;
