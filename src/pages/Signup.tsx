import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle2, ArrowRight, Users, TrendingUp, Sparkles } from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";

const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 3) return { score, label: "Medium", color: "bg-[#d4a853]" };
  return { score, label: "Strong", color: "bg-emerald-500" };
};

const Signup = () => {
  usePageTitle("Create Account", "Sign up for NextWeb OS — the all-in-one business operating system. Free 14-day trial, no credit card required.");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ businessName: "", fullName: "", email: "", password: "" });
  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(), password: form.password,
        options: { data: { full_name: form.fullName.trim() }, emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");
      const { error: rpcError } = await supabase.rpc("handle_signup", {
        _user_id: authData.user.id, _business_name: form.businessName.trim(), _email: form.email.trim(),
      });
      if (rpcError) throw rpcError;
      toast.success("Account created! Please check your email to verify.");
      navigate("/login");
    } catch (err: any) { toast.error(err.message || "Signup failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#111832] to-[#0a0e1a]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMTIsMTY4LDgzLDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-60" />
        <div className="absolute top-20 right-10 h-72 w-72 bg-[#2563eb]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 h-96 w-96 bg-[#d4a853]/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <NWLogo size="lg" />

          <div className="max-w-md">
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Launch Your Business{" "}
              <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Operating System</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-10">Join 500+ agencies already running their entire operations on NextWeb OS. Get started in under 2 minutes.</p>
            <div className="space-y-5">
              {[
                { icon: Sparkles, value: "14-day", label: "Free trial, no credit card" },
                { icon: Users, value: "500+", label: "Agencies trust us worldwide" },
                { icon: TrendingUp, value: "40%", label: "Avg. increase in conversion rate" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#d4a853]/10 to-[#d4a853]/5 border border-[#d4a853]/20 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-[#d4a853]" />
                  </div>
                  <div><span className="text-white font-bold text-lg">{stat.value}</span><span className="text-gray-400 text-sm ml-2">{stat.label}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-600">
            <span>© {new Date().getFullYear()} Nextweb Pty Ltd</span>
            <Link to="/privacy" className="hover:text-[#d4a853] transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-[#d4a853] transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-[#0a0e1a] lg:bg-[#080b16]">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden"><NWLogo /></div>
          <div>
            <h2 className="text-3xl font-bold text-white">Create Your Account</h2>
            <p className="text-gray-500 mt-2">Set up your business and start your free trial</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-gray-300 text-sm">Business Name</Label>
              <Input id="businessName" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Acme Corp" required maxLength={100} className="h-11 bg-[#111832] border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853] focus:ring-[#d4a853]/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-300 text-sm">Full Name</Label>
              <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="John Doe" required maxLength={100} className="h-11 bg-[#111832] border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853] focus:ring-[#d4a853]/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@acmecorp.com" required maxLength={255} className="h-11 bg-[#111832] border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853] focus:ring-[#d4a853]/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 text-sm">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" required minLength={8} maxLength={128} className="h-11 bg-[#111832] border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853] focus:ring-[#d4a853]/20 pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#d4a853] transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">{[1,2,3,4,5].map((i) => (<div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : "bg-[#1e2a4a]"}`} />))}</div>
                  <p className="text-xs text-gray-500">{strength.label}</p>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full h-12 bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold text-base hover:from-[#e0b85e] hover:to-[#c99d3a] shadow-lg shadow-[#d4a853]/20" disabled={loading}>
              {loading ? (<div className="flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0e1a] border-t-transparent" />Creating account...</div>) : (<>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>)}
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#1e2a4a]" /></div>
              <div className="relative flex justify-center"><span className="bg-[#0a0e1a] lg:bg-[#080b16] px-3 text-xs text-gray-600">or continue with</span></div>
            </div>

            <Button type="button" variant="outline" className="w-full h-11 bg-[#111832] border-[#1e2a4a] text-gray-300 hover:bg-[#1e2a4a] hover:text-white hover:border-[#d4a853]/30" disabled={loading} onClick={async () => { const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin }); if (error) toast.error(error.message || "Google sign-up failed"); }}>
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign up with Google
            </Button>
          </form>

          <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> No credit card</div>
            <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> 14-day trial</div>
          </div>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-[#d4a853] hover:text-[#f0d48a] font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
