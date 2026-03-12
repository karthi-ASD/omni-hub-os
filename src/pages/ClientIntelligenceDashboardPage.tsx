import { useState, useMemo } from "react";
import { useClients, Client } from "@/hooks/useClients";
import { useFinanceDashboard } from "@/hooks/useFinanceDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users, CheckCircle, XCircle, Clock, DollarSign, AlertTriangle,
  TrendingDown, BarChart3, PieChart, ShieldAlert, UserCheck, Search, Filter,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { format, subMonths } from "date-fns";

const fmt = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ClientIntelligenceDashboardPage = () => {
  const { profile } = useAuth();
  const { clients, loading: clientsLoading, totalCount } = useClients();
  const {
    loading: finLoading, paidInvoices, xeroInvoices, revenueByClient,
    totalRevenue, monthlyRevenue,
  } = useFinanceDashboard();

  const [statusFilter, setStatusFilter] = useState("all");
  const [salespersonFilter, setSalespersonFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loading = clientsLoading || finLoading;

  // Unique salesperson list
  const salespersons = useMemo(() => {
    const set = new Set(clients.map(c => c.salesperson_owner).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [clients]);

  // Filtered clients
  const filtered = useMemo(() => {
    let list = clients;
    if (statusFilter !== "all") list = list.filter(c => c.client_status === statusFilter);
    if (salespersonFilter !== "all") list = list.filter(c => c.salesperson_owner === salespersonFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(c =>
        c.contact_name.toLowerCase().includes(q) ||
        (c.company_name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [clients, statusFilter, salespersonFilter, searchTerm]);

  // Status counts
  const active = clients.filter(c => c.client_status === "active").length;
  const cancelled = clients.filter(c => c.client_status === "cancelled").length;
  const pending = clients.filter(c => c.client_status === "pending").length;

  // Revenue helpers
  const clientRevenue = useMemo(() => {
    const map: Record<string, { revenue: number; outstanding: number; invoiceCount: number; lastPayment: string | null; firstInvoice: string | null }> = {};
    xeroInvoices.forEach(inv => {
      const cid = inv.client_id || inv.contact_name || "";
      if (!map[cid]) map[cid] = { revenue: 0, outstanding: 0, invoiceCount: 0, lastPayment: null, firstInvoice: null };
      map[cid].invoiceCount++;
      if (inv.status === "PAID") map[cid].revenue += Number(inv.total_amount);
      if (["AUTHORISED", "SUBMITTED"].includes(inv.status)) map[cid].outstanding += Number(inv.amount_due);
      const d = inv.invoice_date;
      if (d && (!map[cid].firstInvoice || d < map[cid].firstInvoice!)) map[cid].firstInvoice = d;
    });
    return map;
  }, [xeroInvoices]);

  const activeIds = new Set(clients.filter(c => c.client_status === "active").map(c => c.id));
  const cancelledIds = new Set(clients.filter(c => c.client_status === "cancelled").map(c => c.id));
  const revenueFromActive = paidInvoices.filter(i => i.client_id && activeIds.has(i.client_id)).reduce((s, i) => s + Number(i.total_amount), 0);
  const revenueFromCancelled = paidInvoices.filter(i => i.client_id && cancelledIds.has(i.client_id)).reduce((s, i) => s + Number(i.total_amount), 0);
  const avgRevenuePerClient = active > 0 ? revenueFromActive / active : 0;

  // Risk indicators
  const sixMonthsAgo = subMonths(new Date(), 6);
  const overdueClients = useMemo(() => {
    const ids = new Set<string>();
    xeroInvoices.forEach(inv => {
      if (inv.client_id && (inv.status === "OVERDUE" || (["AUTHORISED", "SUBMITTED"].includes(inv.status) && inv.due_date && new Date(inv.due_date) < new Date()))) {
        ids.add(inv.client_id);
      }
    });
    return ids;
  }, [xeroInvoices]);

  const unpaidClients = useMemo(() => {
    const ids = new Set<string>();
    xeroInvoices.forEach(inv => {
      if (inv.client_id && ["AUTHORISED", "SUBMITTED"].includes(inv.status)) ids.add(inv.client_id);
    });
    return ids;
  }, [xeroInvoices]);

  const inactiveClients = useMemo(() => {
    return clients.filter(c => {
      const rev = clientRevenue[c.id];
      if (!rev) return true;
      const lastDate = rev.firstInvoice; // approx
      if (!lastDate) return true;
      // Check if newest invoice is older than 6 months
      const invoices = xeroInvoices.filter(i => i.client_id === c.id);
      const dates = invoices.map(i => new Date(i.invoice_date || "")).filter(d => !isNaN(d.getTime()));
      if (dates.length === 0) return true;
      const newest = new Date(Math.max(...dates.map(d => d.getTime())));
      return newest < sixMonthsAgo;
    }).filter(c => c.client_status === "active");
  }, [clients, xeroInvoices, clientRevenue, sixMonthsAgo]);

  // Top clients with outstanding
  const topOutstanding = useMemo(() => {
    return clients
      .map(c => ({ ...c, outstanding: clientRevenue[c.id]?.outstanding || 0 }))
      .filter(c => c.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 10);
  }, [clients, clientRevenue]);

  // Salesperson stats
  const salespersonStats = useMemo(() => {
    const map: Record<string, { total: number; active: number; cancelled: number; revenue: number; outstanding: number }> = {};
    clients.forEach(c => {
      const sp = c.salesperson_owner || "Unassigned";
      if (!map[sp]) map[sp] = { total: 0, active: 0, cancelled: 0, revenue: 0, outstanding: 0 };
      map[sp].total++;
      if (c.client_status === "active") map[sp].active++;
      if (c.client_status === "cancelled") map[sp].cancelled++;
      const rev = clientRevenue[c.id];
      if (rev) {
        map[sp].revenue += rev.revenue;
        map[sp].outstanding += rev.outstanding;
      }
    });
    return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [clients, clientRevenue]);

  // Pie data
  const statusPieData = [
    { name: "Active", value: active, fill: "hsl(152, 60%, 42%)" },
    { name: "Cancelled", value: cancelled, fill: "hsl(0, 72%, 51%)" },
    { name: "Pending", value: pending, fill: "hsl(38, 92%, 50%)" },
  ].filter(d => d.value > 0);

  // Salesperson owner update
  const handleSalespersonChange = async (clientId: string, value: string) => {
    await supabase.from("clients").update({ salesperson_owner: value || null } as any).eq("id", clientId);
    toast.success("Salesperson updated");
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Client Intelligence Dashboard</h1>
        <p className="text-muted-foreground">Advanced client analytics · Accounts only</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Clients", value: totalCount, icon: Users, color: "" },
          { title: "Active", value: active, icon: CheckCircle, color: "text-[hsl(152,60%,42%)]" },
          { title: "Cancelled", value: cancelled, icon: XCircle, color: "text-destructive" },
          { title: "Pending", value: pending, icon: Clock, color: "text-warning" },
        ].map(c => (
          <Card key={c.title} className="rounded-2xl shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color || "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{c.value}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title: "Total Revenue", value: fmt(totalRevenue) },
          { title: "Active Revenue", value: fmt(revenueFromActive) },
          { title: "Cancelled Revenue", value: fmt(revenueFromCancelled) },
          { title: "Avg / Client", value: fmt(avgRevenuePerClient) },
          { title: "Overdue Clients", value: String(overdueClients.size), alert: overdueClients.size > 0 },
        ].map(c => (
          <Card key={c.title} className={`rounded-2xl shadow-elevated ${c.alert ? "border-destructive/30" : ""}`}>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">{c.title}</CardTitle></CardHeader>
            <CardContent><p className={`text-lg font-bold ${c.alert ? "text-destructive" : ""}`}>{c.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-1" /> Overview</TabsTrigger>
          <TabsTrigger value="risk"><ShieldAlert className="h-4 w-4 mr-1" /> Risk Alerts</TabsTrigger>
          <TabsTrigger value="salesperson"><UserCheck className="h-4 w-4 mr-1" /> By Salesperson</TabsTrigger>
          <TabsTrigger value="clients"><Users className="h-4 w-4 mr-1" /> Client List</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Active vs Cancelled</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                {statusPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {statusPieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-muted-foreground">No data</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Monthly Revenue Trend</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                {monthlyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-muted-foreground">No revenue data</div>}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Top 10 Clients by Revenue</CardTitle></CardHeader>
              <CardContent>
                {revenueByClient.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>#</TableHead><TableHead>Client</TableHead><TableHead className="text-right">Revenue</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {revenueByClient.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="text-right font-semibold">{fmt(c.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-muted-foreground text-center py-6">No data</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Risk Alerts */}
        <TabsContent value="risk">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Clients with Overdue Invoices ({overdueClients.size})</CardTitle></CardHeader>
              <CardContent>
                {overdueClients.size > 0 ? (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Client</TableHead><TableHead>Company</TableHead><TableHead>Status</TableHead><TableHead>Salesperson</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {clients.filter(c => overdueClients.has(c.id)).map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.contact_name}</TableCell>
                          <TableCell>{c.company_name || "—"}</TableCell>
                          <TableCell><Badge variant={c.client_status === "active" ? "default" : "secondary"}>{c.client_status}</Badge></TableCell>
                          <TableCell>{c.salesperson_owner || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-muted-foreground text-center py-6">No overdue clients 🎉</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-warning" /> Clients with Outstanding Invoices ({unpaidClients.size})</CardTitle></CardHeader>
              <CardContent>
                {topOutstanding.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Client</TableHead><TableHead>Company</TableHead><TableHead className="text-right">Outstanding</TableHead><TableHead>Status</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {topOutstanding.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.contact_name}</TableCell>
                          <TableCell>{c.company_name || "—"}</TableCell>
                          <TableCell className="text-right font-semibold text-destructive">{fmt(c.outstanding)}</TableCell>
                          <TableCell><Badge variant={c.client_status === "active" ? "default" : "secondary"}>{c.client_status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-muted-foreground text-center py-6">No outstanding balances</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="h-4 w-4 text-warning" /> Inactive Clients (No invoices in 6+ months) ({inactiveClients.length})</CardTitle></CardHeader>
              <CardContent>
                {inactiveClients.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Client</TableHead><TableHead>Company</TableHead><TableHead>Salesperson</TableHead><TableHead>Status</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {inactiveClients.slice(0, 20).map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.contact_name}</TableCell>
                          <TableCell>{c.company_name || "—"}</TableCell>
                          <TableCell>{c.salesperson_owner || "—"}</TableCell>
                          <TableCell><Badge variant="default">{c.client_status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-muted-foreground text-center py-6">All active clients have recent activity</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* By Salesperson */}
        <TabsContent value="salesperson">
          <div className="space-y-4">
            {salespersonStats.map(([sp, stats]) => (
              <Card key={sp} className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="h-4 w-4" /> {sp}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Total Clients</span><p className="text-lg font-bold">{stats.total}</p></div>
                    <div><span className="text-muted-foreground">Active</span><p className="text-lg font-bold text-[hsl(152,60%,42%)]">{stats.active}</p></div>
                    <div><span className="text-muted-foreground">Cancelled</span><p className="text-lg font-bold text-destructive">{stats.cancelled}</p></div>
                    <div><span className="text-muted-foreground">Revenue</span><p className="text-lg font-bold">{fmt(stats.revenue)}</p></div>
                    <div><span className="text-muted-foreground">Outstanding</span><p className="text-lg font-bold">{fmt(stats.outstanding)}</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {salespersonStats.length === 0 && (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No salesperson data. Assign salespersons to clients to see breakdown.</CardContent></Card>
            )}
          </div>
        </TabsContent>

        {/* Client List with Filters */}
        <TabsContent value="clients">
          <div className="flex gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search clients..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 rounded-xl" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 rounded-xl"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
              <SelectTrigger className="w-40 rounded-xl"><UserCheck className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Salespersons</SelectItem>
                {salespersons.map(sp => <SelectItem key={sp} value={sp}>{sp}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Salesperson</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Invoices</TableHead>
                    <TableHead>Client Since</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No clients match your filters</TableCell></TableRow>
                    ) : filtered.slice(0, 100).map(c => {
                      const rev = clientRevenue[c.id];
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.contact_name}</TableCell>
                          <TableCell>{c.company_name || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={c.client_status === "active" ? "default" : c.client_status === "cancelled" ? "destructive" : "secondary"} className="text-xs">
                              {c.client_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              defaultValue={c.salesperson_owner || ""}
                              placeholder="Assign..."
                              className="h-7 w-28 text-xs"
                              onBlur={e => {
                                if (e.target.value !== (c.salesperson_owner || "")) {
                                  handleSalespersonChange(c.id, e.target.value);
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">{fmt(rev?.revenue || 0)}</TableCell>
                          <TableCell className={`text-right ${(rev?.outstanding || 0) > 0 ? "text-destructive font-medium" : ""}`}>
                            {fmt(rev?.outstanding || 0)}
                          </TableCell>
                          <TableCell className="text-center">{rev?.invoiceCount || 0}</TableCell>
                          <TableCell className="text-sm">{c.client_start_date || rev?.firstInvoice || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {filtered.length > 100 && (
                <p className="text-center text-xs text-muted-foreground py-2">Showing first 100 of {filtered.length} results</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientIntelligenceDashboardPage;
