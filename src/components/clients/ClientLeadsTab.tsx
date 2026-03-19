import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, ChevronLeft, ChevronRight, MapPin, Globe, Smartphone, Monitor, Tablet, ShieldAlert, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

interface Props {
  clientId: string;
}

interface CapturedLead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  source: string;
  page_url: string | null;
  status: string | null;
  created_at: string | null;
  // Geo fields
  country: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  ip_address: string | null;
  device_info: { device_type?: string; browser?: string; os?: string } | null;
  // Spam fields
  spam_score: number | null;
  is_spam: boolean | null;
}

const PAGE_SIZE = 20;

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600",
  contacted: "bg-amber-500/10 text-amber-600",
  converted: "bg-green-500/10 text-green-600",
  lost: "bg-red-500/10 text-red-600",
};

const DeviceIcon = ({ type }: { type?: string }) => {
  if (type === "mobile") return <Smartphone className="h-3 w-3" />;
  if (type === "tablet") return <Tablet className="h-3 w-3" />;
  return <Monitor className="h-3 w-3" />;
};

export const ClientLeadsTab = ({ clientId }: Props) => {
  const { roles } = useAuth();
  const isAdmin = roles.some(r => ["super_admin", "business_admin"].includes(r));
  // Client users should NOT see geo data
  const isClientUser = roles.some(r => r === "client");
  const canViewGeo = !isClientUser;

  const [leads, setLeads] = useState<CapturedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [spamFilter, setSpamFilter] = useState("all"); // all, genuine, spam
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("seo_captured_leads")
      .select("*", { count: "exact" })
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (spamFilter === "genuine") {
      query = query.eq("is_spam", false) as any;
    } else if (spamFilter === "spam") {
      query = query.eq("is_spam", true) as any;
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, count } = await query;
    setLeads((data as any) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [clientId, page, statusFilter, spamFilter, search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateStatus = async (leadId: string, newStatus: string) => {
    await supabase.from("seo_captured_leads").update({ status: newStatus } as any).eq("id", leadId);
    fetchLeads();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Aggregate geo stats
  const geoStats = leads.reduce((acc, l) => {
    if (l.country) acc.countries[l.country] = (acc.countries[l.country] || 0) + 1;
    if (l.city) acc.cities[l.city] = (acc.cities[l.city] || 0) + 1;
    const dt = (l.device_info as any)?.device_type || "desktop";
    acc.devices[dt] = (acc.devices[dt] || 0) + 1;
    const browser = (l.device_info as any)?.browser || "unknown";
    acc.browsers[browser] = (acc.browsers[browser] || 0) + 1;
    return acc;
  }, { countries: {} as Record<string, number>, cities: {} as Record<string, number>, devices: {} as Record<string, number>, browsers: {} as Record<string, number> });

  const spamCount = leads.filter(l => l.is_spam).length;
  const genuineCount = leads.filter(l => !l.is_spam).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Leads", value: total },
          { label: "Genuine", value: genuineCount },
          { label: "Spam", value: spamCount },
          { label: "Contacted", value: leads.filter(l => l.status === "contacted").length },
          { label: "Converted", value: leads.filter(l => l.status === "converted").length },
        ].map(s => (
          <Card key={s.label} className="rounded-xl">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          {canViewGeo && <TabsTrigger value="geo">Geo Insights</TabsTrigger>}
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="Search name, email, phone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="max-w-xs h-9"
            />
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={spamFilter} onValueChange={v => { setSpamFilter(v); setPage(0); }}>
              <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leads</SelectItem>
                <SelectItem value="genuine">Genuine Only</SelectItem>
                <SelectItem value="spam">Spam Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" /> Website Leads ({total})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : leads.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No leads captured yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Spam</TableHead>
                        <TableHead>Status</TableHead>
                        {canViewGeo && <TableHead>Location</TableHead>}
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map(lead => (
                        <TableRow key={lead.id} className={lead.is_spam ? "opacity-60" : ""}>
                          <TableCell className="font-medium text-sm">{lead.name || "—"}</TableCell>
                          <TableCell className="text-sm">{lead.phone || "—"}</TableCell>
                          <TableCell className="text-sm">{lead.email || "—"}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{lead.message || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{lead.source}</Badge>
                          </TableCell>
                          <TableCell>
                            {lead.is_spam ? (
                              <Badge variant="destructive" className="text-[10px] gap-1">
                                <ShieldAlert className="h-2.5 w-2.5" /> Spam ({lead.spam_score})
                              </Badge>
                            ) : (
                              <Badge className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                                <ShieldCheck className="h-2.5 w-2.5" /> Genuine
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={lead.status || "new"}
                              onValueChange={v => updateStatus(lead.id, v)}
                            >
                              <SelectTrigger className="h-7 w-28 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="converted">Converted</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          {canViewGeo && (
                            <TableCell className="text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {[lead.city, lead.country].filter(Boolean).join(", ") || "—"}
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="text-xs text-muted-foreground">
                            {lead.created_at ? format(new Date(lead.created_at), "dd MMM yyyy") : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Geo Insights Tab (Admin/SEO only) */}
        {canViewGeo && (
          <TabsContent value="geo" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Countries */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Top Countries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(geoStats.countries).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No geo data yet</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(geoStats.countries)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([country, count]) => (
                          <div key={country} className="flex justify-between items-center text-sm">
                            <span>{country}</span>
                            <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cities */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Top Cities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(geoStats.cities).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No city data yet</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(geoStats.cities)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([city, count]) => (
                          <div key={city} className="flex justify-between items-center text-sm">
                            <span>{city}</span>
                            <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Devices */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Devices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(geoStats.devices)
                      .sort(([, a], [, b]) => b - a)
                      .map(([device, count]) => (
                        <div key={device} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <DeviceIcon type={device} />
                            <span className="capitalize">{device}</span>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Browsers */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Browsers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(geoStats.browsers)
                      .sort(([, a], [, b]) => b - a)
                      .map(([browser, count]) => (
                        <div key={browser} className="flex justify-between items-center text-sm">
                          <span>{browser}</span>
                          <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Geo Table */}
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Lead Geo Details</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Browser</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map(lead => (
                        <TableRow key={lead.id}>
                          <TableCell className="text-sm font-medium">{lead.name || lead.email || "—"}</TableCell>
                          <TableCell className="text-xs">
                            {[lead.city, lead.region, lead.country].filter(Boolean).join(", ") || "—"}
                          </TableCell>
                          <TableCell className="text-xs font-mono">{lead.ip_address || "—"}</TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-1">
                              <DeviceIcon type={(lead.device_info as any)?.device_type} />
                              <span className="capitalize">{(lead.device_info as any)?.device_type || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{(lead.device_info as any)?.browser || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {lead.created_at ? format(new Date(lead.created_at), "dd MMM HH:mm") : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
