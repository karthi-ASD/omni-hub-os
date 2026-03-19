import { useParams, useNavigate } from "react-router-dom";
import { useClients, Client, ClientStatus } from "@/hooks/useClients";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useClientConversations } from "@/hooks/useClientConversations";
import { useSalesCallbacks } from "@/hooks/useSalesCallbacks";
import { useState, useMemo, useEffect, useCallback } from "react";
import { EditClientDialog } from "@/components/clients/EditClientDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Globe, Smartphone, Search, FileText, Ticket, Clock,
  Mail, Phone, Building2, MapPin, Plus, ExternalLink, DollarSign, CreditCard, TrendingUp, AlertTriangle,
  ClipboardCheck, CheckCircle2, MessageSquare, PhoneCall, CalendarCheck, Pencil, Key, GitBranch, User,
  Plug, Target, FormInput, Package
} from "lucide-react";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";
import ClientPackagePage from "@/pages/ClientPackagePage";
import { useOnboardingChecklist } from "@/hooks/useOnboardingChecklist";
import { ClientActivityTimeline } from "@/components/clients/ClientActivityTimeline";
import { AddServiceDialog, ServiceFormData } from "@/components/clients/AddServiceDialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useClientFinancials } from "@/hooks/useClientFinancials";
import { ClientAccessHubTab } from "@/components/clients/access-hub/ClientAccessHubTab";
import { ClientIntegrationsTab } from "@/components/clients/ClientIntegrationsTab";
import { ClientLeadsTab } from "@/components/clients/ClientLeadsTab";
import { ClientCallsTab } from "@/components/clients/ClientCallsTab";
import { WebsiteTreeTab } from "@/components/clients/WebsiteTreeTab";
import { ClientProfileTab } from "@/components/clients/ClientProfileTab";
import { ClientWhatsAppHistoryTab } from "@/components/clients/ClientWhatsAppHistoryTab";
import { ContactFormCreationTab } from "@/components/clients/ContactFormCreationTab";
import { useSalesTeam } from "@/hooks/useSalesTeam";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, isToday, isTomorrow, isPast } from "date-fns";
import { toast } from "sonner";

const statusColor = (s: string) => {
  const m: Record<string, string> = {
    active: "bg-green-500/10 text-green-600",
    planning: "bg-blue-500/10 text-blue-600",
    completed: "bg-green-500/10 text-green-600",
    paused: "bg-amber-500/10 text-amber-600",
    cancelled: "bg-red-500/10 text-red-600",
    pending: "bg-amber-500/10 text-amber-600",
    in_progress: "bg-blue-500/10 text-blue-600",
    paid: "bg-green-500/10 text-green-600",
    overdue: "bg-red-500/10 text-red-600",
    open: "bg-blue-500/10 text-blue-600",
    resolved: "bg-green-500/10 text-green-600",
    closed: "bg-muted text-muted-foreground",
  };
  return m[s] || "bg-muted text-muted-foreground";
};

const convTypeIcon: Record<string, React.ElementType> = {
  call: Phone,
  meeting: Building2,
  whatsapp: MessageSquare,
  email: Mail,
};

