import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Building2, CheckCircle2 } from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-destructive" };
  if (score <= 3) return { score, label: "Medium", color: "bg-yellow-500" };
  return { score, label: "Strong", color: "bg-emerald-500" };
};

const CompanySignup: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const strength = getPasswordStrength(form.password);

  usePageTitle(`Join ${companyName || slug}`, `Create an account to join ${companyName || slug} on NextWeb OS.`);

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
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { full_name: form.fullName.trim() },
          emailRedirectTo: window.location.origin,
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      // Assign to this company via RPC
      const { error: rpcError } = await supabase.rpc("handle_company_signup" as any, {
        _user_id: authData.user.id,
        _business_slug: slug,
        _email: form.email.trim(),
        _full_name: form.fullName.trim(),
      });
      if (rpcError) throw rpcError;

      toast.success("Account created! Please check your email to verify.");
      navigate(`/company/${slug}/login`);
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
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
          <Link to="/signup"><Button variant="outline">Go to main signup</Button></Link>
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
                <p className="text-primary-foreground/60 text-sm">Join this company</p>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Create your account to join {companyName}. Once registered, your company admin will activate your access.
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
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden">
            <NWLogo />
            <div className="flex items-center gap-2 mt-4">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">{companyName || "Loading..."}</span>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Create Your Account</h2>
            <p className="text-muted-foreground mt-2">Join {companyName} on NextWeb OS</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
              <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="John Doe" required maxLength={100} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" required maxLength={255} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Mobile Number</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+61 400 000 000" maxLength={20} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" required minLength={8} className="h-11 pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">{[1,2,3,4,5].map((i) => (<div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : "bg-muted"}`} />))}</div>
                  <p className="text-xs text-muted-foreground">{strength.label}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Re-enter password" required className="h-11" />
            </div>

            <Button type="submit" className="w-full h-12 font-semibold text-base shadow-lg" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Creating account...
                </div>
              ) : (
                <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Secure signup</div>
            <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Email verification</div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to={`/company/${slug}/login`} className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanySignup;
