import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Building2, Shield, Zap, Globe, ArrowRight, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("system_events").insert({
          event_type: "LOGIN",
          payload_json: { email: form.email.trim() },
        });
      }

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
      {/* Left panel - Premium branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#111832] to-[#0a0e1a]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMTIsMTY4LDgzLDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-60" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 h-72 w-72 bg-[#d4a853]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 bg-[#2563eb]/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#d4a853] to-[#b8902e] flex items-center justify-center shadow-lg shadow-[#d4a853]/20">
              <Building2 className="h-6 w-6 text-[#0a0e1a]" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">
              NextWeb OS
            </span>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Welcome Back to Your{" "}
              <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">
                Command Center
              </span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-10">
              Access your complete business operating system. Manage clients, close deals, and scale your operations — all from one powerful dashboard.
            </p>
            
            <div className="space-y-4">
              {[
                { icon: Shield, label: "Enterprise-grade security & encryption" },
                { icon: Zap, label: "AI-powered insights & automation" },
                { icon: Globe, label: "100+ integrated business modules" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[#d4a853]/10 border border-[#d4a853]/20 flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-[#d4a853]" />
                  </div>
                  <span className="text-gray-300 text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-600">
            <span>© {new Date().getFullYear()} NextWeb OS</span>
            <a href="#" className="hover:text-[#d4a853] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#d4a853] transition-colors">Terms</a>
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#0a0e1a] lg:bg-[#080b16]">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#d4a853] to-[#b8902e] flex items-center justify-center">
              <Building2 className="h-5 w-5 text-[#0a0e1a]" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">
              NextWeb OS
            </span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-white">Sign In</h2>
            <p className="text-gray-500 mt-2">Enter your credentials to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@acmecorp.com"
                required
                maxLength={255}
                className="h-12 bg-[#111832] border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853] focus:ring-[#d4a853]/20"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password" className="text-gray-300 text-sm font-medium">Password</Label>
                <Link to="/forgot-password" className="text-xs text-[#d4a853] hover:text-[#f0d48a] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                  className="h-12 bg-[#111832] border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853] focus:ring-[#d4a853]/20 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#d4a853] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold text-base hover:from-[#e0b85e] hover:to-[#c99d3a] shadow-lg shadow-[#d4a853]/20 transition-all"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0e1a] border-t-transparent" />
                  Signing in...
                </div>
              ) : (
                <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1e2a4a]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0a0e1a] lg:bg-[#080b16] px-3 text-xs text-gray-600">
                  or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 bg-[#111832] border-[#1e2a4a] text-gray-300 hover:bg-[#1e2a4a] hover:text-white hover:border-[#d4a853]/30 transition-all"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const result = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (result?.error) {
                    toast.error(result.error.message || "Google sign-in failed");
                  } else if (!result?.redirected) {
                    navigate("/dashboard");
                  }
                } catch (err: any) {
                  toast.error(err.message || "Google sign-in failed");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign in with Google
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#d4a853] hover:text-[#f0d48a] font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
