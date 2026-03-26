import { useState } from "react";
import { motion } from "framer-motion";
import { Terminal as TerminalIcon, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialLogs = [
  { type: "system", text: "RedRainbowCommand Terminal v3.2.1" },
  { type: "system", text: "Secure session initialized. Vault connection sealed." },
  { type: "system", text: 'Type "help" for available commands.' },
  { type: "input", text: "$ rrc --status" },
  { type: "output", text: "✓ All systems nominal" },
  { type: "output", text: "✓ 12 nodes active | 7 missions running" },
  { type: "output", text: "✓ Vault integrity: 99.999%" },
  { type: "input", text: "$ rrc --scan --target=10.0.1.0/24" },
  { type: "output", text: "Scanning subnet 10.0.1.0/24..." },
  { type: "output", text: "Found 6 active hosts. Results sealed to vault." },
];

const TerminalPage = () => {
  const [logs, setLogs] = useState(initialLogs);
  const [input, setInput] = useState("");

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newLogs = [
      ...logs,
      { type: "input", text: `$ ${input}` },
      { type: "output", text: `Executing: ${input}...` },
      { type: "output", text: "✓ Command completed. Output sealed to vault." },
    ];
    setLogs(newLogs);
    setInput("");
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Live Command Terminal</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Execute playbooks and capture findings</p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 rounded-lg border border-border/50 bg-background/80 overflow-hidden flex flex-col min-h-[400px]"
      >
        <div className="p-3 border-b border-border/50 flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs text-muted-foreground">rrc-terminal — secure session</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="status-dot" />
            <span className="font-mono text-xs text-muted-foreground">CONNECTED</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 font-mono text-sm space-y-1">
          {logs.map((log, i) => (
            <div key={i} className={
              log.type === "system" ? "text-muted-foreground" :
              log.type === "input" ? "text-secondary" :
              "text-glow-green"
            }>
              {log.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleCommand} className="p-3 border-t border-border/50 flex items-center gap-2">
          <span className="font-mono text-sm text-secondary">$</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter command..."
            className="flex-1 bg-transparent border-none font-mono text-sm text-foreground focus-visible:ring-0 h-8 p-0"
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
