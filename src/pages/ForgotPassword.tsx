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
    <div className="flex min-h-screen items-center justify-center p-6 bg-[#0a0e1a] relative overflow-hidden">
      <div className="absolute top-20 left-1/4 h-96 w-96 bg-[#d4a853]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 h-72 w-72 bg-[#2563eb]/5 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        <NWLogo size="lg" />

        {sent ? (
          <div className="space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#d4a853]/20 to-[#d4a853]/5 border border-[#d4a853]/20 flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-[#d4a853]" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">Check Your Email</h2>
              <p className="text-gray-400 mt-3">We sent a password reset link to <span className="text-[#d4a853] font-medium">{email}</span>.</p>
            </div>
            <Link to="/login">
              <Button variant="outline" className="w-full h-12 bg-[#111832] border-[#1e2a4a] text-gray-300 hover:bg-[#1e2a4a] hover:text-white hover:border-[#d4a853]/30">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#d4a853]/20 to-[#d4a853]/5 border border-[#d4a853]/20 flex items-center justify-center mb-6">
                <Shield className="h-7 w-7 text-[#d4a853]" />
              </div>
              <h2 className="text-3xl font-bold text-white">Reset Password</h2>
              <p className="text-gray-500 mt-2">Enter your email and we'll send you a secure reset link</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 text-sm">Email Address</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@acmecorp.com" required maxLength={255} className="h-12 bg-[#111832] border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853] focus:ring-[#d4a853]/20" />
              </div>
              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold hover:from-[#e0b85e] hover:to-[#c99d3a] shadow-lg shadow-[#d4a853]/20" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            <Link to="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#d4a853] transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
