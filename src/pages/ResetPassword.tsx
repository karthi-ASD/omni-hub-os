import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, ArrowRight } from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";

const ResetPassword = () => {
  usePageTitle("Set New Password", "Choose a new secure password for your NextWeb OS account.");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) { setReady(true); } else {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") setReady(true);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated! You can now sign in.");
      navigate("/login");
    } catch (err: any) { toast.error(err.message || "Failed to update password"); }
    finally { setLoading(false); }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4a853] border-t-transparent mx-auto" />
          <p className="text-gray-500">Verifying reset token...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-[#0a0e1a] relative overflow-hidden">
      <div className="absolute top-20 right-1/4 h-96 w-96 bg-[#2563eb]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-1/4 h-72 w-72 bg-[#d4a853]/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <NWLogo size="lg" />

        <div>
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#d4a853]/20 to-[#d4a853]/5 border border-[#d4a853]/20 flex items-center justify-center mb-6">
            <Lock className="h-7 w-7 text-[#d4a853]" />
          </div>
          <h2 className="text-3xl font-bold text-white">Set New Password</h2>
          <p className="text-gray-500 mt-2">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300 text-sm">New Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8} maxLength={128} className="h-12 bg-[#111832] border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853] focus:ring-[#d4a853]/20 pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#d4a853] transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full h-12 bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold hover:from-[#e0b85e] hover:to-[#c99d3a] shadow-lg shadow-[#d4a853]/20" disabled={loading}>
            {loading ? "Updating..." : <>Update Password <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
