import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just navigate to dashboard
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--glow-cyan))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--glow-cyan))" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="400" cy="400" r="380" fill="url(#glow)" />
        {[120, 200, 280, 360].map((r) => (
          <circle key={r} cx="400" cy="400" r={r} fill="none" stroke="hsl(var(--glow-cyan))" strokeOpacity="0.15" strokeWidth="1">
            <animate attributeName="r" from={r} to={r + 30} dur="4s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" from="0.3" to="0" dur="4s" repeatCount="indefinite" />
          </circle>
        ))}
        {[[200, 200], [600, 250], [300, 600], [650, 580], [150, 450], [500, 150], [720, 400]].map(([x, y], i) => (
          <g key={i}>
            <line x1="400" y1="400" x2={x} y2={y} stroke="hsl(var(--glow-cyan))" strokeOpacity="0.2" strokeWidth="1" />
            <circle cx={x} cy={y} r="3" fill="hsl(var(--glow-cyan))">
              <animate attributeName="r" values="3;6;3" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
        <circle cx="400" cy="400" r="5" fill="hsl(var(--primary))" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md mx-4"
      >
        <div className="p-8 rounded-lg border border-border/50 bg-card/70 backdrop-blur-2xl shadow-2xl">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <Shield className="h-8 w-8 text-primary" />
              <span className="font-mono font-bold text-xl tracking-wider text-foreground">
                Red<span className="text-primary">Rainbow</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-foreground mb-1">Biometric Authentication</h1>
            <p className="font-mono text-xs text-muted-foreground tracking-wider">SECURE ACCESS REQUIRED</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Operator ID
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@redrainbow.sec"
                className="bg-background/50 border-border font-mono text-sm h-12 focus:border-primary/50 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Encryption Key
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="bg-background/50 border-border font-mono text-sm h-12 pr-12 focus:border-primary/50 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full font-mono bg-primary hover:bg-primary/90 text-primary-foreground h-12 glow-red"
            >
              Terminal Authenticate <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-mono text-xs text-muted-foreground">
              No credentials? <Link to="/" className="text-secondary hover:underline">Request access</Link>
            </p>
          </div>

          {/* Status bar */}
          <div className="mt-8 pt-4 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="status-dot" />
              <span className="font-mono text-xs text-muted-foreground">TLS 1.3</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">v3.2.1-rc</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
