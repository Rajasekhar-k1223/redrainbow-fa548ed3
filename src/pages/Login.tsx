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
    <div className="min-h-screen bg-background bg-grid bg-scanline flex items-center justify-center relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md mx-4"
      >
        <div className="p-8 rounded-lg border border-border/50 bg-card/80 backdrop-blur-xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <Shield className="h-8 w-8 text-primary" />
              <span className="font-mono font-bold text-xl tracking-wider text-foreground">
                RRC<span className="text-primary">Layer</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-foreground mb-1">Authenticate</h1>
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
                placeholder="operator@redrain.sec"
                className="bg-background/50 border-border font-mono text-sm h-12 focus:border-primary/50 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Passphrase
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
              Initialize Session <ChevronRight className="ml-2 h-4 w-4" />
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
