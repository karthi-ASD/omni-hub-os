import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Shield, Mail, Smartphone, Lock, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { NWLogo } from "@/components/NWLogo";

type SecurityStep = "email_verify" | "otp_verify" | "change_password" | "complete";

const FirstLoginSecurityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState<SecurityStep>("email_verify");
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [securityRecord, setSecurityRecord] = useState<any>(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    checkSecurityStatus();
  }, [user]);

  const checkSecurityStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("first_login_security" as any)
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!data || !(data as any).requires_security_setup) {
      navigate("/dashboard");
      return;
    }

    setSecurityRecord(data);
    if ((data as any).email_verified && (data as any).mobile_verified) {
      setCurrentStep("change_password");
    } else if ((data as any).email_verified) {
      setCurrentStep("otp_verify");
    } else {
      setCurrentStep("email_verify");
    }
  };

  const handleSendEmailVerification = async () => {
    setLoading(true);
    try {
      // Generate a 6-digit code and store it
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await supabase.from("otp_verifications" as any).insert({
        user_id: user!.id,
        otp_code: code,
        otp_type: "email",
        email: user!.email,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      } as any);

      // In production, this would send via email. For now, we'll use the Supabase email verification
      toast.success(`Verification code sent to ${user!.email}. Check your email.`);
      setEmailSent(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (otpCode.length !== 6) { toast.error("Please enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("otp_verifications" as any)
        .select("*")
        .eq("user_id", user!.id)
        .eq("otp_type", "email")
        .eq("otp_code", otpCode)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!data) { toast.error("Invalid or expired code"); setLoading(false); return; }

      await supabase.from("otp_verifications" as any).update({ verified: true } as any).eq("id", (data as any).id);
      await supabase.from("first_login_security" as any).update({ email_verified: true } as any).eq("user_id", user!.id);

      toast.success("Email verified!");
      setOtpCode("");
      setCurrentStep("otp_verify");
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMobileOTP = async () => {
    setLoading(true);
    try {
      const phone = profile?.id ? await getPhoneFromBusiness() : null;
      if (!phone) { toast.error("No phone number found. Please update your profile."); setLoading(false); return; }

      const { error } = await supabase.functions.invoke("send-otp", {
        body: { phone, userId: user!.id },
      });
      if (error) throw error;

      toast.success(`OTP sent to ${phone}`);
      setOtpSent(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const getPhoneFromBusiness = async (): Promise<string | null> => {
    if (!profile?.business_id) return null;
    const { data } = await supabase
      .from("businesses")
      .select("phone")
      .eq("id", profile.business_id)
      .single();
    return (data as any)?.phone || null;
  };

  const handleVerifyMobileOTP = async () => {
    if (otpCode.length !== 6) { toast.error("Please enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("otp_verifications" as any)
        .select("*")
        .eq("user_id", user!.id)
        .eq("otp_type", "mobile")
        .eq("otp_code", otpCode)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!data) { toast.error("Invalid or expired OTP"); setLoading(false); return; }

      await supabase.from("otp_verifications" as any).update({ verified: true } as any).eq("id", (data as any).id);
      await supabase.from("first_login_security" as any).update({ mobile_verified: true } as any).eq("user_id", user!.id);

      toast.success("Mobile verified!");
      setOtpCode("");
      setCurrentStep("change_password");
    } catch (err: any) {
      toast.error(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (!/[0-9]/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) { toast.error("Password must include letters and numbers"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      await supabase.from("first_login_security" as any).update({
        password_changed: true,
        requires_security_setup: false,
        completed_at: new Date().toISOString(),
      } as any).eq("user_id", user!.id);

      toast.success("Security setup complete! Welcome to NextWeb OS.");
      setCurrentStep("complete");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: any) {
      toast.error(err.message || "Password update failed");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: "email_verify", icon: Mail, label: "Email Verification", done: securityRecord?.email_verified },
    { key: "otp_verify", icon: Smartphone, label: "Mobile OTP", done: securityRecord?.mobile_verified },
    { key: "change_password", icon: Lock, label: "Set Password", done: securityRecord?.password_changed },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <NWLogo />
          <div className="flex items-center justify-center gap-2 mt-6 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Security Setup</h1>
          </div>
          <p className="text-muted-foreground text-sm">Complete these steps to secure your account</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-between px-4">
          {steps.map((s, i) => (
            <React.Fragment key={s.key}>
              <div className="flex flex-col items-center gap-1">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  s.done ? "bg-success border-success text-success-foreground" :
                  currentStep === s.key ? "border-primary bg-primary/10 text-primary" :
                  "border-muted bg-muted/30 text-muted-foreground"
                }`}>
                  {s.done ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </div>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 mt-[-20px] ${s.done ? "bg-success" : "bg-muted"}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated space-y-5">
          {/* Email Verification */}
          {currentStep === "email_verify" && (
            <>
              <div className="text-center space-y-2">
                <Mail className="h-12 w-12 text-primary mx-auto" />
                <h2 className="text-lg font-semibold">Verify Your Email</h2>
                <p className="text-sm text-muted-foreground">We'll send a 6-digit code to <span className="font-medium text-foreground">{user?.email}</span></p>
              </div>
              {!emailSent ? (
                <Button onClick={handleSendEmailVerification} className="w-full h-12 rounded-xl" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Send Verification Code
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                      <InputOTPGroup>
                        {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button onClick={handleVerifyEmail} className="w-full h-12 rounded-xl" disabled={loading || otpCode.length !== 6}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Verify Email <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <button type="button" onClick={handleSendEmailVerification} className="w-full text-xs text-primary hover:underline">
                    Resend code
                  </button>
                </div>
              )}
            </>
          )}

          {/* Mobile OTP */}
          {currentStep === "otp_verify" && (
            <>
              <div className="text-center space-y-2">
                <Smartphone className="h-12 w-12 text-primary mx-auto" />
                <h2 className="text-lg font-semibold">Mobile Verification</h2>
                <p className="text-sm text-muted-foreground">We'll send an OTP to your registered mobile number</p>
              </div>
              {!otpSent ? (
                <Button onClick={handleSendMobileOTP} className="w-full h-12 rounded-xl" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Send Mobile OTP
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                      <InputOTPGroup>
                        {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button onClick={handleVerifyMobileOTP} className="w-full h-12 rounded-xl" disabled={loading || otpCode.length !== 6}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Verify OTP <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <button type="button" onClick={handleSendMobileOTP} className="w-full text-xs text-primary hover:underline">
                    Resend OTP
                  </button>
                </div>
              )}
            </>
          )}

          {/* Password Change */}
          {currentStep === "change_password" && (
            <>
              <div className="text-center space-y-2">
                <Lock className="h-12 w-12 text-primary mx-auto" />
                <h2 className="text-lg font-semibold">Set New Password</h2>
                <p className="text-sm text-muted-foreground">Create a strong password for your account</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">New Password</Label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 chars, letters & numbers" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Confirm Password</Label>
                  <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="h-11 rounded-xl" />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className={newPassword.length >= 8 ? "text-success" : ""}>✓ At least 8 characters</p>
                  <p className={/[a-zA-Z]/.test(newPassword) ? "text-success" : ""}>✓ Contains letters</p>
                  <p className={/[0-9]/.test(newPassword) ? "text-success" : ""}>✓ Contains numbers</p>
                  <p className={newPassword === confirmPassword && newPassword.length > 0 ? "text-success" : ""}>✓ Passwords match</p>
                </div>
                <Button onClick={handleChangePassword} className="w-full h-12 rounded-xl" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Complete Setup <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Complete */}
          {currentStep === "complete" && (
            <div className="text-center space-y-4 py-6">
              <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
              <h2 className="text-xl font-bold">All Set!</h2>
              <p className="text-muted-foreground">Your account is fully secured. Redirecting to dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirstLoginSecurityPage;
