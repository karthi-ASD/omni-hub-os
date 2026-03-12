import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Building2 } from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  isAuthConfigError,
  isAuthTimeoutError,
  signInWithPasswordResilient,
} from "@/lib/auth-signin";

const CompanyLogin: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  usePageTitle(`Sign In — ${companyName || slug}`, `Sign in to ${companyName || slug} portal on NextWeb OS.`);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("businesses")
      .select("name, slug, status")
      .eq("slug", slug)
      .eq("status", "active")
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setCompanyName(data.name);
      });
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signInWithPasswordResilient(form.email, form.password);
      if (result.error) throw result.error;
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      if (isAuthConfigError(err)) {
        toast.error("Auth client config is missing. Check URL and anon key env variables.");
      } else if (isAuthTimeoutError(err)) {
        toast.error("Sign-in timed out. Please try again.");
      } else {
        toast.error(err.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-center space-y-4">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Company Not Found</h1>
          <p className="text-muted-foreground">The company portal "{slug}" does not exist or is inactive.</p>
          <Link to="/login"><Button variant="outline">Go to main login</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary" />
        <div className="absolute top-20 left-10 h-72 w-72 bg-primary-foreground/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 bg-primary-foreground/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <NWLogo size="lg" />
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 flex items-center justify-center">
                <Building2 className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-primary-foreground">{companyName || "Loading..."}</h2>
                <p className="text-primary-foreground/60 text-sm">Company Portal</p>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Sign in to access your company workspace. Manage projects, tasks, and collaborate with your team.
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs text-primary-foreground/40">
            <span>Powered by NextWeb OS</span>
            <Link to="/privacy" className="hover:text-primary-foreground/70 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary-foreground/70 transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden">
            <NWLogo />
            <div className="flex items-center gap-2 mt-4">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">{companyName || "Loading..."}</span>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Sign In</h2>
            <p className="text-muted-foreground mt-2">Enter your credentials to access {companyName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" required className="h-12" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" required className="h-12 pr-12" />
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

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to={`/company/${slug}/signup`} className="text-primary hover:underline font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanyLogin;
