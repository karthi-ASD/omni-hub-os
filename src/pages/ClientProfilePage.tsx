import { useParams, useNavigate } from "react-router-dom";
import { useClients, Client } from "@/hooks/useClients";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Globe, Smartphone, Search, FileText, Ticket, Clock,
  Mail, Phone, Building2, MapPin, Plus, ExternalLink, DollarSign, CreditCard, TrendingUp, AlertTriangle
} from "lucide-react";
import { useClientFinancials } from "@/hooks/useClientFinancials";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

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

const ClientProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, loading: clientsLoading } = useClients();
  const client = clients.find((c) => c.id === id);
  const {
    services, websites, apps, seoProjects, invoices, contracts, tickets, timeline,
    loading, addWebsite, addApp,
  } = useClientProfile(id);
  const financials = useClientFinancials(id);

  const [websiteDialog, setWebsiteDialog] = useState(false);
  const [appDialog, setAppDialog] = useState(false);
  const [webForm, setWebForm] = useState({ website_url: "", cms_type: "", hosting_provider: "", domain_provider: "" });
  const [appForm, setAppForm] = useState({ app_name: "", platform: "Android", app_category: "" });

  if (clientsLoading || loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Client not found</p>
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
        <Badge className={statusColor(client.onboarding_status)}>
          {client.onboarding_status.replace("_", " ")}
        </Badge>
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
        <TabsList className="grid grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="websites">Websites</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="apps" className="hidden lg:inline-flex">Apps</TabsTrigger>
          <TabsTrigger value="billing" className="hidden lg:inline-flex">Billing</TabsTrigger>
          <TabsTrigger value="tickets" className="hidden lg:inline-flex">Tickets</TabsTrigger>
          <TabsTrigger value="timeline" className="hidden lg:inline-flex">Timeline</TabsTrigger>
        </TabsList>

        {/* ── Details ── */}
        <TabsContent value="details">
          <Card className="rounded-xl">
            <CardContent className="p-4 space-y-3">
              {[
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
        </TabsContent>

        {/* ── Services ── */}
        <TabsContent value="services">
          {services.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No services subscribed yet</p>
          ) : (
            <div className="space-y-2">
              {services.map((s) => (
                <Card key={s.id} className="rounded-xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{s.service_type}</p>
                      {s.service_category && <p className="text-xs text-muted-foreground">{s.service_category}</p>}
                      {s.assigned_department && (
                        <Badge variant="outline" className="mt-1 text-[10px]">{s.assigned_department}</Badge>
                      )}
                    </div>
                    <Badge className={statusColor(s.service_status)}>{s.service_status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
    </div>
  );
};

export default ClientProfilePage;
