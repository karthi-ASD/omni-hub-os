import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Users } from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";

const ClientLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  usePageTitle("Client Portal — Sign In", "Sign in to your NextWeb client portal.");

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
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary" />
        <div className="absolute top-20 left-10 h-72 w-72 bg-primary-foreground/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 bg-primary-foreground/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <NWLogo size="lg" />
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 flex items-center justify-center">
                <Users className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-primary-foreground">Client Portal</h2>
                <p className="text-primary-foreground/60 text-sm">Powered by NextWeb OS</p>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Access your projects, tasks, reports, and support tickets. Stay updated on all your services in one place.
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs text-primary-foreground/40">
            <span>Powered by NextWeb OS</span>
            <Link to="/privacy" className="hover:text-primary-foreground/70 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary-foreground/70 transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden">
            <NWLogo />
            <div className="flex items-center gap-2 mt-4">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">Client Portal</span>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Client Sign In</h2>
            <p className="text-muted-foreground mt-2">Enter your credentials to access your portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" required className="h-12" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" required className="h-12 pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
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
        </div>
      </div>
    </div>
  );
};

export default ClientLoginPage;