type ClientFetchState = "loading" | "ready" | "archived" | "no_access" | "not_found" | "invalid_id" | "fetch_error";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ClientProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, loading: clientsLoading, updateClientStatus, refetch: fetchClients } = useClients();
  
  // Direct client fetch state
  const [client, setClient] = useState<Client | null>(null);
  const [fetchState, setFetchState] = useState<ClientFetchState>("loading");
  const { profile, isSuperAdmin } = useAuth();

  const getClientByIdAdmin = useCallback(async (routeClientId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("get_client_by_id_admin", {
        body: { client_id: routeClientId },
      });

      console.log("CLIENT_ADMIN_RESULT", {
        route_client_id: routeClientId,
        data,
        error,
      });

      return { data, error };
    } catch (error) {
      console.error("[ClientProfile] Admin debug invoke failed:", error);
      console.log("CLIENT_ADMIN_RESULT", {
        route_client_id: routeClientId,
        data: null,
        error,
      });
      return { data: null, error };
    }
  }, []);

  // Safe client fetch — direct DB query, not from in-memory list
  const fetchClientSafe = useCallback(async (clientId: string) => {
    console.log("CLIENT_DEBUG", {
      route_client_id: clientId,
      profile_business_id: profile?.business_id,
    });

    // Step 0: Validate UUID — if not UUID, attempt identity resolution (slug/name/email)
    if (!UUID_REGEX.test(clientId)) {
      console.log("[ClientProfile] Non-UUID route param, attempting resolve:", clientId);

      // Try direct DB lookup by company_name, email, or domain first
      try {
        const slug = decodeURIComponent(clientId);
        const { data: directMatch } = await supabase
          .from("clients")
          .select("id")
          .or(`company_name.ilike.%${slug}%,email.ilike.%${slug}%`)
          .limit(1)
          .maybeSingle();

        if (directMatch?.id) {
          console.log("[ClientProfile] Resolved slug to UUID via DB:", directMatch.id);
          navigate(`/clients/${directMatch.id}`, { replace: true });
          return;
        }
      } catch (e) {
        console.log("[ClientProfile] Direct DB resolve failed:", e);
      }

      // Fallback: edge function resolver
      try {
        const { data: resolveData } = await supabase.functions.invoke("client-identity-resolver", {
          body: { action: "resolve", email: clientId, external_id: clientId },
        });
        if (resolveData?.client_id) {
          console.log("[ClientProfile] Resolved non-UUID to client:", resolveData.client_id);
          navigate(`/clients/${resolveData.client_id}`, { replace: true });
          return;
        }
      } catch (e) {
        console.log("[ClientProfile] Edge function resolve failed:", e);
      }

      setFetchState("invalid_id");
      return;
    }

    setFetchState("loading");

    const { data: raw, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .maybeSingle();

    console.log("CLIENT_DB_RESULT", {
      data: raw,
      error,
    });

    if (error) {
      console.error("[ClientProfile] Fetch error:", error);
      console.log("CLIENT_FAILURE", {
        route_client_id: clientId,
        db_result: raw,
        db_error: error,
        debug_function_result: null,
        business_mismatch: false,
      });

      if (error.code === "PGRST116") {
        setFetchState("not_found");
      } else {
        setFetchState("fetch_error");
      }
      return;
    }

    if (!raw) {
      const { data: adminResult, error: adminError } = await getClientByIdAdmin(clientId);
      const adminClient = adminResult?.client ?? null;
      const businessMismatch = Boolean(
        adminClient?.business_id && profile?.business_id && adminClient.business_id !== profile.business_id
      );

      console.log("CLIENT_FAILURE", {
        route_client_id: clientId,
        db_result: raw,
        db_error: error,
        debug_function_result: adminResult,
        business_mismatch: businessMismatch,
      });

      if (adminError) {
        setFetchState("fetch_error");
        return;
      }

      if (adminClient?.merged_into) {
        navigate(`/clients/${adminClient.merged_into}`, { replace: true });
        return;
      }

      if (adminClient?.deleted_at) {
        setFetchState("archived");
        return;
      }

      if (adminResult?.exists) {
        setFetchState("no_access");
        return;
      }

      setFetchState("not_found");
      return;
    }

    if (raw.merged_into) {
      console.log("[ClientProfile] Client merged, redirecting to:", raw.merged_into);
      navigate(`/clients/${raw.merged_into}`, { replace: true });
      return;
    }

    if (raw.deleted_at) {
      console.log("[ClientProfile] Client archived");
      setFetchState("archived");
      return;
    }

    if (profile?.business_id && raw.business_id !== profile.business_id) {
      console.log("[ClientProfile] Business mismatch:", { client_biz: raw.business_id, user_biz: profile.business_id });
      console.log("CLIENT_FAILURE", {
        route_client_id: clientId,
        db_result: raw,
        db_error: null,
        debug_function_result: null,
        business_mismatch: true,
      });
      setFetchState("no_access");
      return;
    }

    setClient(raw as unknown as Client);
    setFetchState("ready");
  }, [getClientByIdAdmin, navigate, profile?.business_id]);

  useEffect(() => {
    if (id) {
      fetchClientSafe(id);
    }
  }, [id, fetchClientSafe]);

  // Also update client from the clients list when it changes (for status updates etc.)
  useEffect(() => {
    if (fetchState === "ready" && id) {
      const updated = clients.find(c => c.id === id);
      if (updated) setClient(updated);
    }
  }, [clients, id, fetchState]);

  const {
    services, websites, apps, seoProjects, invoices, contracts, tickets, timeline,
    loading, addWebsite, addApp, addService, updateServiceStatus,
  } = useClientProfile(id);
  const financials = useClientFinancials(id);
  const onboarding = useOnboardingChecklist(id);
  const { members: salesTeam } = useSalesTeam();
  const { conversations, addConversation } = useClientConversations(id);
  const { callbacks } = useSalesCallbacks();

  const clientCallbacks = useMemo(() => {
    return callbacks.filter(cb => cb.client_id === id).sort((a, b) => b.callback_date.localeCompare(a.callback_date));
  }, [callbacks, id]);

  const handleSalesOwnerChange = async (userId: string) => {
    if (!client) return;
    const member = salesTeam.find(m => m.user_id === userId);
    await supabase.from("clients").update({
      sales_owner_id: userId || null,
      salesperson_owner: member?.full_name || null,
    } as any).eq("id", client.id);
    toast.success("Sales owner updated");
  };

  const [websiteDialog, setWebsiteDialog] = useState(false);
  const [appDialog, setAppDialog] = useState(false);
  const [convDialog, setConvDialog] = useState(false);
  const [serviceDialog, setServiceDialog] = useState(false);
  const [editClientDialog, setEditClientDialog] = useState(false);
  const [webForm, setWebForm] = useState({ website_url: "", cms_type: "", hosting_provider: "", domain_provider: "" });
  const [appForm, setAppForm] = useState({ app_name: "", platform: "Android", app_category: "" });
  const [convForm, setConvForm] = useState({ conversation_type: "call", notes: "", next_callback_date: "" });
  
  const { hasRole, roles } = useAuth();
  const { departmentName } = useEmployeeDepartment();
  const canEditBilling = hasRole("super_admin") || hasRole("business_admin") || hasRole("manager");
  
  const deptLower = (departmentName || "").toLowerCase();
  const isFinanceDept = deptLower.includes("finance") || deptLower.includes("accounts") || deptLower.includes("accounting");
  const isSEODept = deptLower.includes("seo") || deptLower.includes("digital marketing");
  const isAdminUser = hasRole("super_admin") || hasRole("business_admin");
  const canViewPackageTab = isAdminUser || isFinanceDept || isSEODept;

  console.log({
    route_client_id: id,
    fetch_state: fetchState,
    resolved_client: client?.id,
  });

  // Loading state
  if (fetchState === "loading" || (fetchState === "ready" && loading)) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    );
  }

  // Archived client
  if (fetchState === "archived") {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <p className="text-lg font-medium">This client has been archived</p>
        <p className="text-sm text-muted-foreground">This client record was deleted or archived. Contact your administrator to restore it.</p>
        <Button variant="outline" onClick={() => navigate("/clients")}>Back to Clients</Button>
      </div>
    );
  }

  // No access / permission error
  if (fetchState === "no_access") {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-lg font-medium">You don't have access to this client</p>
        <p className="text-sm text-muted-foreground">This client belongs to a different organization or your permissions don't allow access.</p>
        <Button variant="outline" onClick={() => navigate("/clients")}>Back to Clients</Button>
      </div>
    );
  }

  // Fetch error (non-RLS, non-404)
  if (fetchState === "fetch_error") {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-lg font-medium">Unable to load client data</p>
        <p className="text-sm text-muted-foreground">An unexpected error occurred while fetching client information. Please refresh or contact support.</p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => id && fetchClientSafe(id)}>Retry</Button>
          <Button variant="outline" onClick={() => navigate("/clients")}>Back to Clients</Button>
        </div>
      </div>
    );
  }

  // Invalid ID format
  if (fetchState === "invalid_id") {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto" />
        <p className="text-lg font-medium">Invalid client reference</p>
        <p className="text-sm text-muted-foreground">The client ID in the URL is not valid. Please navigate from the clients list.</p>
        <Button variant="outline" onClick={() => navigate("/clients")}>Back to Clients</Button>
      </div>
    );
  }

  // Truly not found
  if (fetchState === "not_found" || !client) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto" />
        <p className="text-lg font-medium">Client does not exist</p>
        <p className="text-sm text-muted-foreground">No client record was found with this ID. It may have been permanently deleted or never existed.</p>
        <Button variant="outline" onClick={() => navigate("/clients")}>Back to Clients</Button>
      </div>
    );
  }

  const handleAddWebsite = async () => {
    if (!webForm.website_url) return;
    await addWebsite(webForm);
    setWebForm({ website_url: "", cms_type: "", hosting_provider: "", domain_provider: "" });
    setWebsiteDialog(false);
  };

  const handleAddApp = async () => {
    if (!appForm.app_name) return;
    await addApp(appForm);
    setAppForm({ app_name: "", platform: "Android", app_category: "" });
    setAppDialog(false);
  };

  const handleAddConversation = async () => {
    if (!convForm.notes) return;
    await addConversation(convForm);
    setConvForm({ conversation_type: "call", notes: "", next_callback_date: "" });
    setConvDialog(false);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{client.contact_name}</h1>
          {client.company_name && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" /> {client.company_name}
            </p>
          )}
        </div>
        <Select value={client.sales_owner_id || "unassigned"} onValueChange={v => v !== "unassigned" && handleSalesOwnerChange(v)}>
          <SelectTrigger className="w-36 h-8 text-xs rounded-lg"><SelectValue placeholder="Assign Sales" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned" disabled>Assign Sales</SelectItem>
            {salesTeam.length === 0 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">No sales team members available</div>
            )}
            {salesTeam.map(m => (
              <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={client.client_status || "pending"} onValueChange={v => updateClientStatus(client.id, v as ClientStatus)}>
          <SelectTrigger className="w-32 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Info Bar */}
      <div className="flex flex-wrap gap-4 text-sm">
        {client.email && (
          <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-primary">
            <Mail className="h-3.5 w-3.5" /> {client.email}
          </a>
        )}
        {client.phone && (
          <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 text-primary">
            <Phone className="h-3.5 w-3.5" /> {client.phone}
          </a>
        )}
        {client.city && (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {[client.city, client.state, client.country].filter(Boolean).join(", ")}
          </span>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Services", value: services.length },
          { label: "Websites", value: websites.length },
          { label: "SEO Projects", value: seoProjects.length },
          { label: "Tickets", value: tickets.length },
        ].map((s) => (
          <Card key={s.label} className="rounded-xl">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="profile"><User className="h-3.5 w-3.5 mr-1" />Profile</TabsTrigger>
          <TabsTrigger value="website-tree"><GitBranch className="h-3.5 w-3.5 mr-1" />Site Map</TabsTrigger>
          <TabsTrigger value="conversations"><MessageSquare className="h-3.5 w-3.5 mr-1" />Notes</TabsTrigger>
          <TabsTrigger value="callbacks"><PhoneCall className="h-3.5 w-3.5 mr-1" />Callbacks</TabsTrigger>
          <TabsTrigger value="onboarding"><ClipboardCheck className="h-3.5 w-3.5 mr-1" />Onboarding</TabsTrigger>
          <TabsTrigger value="finance"><DollarSign className="h-3.5 w-3.5 mr-1" />Finance</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="access"><Key className="h-3.5 w-3.5 mr-1" />Access</TabsTrigger>
          <TabsTrigger value="websites">Websites</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="apps">Apps</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="activity"><Clock className="h-3.5 w-3.5 mr-1" />Activity</TabsTrigger>
          <TabsTrigger value="whatsapp"><MessageSquare className="h-3.5 w-3.5 mr-1" />WhatsApp</TabsTrigger>
          <TabsTrigger value="integrations"><Plug className="h-3.5 w-3.5 mr-1" />Integrations</TabsTrigger>
          <TabsTrigger value="leads"><Target className="h-3.5 w-3.5 mr-1" />Leads</TabsTrigger>
          <TabsTrigger value="calls"><Phone className="h-3.5 w-3.5 mr-1" />Calls</TabsTrigger>
          <TabsTrigger value="contact-forms"><FormInput className="h-3.5 w-3.5 mr-1" />Contact Forms</TabsTrigger>
          {canViewPackageTab && <TabsTrigger value="package"><Package className="h-3.5 w-3.5 mr-1" />Package</TabsTrigger>}
        </TabsList>

        {/* ── Conversations / Notes ── */}
        <TabsContent value="conversations">
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Conversation History
              </CardTitle>
              <Button size="sm" onClick={() => setConvDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Note
              </Button>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No conversations recorded yet</p>
              ) : (
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
                  {conversations.map(conv => {
                    const Icon = convTypeIcon[conv.conversation_type] || Phone;
                    return (
                      <div key={conv.id} className="relative">
                        <div className="absolute -left-[18px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <Badge variant="outline" className="text-[10px]">{conv.conversation_type}</Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(conv.conversation_date), "dd MMM yyyy")}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{conv.notes}</p>
                          {conv.next_callback_date && (
                            <p className="text-xs text-primary flex items-center gap-1">
                              <CalendarCheck className="h-3 w-3" />
                              Follow-up: {format(parseISO(conv.next_callback_date), "dd MMM yyyy")}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Callbacks ── */}
        <TabsContent value="callbacks">
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PhoneCall className="h-4 w-4" /> Callback Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientCallbacks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No callbacks scheduled for this client</p>
              ) : (
                <div className="space-y-2">
                  {clientCallbacks.map(cb => (
                    <div key={cb.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                      <PhoneCall className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{cb.notes || "Callback"}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(cb.callback_date), "dd MMM yyyy")}
                          {cb.callback_time && ` · ${cb.callback_time}`}
                        </p>
                        {cb.result && <p className="text-xs text-foreground mt-1">Result: {cb.result}</p>}
                        {cb.next_step && <p className="text-xs text-primary">Next: {cb.next_step}</p>}
                      </div>
                      <Badge variant={cb.status === "completed" ? "default" : cb.status === "missed" ? "destructive" : "secondary"} className="text-xs">
                        {cb.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Onboarding Checklist ── */}
        <TabsContent value="onboarding">
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" /> Onboarding Checklist
                </CardTitle>
                <span className="text-sm text-muted-foreground">{onboarding.completedCount}/{onboarding.items.length} completed</span>
              </div>
              <Progress value={onboarding.progress} className="h-2 mt-2" />
            </CardHeader>
            <CardContent className="space-y-2">
              {onboarding.items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No onboarding checklist items. Items are auto-created when a deal is marked as Won, or you can add manually.</p>
              ) : (
                onboarding.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <Checkbox
                      checked={item.is_completed}
                      onCheckedChange={(checked) => onboarding.toggleItem(item.id, !!checked)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${item.is_completed ? "line-through text-muted-foreground" : "font-medium"}`}>{item.item_title}</p>
                      <p className="text-xs text-muted-foreground">{item.item_category}</p>
                    </div>
                    {item.is_completed && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                  </div>
                ))
              )}
              <div className="pt-2 flex gap-2">
                <Input
                  placeholder="Add custom checklist item..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.target as HTMLInputElement).value) {
                      onboarding.addItem((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Details ── */}
        <TabsContent value="details">
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Client Details</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setEditClientDialog(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[
                ["Client Status", client.client_status?.charAt(0).toUpperCase() + client.client_status?.slice(1)],
                ["Client Since", client.client_start_date || financials.clientSince || "—"],
                ["Contact Name", client.contact_name],
                ["Company", client.company_name],
                ["Email", client.email],
                ["Phone", client.phone],
                ["Mobile", (client as any).mobile],
                ["Website", (client as any).website],
                ["Address", client.address],
                ["City", client.city],
                ["State", client.state],
                ["Country", client.country],
                ["Sales Owner", client.salesperson_owner || "Unassigned"],
                ["Created", format(new Date(client.created_at), "dd MMM yyyy")],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
                  </div>
                ))}
            </CardContent>
          </Card>

          <EditClientDialog
            open={editClientDialog}
            onOpenChange={setEditClientDialog}
            client={client}
            onSuccess={() => {
              fetchClients();
            }}
          />
        </TabsContent>

        {/* ── Profile (Contacts, Socials) ── */}
        <TabsContent value="profile">
          {id && <ClientProfileTab clientId={id} client={client as any} />}
        </TabsContent>

        {/* ── Website Tree ── */}
        <TabsContent value="website-tree">
          {id && <WebsiteTreeTab clientId={id} websiteUrl={(client as any).website} />}
        </TabsContent>

        {/* ── Financial Portfolio ── */}
        <TabsContent value="finance">
          <div className="space-y-4">
            {/* Xero-only Banner + Create in Xero */}
            <div className="flex items-center justify-between rounded-xl bg-muted/40 border border-border/50 px-4 py-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Invoices are managed in Xero. CRM is read-only.</span>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => window.open("https://go.xero.com/AccountsReceivable/Edit.aspx", "_blank")}>
                <ExternalLink className="h-3 w-3 mr-1" /> Create Invoice in Xero
              </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Lifetime Revenue", value: `$${financials.totalRevenue.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-[hsl(152,60%,42%)]" },
                { label: "Outstanding", value: `$${financials.totalOutstanding.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`, icon: Clock, color: "text-[hsl(var(--primary))]" },
                { label: "Overdue", value: String(financials.overdueInvoices), icon: AlertTriangle, color: financials.overdueInvoices > 0 ? "text-[hsl(var(--destructive))]" : "text-muted-foreground" },
                { label: "Avg Invoice", value: `$${financials.avgInvoiceValue.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`, icon: FileText, color: "text-muted-foreground" },
              ].map(s => (
                <Card key={s.label} className="rounded-xl">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                      <span className="text-xs text-muted-foreground">{s.label}</span>
                    </div>
                    <p className="text-lg font-bold">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="rounded-xl">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Client Lifetime Value</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground">Total Invoices</span><p className="font-semibold text-lg">{financials.totalInvoices}</p></div>
                <div><span className="text-muted-foreground">Paid Invoices</span><p className="font-semibold text-lg">{financials.paidInvoices}</p></div>
                <div><span className="text-muted-foreground">Months Active</span><p className="font-semibold text-lg">{financials.monthsActive}</p></div>
                <div><span className="text-muted-foreground">Last Payment</span><p className="font-semibold text-lg">{financials.lastPaymentDate ? format(new Date(financials.lastPaymentDate), "dd MMM yyyy") : "—"}</p></div>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader><CardTitle className="text-sm">Invoice History ({financials.invoices.length})</CardTitle></CardHeader>
              <CardContent>
                {financials.invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Invoice #</TableHead><TableHead>Date</TableHead><TableHead>Due</TableHead>
                        <TableHead className="text-right">Total</TableHead><TableHead className="text-right">Due</TableHead><TableHead>Status</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {financials.invoices.map((inv: any) => (
                          <TableRow key={inv.id}>
                            <TableCell className="font-mono text-sm">{inv.invoice_number || "—"}</TableCell>
                            <TableCell className="text-sm">{inv.invoice_date ? format(new Date(inv.invoice_date), "dd MMM yyyy") : "—"}</TableCell>
                            <TableCell className="text-sm">{inv.due_date ? format(new Date(inv.due_date), "dd MMM yyyy") : "—"}</TableCell>
                            <TableCell className="text-right font-medium">${Number(inv.total_amount || 0).toLocaleString("en-AU", { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell className="text-right">${Number(inv.amount_due || 0).toLocaleString("en-AU", { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell><Badge variant={inv.status === "PAID" ? "default" : inv.status === "OVERDUE" ? "destructive" : "secondary"} className="text-xs">{inv.status}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : <p className="text-center text-sm text-muted-foreground py-6">No invoices from Xero for this client</p>}
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment History ({financials.payments.length})</CardTitle></CardHeader>
              <CardContent>
                {financials.payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {financials.payments.map((p: any) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-sm">{p.payment_date ? format(new Date(p.payment_date), "dd MMM yyyy") : "—"}</TableCell>
                            <TableCell className="text-right font-medium">${Number(p.payment_amount || 0).toLocaleString("en-AU", { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell className="text-sm">{p.payment_method || "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.transaction_reference || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : <p className="text-center text-sm text-muted-foreground py-6">No payment records for this client</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Recurring Services ── */}
        <TabsContent value="services">
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Recurring Services
              </CardTitle>
              {canEditBilling && (
                <Button size="sm" onClick={() => setServiceDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Service
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No recurring services added yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Billing Date</TableHead>
                        <TableHead>Next Billing</TableHead>
                        <TableHead>Status</TableHead>
                        {canEditBilling && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((s: any) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <p className="font-medium text-sm">{s.service_type}</p>
                            {s.service_name && <p className="text-xs text-muted-foreground">{s.service_name}</p>}
                          </TableCell>
                          <TableCell className="text-right font-medium">${Number(s.price_amount || 0).toLocaleString("en-AU", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="capitalize text-sm">{(s.billing_cycle || "—").replace("_", " ")}</TableCell>
                          <TableCell className="capitalize text-sm">{(s.payment_method || "—").replace("_", " ")}</TableCell>
                          <TableCell className="text-sm">{s.billing_date ? `${s.billing_date}${s.billing_date === 1 ? "st" : s.billing_date === 2 ? "nd" : s.billing_date === 3 ? "rd" : "th"}` : "—"}</TableCell>
                          <TableCell className="text-sm">{s.next_billing_date ? format(new Date(s.next_billing_date), "dd MMM yyyy") : "—"}</TableCell>
                          <TableCell>
                            <Badge className={statusColor(s.payment_status || s.service_status)}>{s.payment_status || s.service_status}</Badge>
                          </TableCell>
                          {canEditBilling && (
                            <TableCell>
                              <Button
                                size="sm"
                                variant={s.service_status === "active" ? "destructive" : "default"}
                                className="text-xs h-7"
                                onClick={() => updateServiceStatus(s.id, s.service_status === "active" ? "disabled" : "active")}
                              >
                                {s.service_status === "active" ? "Disable" : "Enable"}
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Websites ── */}
        <TabsContent value="websites">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => setWebsiteDialog(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Website
            </Button>
          </div>
          {websites.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No websites linked</p>
          ) : (
            <div className="space-y-2">
              {websites.map((w) => (
                <Card key={w.id} className="rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-semibold text-sm">{w.website_url}</p>
                          <p className="text-xs text-muted-foreground">
                            {[w.cms_type, w.hosting_provider].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusColor(w.website_status)}>{w.website_status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── SEO ── */}
        <TabsContent value="seo">
          {seoProjects.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No SEO projects</p>
          ) : (
            <div className="space-y-2">
              {seoProjects.map((p: any) => (
                <Card key={p.id} className="rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-primary" />
                          <p className="font-semibold text-sm">{p.project_name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {p.website_domain} · {p.service_package} · {p.target_location}
                        </p>
                      </div>
                      <Badge className={statusColor(p.project_status)}>{p.project_status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Apps ── */}
        <TabsContent value="apps">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => setAppDialog(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add App
            </Button>
          </div>
          {apps.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No mobile apps</p>
          ) : (
            <div className="space-y-2">
              {apps.map((a) => (
                <Card key={a.id} className="rounded-xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-semibold text-sm">{a.app_name}</p>
                        <p className="text-xs text-muted-foreground">{a.platform} · {a.app_category || "—"}</p>
                      </div>
                    </div>
                    <Badge className={statusColor(a.app_status)}>{a.app_status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Billing ── */}
        <TabsContent value="billing">
          <div className="space-y-4">
            {contracts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> Contracts
                </h3>
                <div className="space-y-2">
                  {contracts.map((c: any) => (
                    <Card key={c.id} className="rounded-xl">
                      <CardContent className="p-3 flex items-center justify-between text-sm">
                        <span>{c.contract_number || "Contract"}</span>
                        <Badge className={statusColor(c.status)}>{c.status}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {invoices.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold mb-2">Invoices</h3>
                <div className="space-y-2">
                  {invoices.map((inv: any) => (
                    <Card key={inv.id} className="rounded-xl">
                      <CardContent className="p-3 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{inv.invoice_number || "Invoice"}</p>
                          <p className="text-xs text-muted-foreground">
                            {inv.currency} {Number(inv.total || 0).toFixed(2)} · Due {inv.due_date ? format(new Date(inv.due_date), "dd MMM yyyy") : "—"}
                          </p>
                        </div>
                        <Badge className={statusColor(inv.status)}>{inv.status}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : contracts.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No billing records</p>
            ) : null}
          </div>
        </TabsContent>

        {/* ── Tickets ── */}
        <TabsContent value="tickets">
          {tickets.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No support tickets</p>
          ) : (
            <div className="space-y-2">
              {tickets.map((t: any) => (
                <Card key={t.id} className="rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-semibold text-sm">{t.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.ticket_number} · {t.priority} · {t.department || "General"}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusColor(t.status)}>{t.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Timeline ── */}
        <TabsContent value="timeline">
          {timeline.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No activity recorded yet</p>
          ) : (
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
              {timeline.map((ev: any) => (
                <div key={ev.id} className="relative">
                  <div className="absolute -left-[18px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                  <div>
                    <p className="text-sm font-medium">{ev.event_title}</p>
                    {ev.event_description && (
                      <p className="text-xs text-muted-foreground">{ev.event_description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(ev.created_at), "dd MMM yyyy, HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Access & Integrations ── */}
        <TabsContent value="access">
          {id && <ClientAccessHubTab clientId={id} />}
        </TabsContent>

        {/* ── Client Activity Log (Internal) ── */}
        <TabsContent value="activity">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> Client Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClientActivityTimeline clientId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── WhatsApp History ── */}
        <TabsContent value="whatsapp">
          {id && client && (
            <ClientWhatsAppHistoryTab clientId={id} businessId={client.business_id} />
          )}
        </TabsContent>

        {/* ── Integrations ── */}
        <TabsContent value="integrations">
          {id && <ClientIntegrationsTab clientId={id} />}
        </TabsContent>

        {/* ── Leads ── */}
        <TabsContent value="leads">
          {id && <ClientLeadsTab clientId={id} />}
        </TabsContent>

        {/* ── Calls & Communication ── */}
        <TabsContent value="calls">
          {id && <ClientCallsTab clientId={id} />}
        </TabsContent>

        {/* ── Contact Form Creation ── */}
        <TabsContent value="contact-forms">
          {id && <ContactFormCreationTab clientId={id} />}
        </TabsContent>

        {/* ── Package ── */}
        {canViewPackageTab && (
          <TabsContent value="package">
            {id && <ClientPackagePage clientIdProp={id} />}
          </TabsContent>
        )}
      </Tabs>

      {/* Add Website Dialog */}
      <Dialog open={websiteDialog} onOpenChange={setWebsiteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Website</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Website URL *</Label><Input value={webForm.website_url} onChange={(e) => setWebForm((p) => ({ ...p, website_url: e.target.value }))} placeholder="https://example.com" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>CMS Type</Label>
                <Select value={webForm.cms_type} onValueChange={(v) => setWebForm((p) => ({ ...p, cms_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select CMS" /></SelectTrigger>
                  <SelectContent>
                    {["WordPress", "Shopify", "Webflow", "Custom", "Wix", "Squarespace", "Other"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Hosting Provider</Label><Input value={webForm.hosting_provider} onChange={(e) => setWebForm((p) => ({ ...p, hosting_provider: e.target.value }))} placeholder="e.g. SiteGround" /></div>
            </div>
            <div><Label>Domain Provider</Label><Input value={webForm.domain_provider} onChange={(e) => setWebForm((p) => ({ ...p, domain_provider: e.target.value }))} placeholder="e.g. GoDaddy" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebsiteDialog(false)}>Cancel</Button>
            <Button onClick={handleAddWebsite} disabled={!webForm.website_url}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add App Dialog */}
      <Dialog open={appDialog} onOpenChange={setAppDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Mobile App</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>App Name *</Label><Input value={appForm.app_name} onChange={(e) => setAppForm((p) => ({ ...p, app_name: e.target.value }))} placeholder="MyApp" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Platform</Label>
                <Select value={appForm.platform} onValueChange={(v) => setAppForm((p) => ({ ...p, platform: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Android", "iOS", "Hybrid"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Category</Label><Input value={appForm.app_category} onChange={(e) => setAppForm((p) => ({ ...p, app_category: e.target.value }))} placeholder="e.g. Business" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppDialog(false)}>Cancel</Button>
            <Button onClick={handleAddApp} disabled={!appForm.app_name}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Conversation Dialog */}
      <Dialog open={convDialog} onOpenChange={setConvDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Conversation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Type</Label>
              <Select value={convForm.conversation_type} onValueChange={v => setConvForm(p => ({ ...p, conversation_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notes *</Label><Textarea value={convForm.notes} onChange={e => setConvForm(p => ({ ...p, notes: e.target.value }))} placeholder="What was discussed..." rows={4} /></div>
            <div><Label>Next Follow-up Date</Label><Input type="date" value={convForm.next_callback_date} onChange={e => setConvForm(p => ({ ...p, next_callback_date: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvDialog(false)}>Cancel</Button>
            <Button onClick={handleAddConversation} disabled={!convForm.notes}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <AddServiceDialog
        open={serviceDialog}
        onOpenChange={setServiceDialog}
        onSubmit={async (data: ServiceFormData) => {
          await addService(data);
        }}
      />
    </div>
  );
};

export default ClientProfilePage;
