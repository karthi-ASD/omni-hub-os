import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2, UserPlus, ShieldCheck, Phone, Zap, Link2,
  Play, Send, Ban, CheckCircle, KeyRound, RefreshCw,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
const ROLES: AppRole[] = ["super_admin", "business_admin", "hr_manager", "manager", "employee", "client"];

const SuperAdminToolsPage = () => {
  const { profile } = useAuth();

  // Business creation
  const [bizOpen, setBizOpen] = useState(false);
  const [bizForm, setBizForm] = useState({ name: "", owner_name: "", email: "", industry: "", country: "Australia", timezone: "Australia/Sydney" });
  const [bizLoading, setBizLoading] = useState(false);

  // User creation
  const [userOpen, setUserOpen] = useState(false);
  const [userForm, setUserForm] = useState({ email: "", full_name: "", password: "", role: "employee" as AppRole, business_id: "" });
  const [userLoading, setUserLoading] = useState(false);

  // Role assign
  const [roleOpen, setRoleOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({ user_email: "", role: "employee" as AppRole });
  const [roleLoading, setRoleLoading] = useState(false);

  // OTP/SMS
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsForm, setSmsForm] = useState({ phone: "", message: "" });
  const [smsLoading, setSmsLoading] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpForm, setOtpForm] = useState({ phone: "" });
  const [otpLoading, setOtpLoading] = useState(false);

  // Automation runners
  const [runningFn, setRunningFn] = useState<string | null>(null);

  const createBusiness = async () => {
    if (!bizForm.name || !bizForm.email) return;
    setBizLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-business-account", {
        body: {
          business_name: bizForm.name,
          owner_name: bizForm.owner_name,
          owner_email: bizForm.email,
          industry: bizForm.industry,
          country: bizForm.country,
        },
      });
      if (error) throw error;
      toast.success("Business created successfully");
      setBizOpen(false);
      setBizForm({ name: "", owner_name: "", email: "", industry: "", country: "Australia", timezone: "Australia/Sydney" });
    } catch (e: any) {
      toast.error(e.message || "Failed to create business");
    }
    setBizLoading(false);
  };

  const createUser = async () => {
    if (!userForm.email || !userForm.full_name || !userForm.password) return;
    setUserLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-business-account", {
        body: {
          business_name: "__user_only__",
          owner_name: userForm.full_name,
          owner_email: userForm.email,
          temp_password: userForm.password,
          assign_role: userForm.role,
          business_id: userForm.business_id || undefined,
        },
      });
      if (error) throw error;
      toast.success("User created & credentials sent");
      setUserOpen(false);
      setUserForm({ email: "", full_name: "", password: "", role: "employee", business_id: "" });
    } catch (e: any) {
      toast.error(e.message || "Failed to create user");
    }
    setUserLoading(false);
  };

  const assignRole = async () => {
    if (!roleForm.user_email) return;
    setRoleLoading(true);
    try {
      const { data: prof } = await supabase.from("profiles").select("user_id").eq("email", roleForm.user_email).single();
      if (!prof) throw new Error("User not found");
      await supabase.from("user_roles").upsert({ user_id: prof.user_id, role: roleForm.role } as any, { onConflict: "user_id,role" });
      toast.success(`Role ${roleForm.role} assigned`);
      setRoleOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to assign role");
    }
    setRoleLoading(false);
  };

  const sendSms = async () => {
    if (!smsForm.phone || !smsForm.message) return;
    setSmsLoading(true);
    try {
      await supabase.functions.invoke("send-sms", { body: { to: smsForm.phone, message: smsForm.message } });
      toast.success("SMS sent");
      setSmsOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to send SMS");
    }
    setSmsLoading(false);
  };

  const sendOtp = async () => {
    if (!otpForm.phone) return;
    setOtpLoading(true);
    try {
      await supabase.functions.invoke("send-otp", { body: { phone: otpForm.phone, userId: profile?.user_id } });
      toast.success("OTP sent");
      setOtpOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to send OTP");
    }
    setOtpLoading(false);
  };

  const runEdgeFunction = async (fnName: string) => {
    setRunningFn(fnName);
    try {
      await supabase.functions.invoke(fnName, { body: { triggered_by: "super_admin", business_id: profile?.business_id } });
      toast.success(`${fnName} executed`);
    } catch (e: any) {
      toast.error(`${fnName}: ${e.message || "Failed"}`);
    }
    setRunningFn(null);
  };

  const automationTools = [
    { name: "process-voice-agent-queue", label: "Voice Agent Queue", icon: Phone },
    { name: "seo-automations", label: "SEO Automation", icon: RefreshCw },
    { name: "process-reminders", label: "Reminder Processor", icon: Zap },
    { name: "check-domain-expiry", label: "Domain Expiry Scan", icon: ShieldCheck },
    { name: "check-hosting-alerts", label: "Hosting Alerts", icon: ShieldCheck },
  ];

  const integrationTools = [
    { name: "xero-sync", label: "Xero Sync", icon: Link2 },
    { name: "ads-sync", label: "Ads Sync", icon: Link2 },
    { name: "ai-report-generator", label: "AI Report Generator", icon: Zap },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Super Admin Tools" description="System management, user operations, and automation controls." />

      {/* Business Management */}
      <Card className="rounded-2xl shadow-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Business Management</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Dialog open={bizOpen} onOpenChange={setBizOpen}>
            <DialogTrigger asChild><Button><Building2 className="h-4 w-4 mr-1" /> Create Business</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Business Account</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Business Name *</Label><Input value={bizForm.name} onChange={e => setBizForm({ ...bizForm, name: e.target.value })} /></div>
                <div><Label>Owner Name</Label><Input value={bizForm.owner_name} onChange={e => setBizForm({ ...bizForm, owner_name: e.target.value })} /></div>
                <div><Label>Owner Email *</Label><Input type="email" value={bizForm.email} onChange={e => setBizForm({ ...bizForm, email: e.target.value })} /></div>
                <div><Label>Industry</Label><Input value={bizForm.industry} onChange={e => setBizForm({ ...bizForm, industry: e.target.value })} /></div>
                <div><Label>Country</Label><Input value={bizForm.country} onChange={e => setBizForm({ ...bizForm, country: e.target.value })} /></div>
                <Button className="w-full" onClick={createBusiness} disabled={bizLoading}>{bizLoading ? "Creating..." : "Create Business"}</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => toast.info("Navigate to /businesses to edit")}><Building2 className="h-4 w-4 mr-1" /> Edit Business</Button>
          <Button variant="outline" className="text-destructive" onClick={() => toast.info("Use /businesses to suspend")}><Ban className="h-4 w-4 mr-1" /> Suspend Business</Button>
          <Button variant="outline" onClick={() => toast.info("Use /businesses to activate")}><CheckCircle className="h-4 w-4 mr-1" /> Activate Business</Button>
        </CardContent>
      </Card>

      {/* User & Role Management */}
      <Card className="rounded-2xl shadow-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" /> User & Role Management</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Dialog open={userOpen} onOpenChange={setUserOpen}>
            <DialogTrigger asChild><Button><UserPlus className="h-4 w-4 mr-1" /> Create User</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Full Name *</Label><Input value={userForm.full_name} onChange={e => setUserForm({ ...userForm, full_name: e.target.value })} /></div>
                <div><Label>Email *</Label><Input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} /></div>
                <div><Label>Temporary Password *</Label><Input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} /></div>
                <div><Label>Role</Label>
                  <Select value={userForm.role} onValueChange={v => setUserForm({ ...userForm, role: v as AppRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Business ID (optional)</Label><Input value={userForm.business_id} onChange={e => setUserForm({ ...userForm, business_id: e.target.value })} placeholder="UUID" /></div>
                <Button className="w-full" onClick={createUser} disabled={userLoading}>{userLoading ? "Creating..." : "Create User"}</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
            <DialogTrigger asChild><Button variant="outline"><ShieldCheck className="h-4 w-4 mr-1" /> Assign Role</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Assign Role</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>User Email *</Label><Input value={roleForm.user_email} onChange={e => setRoleForm({ ...roleForm, user_email: e.target.value })} /></div>
                <div><Label>Role</Label>
                  <Select value={roleForm.role} onValueChange={v => setRoleForm({ ...roleForm, role: v as AppRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={assignRole} disabled={roleLoading}>{roleLoading ? "Assigning..." : "Assign Role"}</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => toast.info("Use Auth reset via /users page")}><KeyRound className="h-4 w-4 mr-1" /> Reset Password</Button>
          <Button variant="outline" className="text-destructive"><Ban className="h-4 w-4 mr-1" /> Suspend User</Button>
          <Button variant="outline"><CheckCircle className="h-4 w-4 mr-1" /> Activate User</Button>
        </CardContent>
      </Card>

      {/* OTP & SMS */}
      <Card className="rounded-2xl shadow-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary" /> OTP & SMS Tools</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Dialog open={otpOpen} onOpenChange={setOtpOpen}>
            <DialogTrigger asChild><Button><Send className="h-4 w-4 mr-1" /> Send OTP</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Send OTP</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Phone Number *</Label><Input value={otpForm.phone} onChange={e => setOtpForm({ phone: e.target.value })} placeholder="+61..." /></div>
                <Button className="w-full" onClick={sendOtp} disabled={otpLoading}>{otpLoading ? "Sending..." : "Send OTP"}</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={smsOpen} onOpenChange={setSmsOpen}>
            <DialogTrigger asChild><Button variant="outline"><Send className="h-4 w-4 mr-1" /> Send SMS</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Send SMS</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Phone Number *</Label><Input value={smsForm.phone} onChange={e => setSmsForm({ ...smsForm, phone: e.target.value })} placeholder="+61..." /></div>
                <div><Label>Message *</Label><Input value={smsForm.message} onChange={e => setSmsForm({ ...smsForm, message: e.target.value })} /></div>
                <Button className="w-full" onClick={sendSms} disabled={smsLoading}>{smsLoading ? "Sending..." : "Send SMS"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* System Automation */}
      <Card className="rounded-2xl shadow-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> System Automation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {automationTools.map(t => (
            <Button key={t.name} variant="outline" disabled={runningFn === t.name} onClick={() => runEdgeFunction(t.name)}>
              <t.icon className="h-4 w-4 mr-1" />
              {runningFn === t.name ? "Running..." : t.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Integration Tools */}
      <Card className="rounded-2xl shadow-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" /> Integration Tools</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {integrationTools.map(t => (
            <Button key={t.name} variant="outline" disabled={runningFn === t.name} onClick={() => runEdgeFunction(t.name)}>
              <t.icon className="h-4 w-4 mr-1" />
              {runningFn === t.name ? "Running..." : t.label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminToolsPage;
