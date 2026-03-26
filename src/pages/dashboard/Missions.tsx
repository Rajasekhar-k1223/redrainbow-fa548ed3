import { motion } from "framer-motion";
import { Layers, Play, Pause, CheckCircle, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const missions = [
  { id: "M-047", name: "Purple Drill Alpha", type: "Purple", status: "Active", progress: 72, team: "Red + Blue", started: "2h ago" },
  { id: "M-046", name: "Perimeter Recon", type: "Red", status: "Active", progress: 45, team: "Red Team", started: "4h ago" },
  { id: "M-045", name: "IR Response Drill", type: "Blue", status: "Completed", progress: 100, team: "Blue Team", started: "1d ago" },
  { id: "M-044", name: "Malware Sandbox Test", type: "Red", status: "Paused", progress: 30, team: "Red Team", started: "2d ago" },
  { id: "M-043", name: "Network Isolation Audit", type: "Blue", status: "Completed", progress: 100, team: "Blue Team", started: "3d ago" },
];

const typeColors: Record<string, string> = {
  Red: "bg-primary/20 text-primary border-primary/30",
  Blue: "bg-secondary/20 text-secondary border-secondary/30",
  Purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  Active: <Play className="h-3 w-3" />,
  Paused: <Pause className="h-3 w-3" />,
  Completed: <CheckCircle className="h-3 w-3" />,
};

const Missions = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mission Orchestration</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">Design, launch, and monitor security drills</p>
        </div>
        <Button className="font-mono bg-primary hover:bg-primary/90 text-primary-foreground glow-red text-sm">
          <Layers className="h-4 w-4 mr-2" /> New Mission
        </Button>
      </div>

      <div className="space-y-3">
        {missions.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-5 rounded-lg border border-border/50 bg-card/50 hover:border-primary/20 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-xs text-muted-foreground">{m.id}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono border ${typeColors[m.type]}`}>
                    {m.type}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                    {statusIcons[m.status]} {m.status}
                  </span>
                </div>
                <h3 className="text-foreground font-semibold">{m.name}</h3>
                <div className="flex items-center gap-4 mt-2 font-mono text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {m.team}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {m.started}</span>
                </div>
              </div>
              <div className="w-full sm:w-40">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-muted-foreground">Progress</span>
                  <span className="font-mono text-xs text-foreground">{m.progress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${m.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Missions;
