// src/pages/Register.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, getDashboardPath } from "@/lib/auth";
import { toast } from "sonner";

const Register = () => {
  const [role, setRole] = useState<"student" | "owner">("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password, role);
      toast.success(`Welcome to PGLens, ${name.trim()}!`);
      navigate(getDashboardPath(role));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm"
        >
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">P</div>
          </div>
          <h1 className="mt-4 text-center text-2xl font-extrabold text-foreground">Create Your Account</h1>
          <p className="text-center text-sm text-muted-foreground">Join PGLens for transparent PG discovery</p>

          <div className="mt-6 space-y-1">
            <span className="text-sm text-muted-foreground">I am a:</span>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "student" as const, label: "Student / Professional", sub: "Looking for a PG", icon: GraduationCap },
                { key: "owner" as const, label: "PG Owner", sub: "List your property", icon: Building2 },
              ].map((r) => (
                <motion.button
                  key={r.key}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRole(r.key)}
                  type="button"
                  className={`rounded-xl border-2 p-4 text-center transition-all ${
                    role === r.key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <r.icon className={`mx-auto h-6 w-6 ${role === r.key ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="mt-2 text-sm font-medium text-foreground">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.sub}</p>
                </motion.button>
              ))}
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-foreground">Full Name</Label>
                <Input
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-border rounded-xl"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground">Email Address</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-border rounded-xl"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">{role === "owner" ? "Business Name" : "Institution / Company"}</Label>
              <Input
                placeholder={role === "owner" ? "Your PG Business" : "ABC University"}
                className="border-border rounded-xl"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-foreground">Password</Label>
                <Input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-border rounded-xl"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="border-border rounded-xl"
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;