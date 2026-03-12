import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Shield, Zap, Globe, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";

const LoginV2: React.FC = () => {
  usePageTitle("Sign In", "Sign in to your NextWeb OS dashboard.");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDebugInfo(null);

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      toast.error("Please enter both email and password.");
      setLoading(false);
      return;
    }

    // Log diagnostics
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
    console.log("[LoginV2] Supabase URL present:", !!url);
    console.log("[LoginV2] Supabase Key present:", !!key);
    console.log("[LoginV2] Attempting signInWithPassword for:", email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[LoginV2] Auth error:", error.message, error.status);
        setDebugInfo(`Error: ${error.message} (status: ${error.status})`);
        toast.error(error.message || "Login failed");
        setLoading(false);
        return;
      }

      if (data?.session) {
        console.log("[LoginV2] Login successful, session obtained.");
        setDebugInfo("✅ Login successful! Redirecting...");
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        console.warn("[LoginV2] No session returned after login.");
        setDebugInfo("Warning: No session returned.");
        toast.error("Login succeeded but no session was created.");
      }
    } catch (err: any) {
      console.error("[LoginV2] Unexpected error:", err);
      setDebugInfo(`Unexpected: ${err.message}`);
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branded */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary" />
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="absolute top-20 left-10 h-72 w-72 bg-primary-foreground/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 h-96 w-96 bg-primary-foreground/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <NWLogo size="lg" />
          <div className="max-w-md">
            <h2 className="text-4xl font-bold text-primary-foreground mb-4 leading-tight">
              Welcome Back to Your <span className="text-primary-foreground/90">Command Center</span>
            </h2>
            <p className="text-primary-foreground/70 text-lg leading-relaxed mb-10">
              Access your complete business operating system. Manage clients, close deals, and scale your operations.
            </p>
            <div className="space-y-4">
              {[
                { icon: Shield, label: "Enterprise-grade security & encryption" },
                { icon: Zap, label: "AI-powered insights & automation" },
                { icon: Globe, label: "100+ integrated business modules" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-primary-foreground/80 text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs text-primary-foreground/40">
            <span>© {new Date().getFullYear()} Nextweb Pty Ltd</span>
            <Link to="/privacy" className="hover:text-primary-foreground/70 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary-foreground/70 transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="lg:hidden"><NWLogo /></div>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Sign In</h2>
            <p className="text-muted-foreground mt-2">Enter your credentials to access your dashboard</p>
            <p className="text-xs text-muted-foreground/60 mt-1">v2 — Direct Supabase Auth</p>
          </div>

          {debugInfo && (
            <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
              debugInfo.startsWith("✅") 
                ? "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400" 
                : "border-destructive/30 bg-destructive/5 text-destructive"
            }`}>
              {debugInfo.startsWith("✅") ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
              <span>{debugInfo}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email-v2" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email-v2"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@acmecorp.com"
                required
                maxLength={255}
                className="h-12 rounded-xl"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password-v2" className="text-sm font-medium">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input
                  id="password-v2"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                  className="h-12 pr-12 rounded-xl"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 font-semibold text-base rounded-xl shadow-glow" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Signing in...
                </div>
              ) : (
                <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium transition-colors">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginV2;
