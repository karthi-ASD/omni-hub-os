import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, UserPlus } from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";

const ClientRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  usePageTitle("Client Portal — Register", "Register for your NextWeb client portal.");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("client-self-register", {
        body: {
          email: form.email.trim().toLowerCase(),
          password: form.password,
          full_name: form.full_name.trim(),
          company_name: form.company_name.trim() || form.full_name.trim(),
          phone: form.phone.trim(),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.linked_existing) {
        toast.success("Account linked to your existing client record. Welcome back!");
      } else {
        toast.success("Registration successful! You can now sign in.");
      }

      navigate("/client/login");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
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
                <UserPlus className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-primary-foreground">Client Portal</h2>
                <p className="text-primary-foreground/60 text-sm">Register your account</p>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Create your portal account to access projects, reports, and support. If your company already exists in our system, your account will be automatically linked.
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
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden">
            <NWLogo />
            <div className="flex items-center gap-2 mt-4">
              <UserPlus className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">Client Registration</span>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Create Your Account</h2>
            <p className="text-muted-foreground mt-2">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input id="full_name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="John Smith" required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input id="company_name" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="Acme Pty Ltd" className="h-11" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" required className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+61 400 000 000" className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" required className="h-11 pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm Password *</Label>
              <Input id="confirm_password" type="password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} placeholder="Re-enter your password" required className="h-11" />
            </div>

            <Button type="submit" className="w-full h-12 font-semibold text-base shadow-lg" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Creating account...
                </div>
              ) : (
                <>Register <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/client/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientRegisterPage;
