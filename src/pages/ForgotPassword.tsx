import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Mail, Shield } from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";

const ForgotPassword = () => {
  usePageTitle("Forgot Password", "Reset your NextWeb OS account password securely.");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Reset link sent to your email");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      <div className="absolute top-20 left-1/4 h-96 w-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 h-72 w-72 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md space-y-8 relative z-10 animate-fade-in">
        <NWLogo size="lg" />

        {sent ? (
          <div className="space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-bold">Check Your Email</h2>
              <p className="text-muted-foreground mt-3">We sent a password reset link to <span className="text-primary font-medium">{email}</span>.</p>
            </div>
            <Link to="/login">
              <Button variant="outline" className="w-full h-12 rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div>
              <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-3xl font-bold">Reset Password</h2>
              <p className="text-muted-foreground mt-2">Enter your email and we'll send you a secure reset link</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email Address</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@acmecorp.com" required maxLength={255} className="h-12 rounded-xl" />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-semibold shadow-glow" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            <Link to="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
