import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Shield, Building2 } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

const ACE1_SLUG = "ace1";

const ACE1EmployeeLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [companyName, setCompanyName] = useState<string>("ACE1");

  usePageTitle("ACE1 — Employee Login", "Sign in to ACE1 Command Centre.");

  useEffect(() => {
    supabase
      .from("businesses")
      .select("name")
      .eq("slug", ACE1_SLUG)
      .eq("status", "active")
      .single()
      .then(({ data }) => {
        if (data?.name) setCompanyName(data.name);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (error) throw error;
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — Dark Gold branded panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#1a1510]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1510] via-[#2a1f12] to-[#1a1510]" />
        <div className="absolute top-20 left-10 h-72 w-72 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 bg-amber-600/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* ACE1 Logo area */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
            <span className="text-lg font-bold text-amber-100 tracking-wide">{companyName}</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-amber-50 mb-3">Command Centre</h2>
            <p className="text-amber-200/60 text-lg leading-relaxed">
              Employee access to the ACE1 Investment Advisory platform. Manage leads, deals, investors, and your property portfolio.
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              {["Lead Engine", "Deal Pipeline", "Investor CRM", "Property Inventory", "HR & Team"].map(f => (
                <span key={f} className="px-3 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-amber-200/30">
            <span>Powered by NextWeb OS</span>
            <Link to="/privacy" className="hover:text-amber-200/60 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-amber-200/60 transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Shield className="h-4.5 w-4.5 text-amber-500" />
            </div>
            <span className="font-bold text-lg">{companyName}</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Employee Sign In</h2>
            <p className="text-muted-foreground mt-2">Access {companyName} Command Centre</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@ace1.com" required className="h-12" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" required className="h-12 pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 font-semibold text-base shadow-lg" disabled={loading}>
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

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Are you a client?{" "}
              <Link to="/ace1/portal" className="text-primary font-medium hover:underline">Go to Client Portal →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ACE1EmployeeLoginPage;
