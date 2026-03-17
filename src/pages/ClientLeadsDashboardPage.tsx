import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ClientPortalEmptyState } from "@/components/client/ClientPortalEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3, Phone, Mail, MessageSquare, Globe, Users,
  ArrowUpRight, ArrowDownRight, Wifi, WifiOff, Zap, Rocket
} from "lucide-react";

interface LeadStats {
  total: number;
  form: number;
  callClick: number;
  api: number;
  today: number;
  last7: number;
  last30: number;
  growth: number;
  emailsSent: number;
  whatsappSent: number;
  callsTriggered: number;
}

export default function ClientLeadsDashboardPage() {
  usePageTitle("Lead Dashboard");
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LeadStats>({
    total: 0, form: 0, callClick: 0, api: 0, today: 0, last7: 0, last30: 0,
    growth: 0, emailsSent: 0, whatsappSent: 0, callsTriggered: 0,
  });
  const [automationSettings, setAutomationSettings] = useState<any>(null);
  const [integrations, setIntegrations] = useState<{ ga4: boolean; gbp: boolean; whatsapp: boolean }>({
    ga4: false, gbp: false, whatsapp: false,
  });
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) fetchClientData();
  }, [user?.id]);

  const fetchClientData = async () => {
    setLoading(true);

    // Get client_id for this user
    const { data: cu } = await supabase
      .from("client_users")
      .select("client_id")
      .eq("user_id", user!.id)
      .eq("is_primary", true)
      .maybeSingle();

    if (!cu?.client_id) { setLoading(false); return; }
    setClientId(cu.client_id);

    // Get active projects for this client
    const { data: projects } = await supabase
      .from("seo_projects")
      .select("id")
      .eq("client_id", cu.client_id)
      .eq("project_status", "active");

    const projectIds = (projects || []).map((p: any) => p.id);
    if (projectIds.length === 0) { setLoading(false); return; }

    // Fetch leads, automation logs, settings, and connections in parallel
    const [leadsRes, logsRes, settingsRes, connRes] = await Promise.all([
      supabase
        .from("seo_captured_leads")
        .select("id, source, created_at")
        .in("seo_project_id", projectIds)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("seo_automation_logs")
        .select("automation_type, status")
        .in("seo_project_id", projectIds)
        .eq("status", "success"),
      supabase
        .from("seo_automation_settings")
        .select("*")
        .in("seo_project_id", projectIds)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("analytics_connections")
        .select("provider, is_active")
        .in("project_id", projectIds),
    ]);

    const leads = (leadsRes.data as any[]) || [];
    const logs = (logsRes.data as any[]) || [];
    const now = Date.now();

    const total = leads.length;
    const form = leads.filter(l => l.source === "form").length;
    const callClick = leads.filter(l => l.source === "call_click").length;
    const api = leads.filter(l => l.source === "api").length;
    const today = leads.filter(l => new Date(l.created_at).getTime() > now - 86400000).length;
    const last7 = leads.filter(l => new Date(l.created_at).getTime() > now - 7 * 86400000).length;
    const last30 = leads.filter(l => new Date(l.created_at).getTime() > now - 30 * 86400000).length;
    const prev30 = leads.filter(l => {
      const d = new Date(l.created_at).getTime();
      return d > now - 60 * 86400000 && d <= now - 30 * 86400000;
    }).length;
    const growth = prev30 > 0 ? Math.round(((last30 - prev30) / prev30) * 100) : last30 > 0 ? 100 : 0;

    const emailsSent = logs.filter(l => l.automation_type === "email" || l.automation_type === "email_fallback").length;
    const whatsappSent = logs.filter(l => l.automation_type === "whatsapp").length;
    const callsTriggered = logs.filter(l => l.automation_type === "call").length;

    setStats({ total, form, callClick, api, today, last7, last30, growth, emailsSent, whatsappSent, callsTriggered });
    setAutomationSettings(settingsRes.data);

    const conns = (connRes.data as any[]) || [];
    setIntegrations({
      ga4: conns.some(c => c.provider === "GA4" && c.is_active),
      gbp: conns.some(c => c.provider === "GBP" && c.is_active),
      whatsapp: settingsRes.data?.whatsapp_connected || false,
    });

    setLoading(false);
  };

  const toggleClientAutomation = async (key: string, value: boolean) => {
    if (!automationSettings?.id) return;

    // Client can only toggle automation on/off, not edit number or connection
    if (key === "enable_whatsapp" && value && !automationSettings.whatsapp_connected) {
      toast({ title: "WhatsApp not connected", description: "Contact your SEO manager to connect WhatsApp", variant: "destructive" });
      return;
    }

    await supabase.from("seo_automation_settings").update({ [key]: value } as any).eq("id", automationSettings.id);
    setAutomationSettings({ ...automationSettings, [key]: value });
    toast({ title: `${key.replace("enable_", "").replace("_", " ")} automation ${value ? "enabled" : "disabled"}` });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="p-6">
        <ClientPortalEmptyState icon={Rocket} title="No active projects" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Lead Dashboard
        </h1>
        <p className="text-muted-foreground">Track leads, communications, and performance</p>
      </div>

      {/* Lead KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-primary">{stats.total}</div>
          <p className="text-sm text-muted-foreground">Total Leads</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-chart-1">{stats.form}</div>
          <p className="text-sm text-muted-foreground">Form Leads</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-chart-2">{stats.callClick}</div>
          <p className="text-sm text-muted-foreground">Call Clicks</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <div className={`text-3xl font-bold flex items-center justify-center gap-1 ${stats.growth >= 0 ? "text-chart-2" : "text-destructive"}`}>
            {stats.growth >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            {Math.abs(stats.growth)}%
          </div>
          <p className="text-sm text-muted-foreground">Monthly Growth</p>
        </CardContent></Card>
      </div>

      {/* Period Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6 text-center">
          <div className="text-2xl font-bold">{stats.today}</div>
          <p className="text-xs text-muted-foreground">Today</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <div className="text-2xl font-bold">{stats.last7}</div>
          <p className="text-xs text-muted-foreground">Last 7 Days</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <div className="text-2xl font-bold">{stats.last30}</div>
          <p className="text-xs text-muted-foreground">Last 30 Days</p>
        </CardContent></Card>
      </div>

      {/* Communications */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Communications Sent</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Mail className="h-5 w-5 mx-auto text-chart-1 mb-1" />
              <div className="text-xl font-bold">{stats.emailsSent}</div>
              <p className="text-xs text-muted-foreground">Emails Sent</p>
            </div>
            <div>
              <MessageSquare className="h-5 w-5 mx-auto text-chart-2 mb-1" />
              <div className="text-xl font-bold">{stats.whatsappSent}</div>
              <p className="text-xs text-muted-foreground">WhatsApp Sent</p>
            </div>
            <div>
              <Phone className="h-5 w-5 mx-auto text-chart-4 mb-1" />
              <div className="text-xl font-bold">{stats.callsTriggered}</div>
              <p className="text-xs text-muted-foreground">Calls Triggered</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Integration Status</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "WhatsApp", connected: integrations.whatsapp, icon: MessageSquare },
              { label: "Google Analytics", connected: integrations.ga4, icon: BarChart3 },
              { label: "Business Profile", connected: integrations.gbp, icon: Globe },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 p-3 border rounded-lg">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
                <Badge variant={item.connected ? "default" : "secondary"} className="gap-1 text-xs">
                  {item.connected ? <><Wifi className="h-3 w-3" />On</> : <><WifiOff className="h-3 w-3" />Off</>}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client Automation Controls (toggle only) */}
      {automationSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" /> Automation Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground mb-3">Toggle automations for your project. Contact your SEO manager to change WhatsApp number or connection.</p>
            {automationSettings.whatsapp_number && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">WhatsApp Number</p>
                  <p className="text-xs text-muted-foreground font-mono">{automationSettings.whatsapp_number}</p>
                </div>
                <Badge variant="outline" className="text-xs">Read Only</Badge>
              </div>
            )}
            {([
              { key: "enable_email", label: "Email Automation", icon: Mail },
              { key: "enable_whatsapp", label: "WhatsApp Automation", icon: MessageSquare },
              { key: "enable_call", label: "Call Automation", icon: Phone },
            ] as const).map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{item.label}</span>
                </div>
                <Switch
                  checked={automationSettings[item.key]}
                  onCheckedChange={v => toggleClientAutomation(item.key, v)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
