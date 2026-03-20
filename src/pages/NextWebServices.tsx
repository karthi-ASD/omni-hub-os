import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Globe, BarChart3, Headphones, Zap, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const SERVICE_TABS = [
  { key: "overview", label: "Overview", icon: Headphones },
  { key: "seo", label: "SEO Services", icon: Search },
  { key: "website", label: "Website Management", icon: Globe },
  { key: "ads", label: "Ads Management", icon: BarChart3 },
  { key: "automation", label: "Automation", icon: Zap },
  { key: "requests", label: "My Requests", icon: Clock },
];

const REQUEST_TYPES = [
  { value: "feature_request", label: "Feature Request" },
  { value: "support_issue", label: "Support Issue" },
  { value: "automation_request", label: "Automation Request" },
  { value: "integration_request", label: "Integration Request" },
];

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "seo", label: "SEO" },
  { value: "website", label: "Website" },
  { value: "ads", label: "Ads" },
  { value: "crm", label: "CRM" },
  { value: "automation", label: "Automation" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  resolved: "bg-green-500/10 text-green-600 border-green-500/20",
  closed: "bg-muted text-muted-foreground",
};

export default function NextWebServices() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    request_type: "support_issue",
    service_category: "general",
    priority: "medium",
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["nextweb-requests", profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return [];
      const { data, error } = await supabase
        .from("nextweb_service_requests" as any)
        .select("*")
        .eq("business_id", profile.business_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.business_id,
  });

  const createRequest = useMutation({
    mutationFn: async () => {
      if (!profile?.business_id || !user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("nextweb_service_requests" as any).insert({
        business_id: profile.business_id,
        created_by: user.id,
        ...newRequest,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request submitted to NextWeb");
      setShowNewRequest(false);
      setNewRequest({ title: "", description: "", request_type: "support_issue", service_category: "general", priority: "medium" });
      queryClient.invalidateQueries({ queryKey: ["nextweb-requests"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const pendingCount = requests.filter((r: any) => r.status === "pending").length;
  const resolvedCount = requests.filter((r: any) => r.status === "resolved" || r.status === "closed").length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">NextWeb Services</h1>
          <p className="text-sm text-muted-foreground">Manage your services and raise requests to NextWeb</p>
        </div>
        <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Raise Request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Raise Request to NextWeb</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Select value={newRequest.request_type} onValueChange={v => setNewRequest(p => ({ ...p, request_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REQUEST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                placeholder="Request title"
                value={newRequest.title}
                onChange={e => setNewRequest(p => ({ ...p, title: e.target.value }))}
              />
              <Textarea
                placeholder="Describe your request..."
                value={newRequest.description}
                onChange={e => setNewRequest(p => ({ ...p, description: e.target.value }))}
                rows={4}
              />
              <Select value={newRequest.priority} onValueChange={v => setNewRequest(p => ({ ...p, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                onClick={() => createRequest.mutate()}
                disabled={!newRequest.title || createRequest.isPending}
              >
                {createRequest.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1">
          {SERVICE_TABS.map(tab => (
            <TabsTrigger key={tab.key} value={tab.key} className="gap-1.5">
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.key === "requests" && pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{pendingCount}</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />Pending Requests
                </CardTitle>
              </CardHeader>
              <CardContent><p className="text-3xl font-bold">{pendingCount}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />Resolved
                </CardTitle>
              </CardHeader>
              <CardContent><p className="text-3xl font-bold">{resolvedCount}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" />Total Requests
                </CardTitle>
              </CardHeader>
              <CardContent><p className="text-3xl font-bold">{requests.length}</p></CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              { icon: Search, title: "SEO Services", desc: "Keyword tracking, on-page optimization, backlink strategy" },
              { icon: Globe, title: "Website Management", desc: "Website development, hosting, domain management" },
              { icon: BarChart3, title: "Ads Management", desc: "Google Ads, Facebook Ads, campaign optimization" },
              { icon: Zap, title: "Automation & Integrations", desc: "CRM automation, API integrations, workflow setup" },
            ].map(svc => (
              <Card key={svc.title} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <svc.icon className="h-5 w-5 text-primary" />{svc.title}
                  </CardTitle>
                  <CardDescription>{svc.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <Card><CardHeader><CardTitle>SEO Services</CardTitle><CardDescription>Your SEO campaign performance and tasks managed by NextWeb.</CardDescription></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">View your SEO projects, keyword rankings, and reports from the dedicated SEO dashboard.</p></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="website" className="mt-6">
          <Card><CardHeader><CardTitle>Website Management</CardTitle><CardDescription>Website development, hosting, and domain management.</CardDescription></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Track website changes, hosting status, and domain renewals.</p></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads" className="mt-6">
          <Card><CardHeader><CardTitle>Ads Management</CardTitle><CardDescription>Google Ads, Facebook Ads, and campaign performance.</CardDescription></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">View your ad campaigns, budgets, and ROI metrics.</p></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="mt-6">
          <Card><CardHeader><CardTitle>Automation & Integrations</CardTitle><CardDescription>Automated workflows and third-party integrations.</CardDescription></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Request new automations or integrations from the NextWeb team.</p></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-6 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No requests yet. Click "Raise Request" to get started.
              </CardContent>
            </Card>
          ) : (
            requests.map((req: any) => (
              <Card key={req.id}>
                <CardContent className="py-4 flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="font-medium text-sm truncate">{req.title}</p>
                    {req.description && <p className="text-xs text-muted-foreground line-clamp-2">{req.description}</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">
                        {REQUEST_TYPES.find(t => t.value === req.request_type)?.label || req.request_type}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{req.priority}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(req.created_at), "dd MMM yyyy")}
                      </span>
                    </div>
                  </div>
                  <Badge className={`shrink-0 text-[10px] ${STATUS_COLORS[req.status] || ""}`}>
                    {req.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
