import { useMemo, useState } from "react";
import { useRecurringRevenue } from "@/hooks/useRecurringRevenue";
import { usePageTitle } from "@/hooks/usePageTitle";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, TrendingUp, CreditCard, BarChart3, UserCheck } from "lucide-react";

const fmt = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const RecurringRevenueDashboardPage = () => {
  usePageTitle("Recurring Revenue");
  const {
    services, recurringServices, loading,
    monthlyRevenue, mrrByPaymentMethod, revenueByService, agentPerformance,
  } = useRecurringRevenue();

  const [serviceFilter, setServiceFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");

  const allServiceTypes = useMemo(() => [...new Set(services.map((s) => s.service_type))], [services]);
  const allAgents = useMemo(() => [...new Set(services.map((s) => s.salesperson_owner || "Unassigned"))], [services]);

  const filteredRecurring = useMemo(() => {
    return recurringServices.filter((s) => {
      if (serviceFilter !== "all" && s.service_type !== serviceFilter) return false;
      if (agentFilter !== "all" && (s.salesperson_owner || "Unassigned") !== agentFilter) return false;
      if (paymentFilter !== "all" && s.payment_method !== paymentFilter) return false;
      if (cycleFilter !== "all" && s.billing_cycle !== cycleFilter) return false;
      return true;
    });
  }, [recurringServices, serviceFilter, agentFilter, paymentFilter, cycleFilter]);

  const filteredMRR = useMemo(() => {
    return filteredRecurring.filter((s) => s.service_status === "active").reduce((sum, s) => {
      if (s.billing_cycle === "monthly") return sum + s.price_amount;
      if (s.billing_cycle === "quarterly") return sum + s.price_amount / 3;
      if (s.billing_cycle === "yearly") return sum + s.price_amount / 12;
      return sum;
    }, 0);
  }, [filteredRecurring]);

  const uniqueClients = useMemo(() => new Set(filteredRecurring.map((s) => s.client_id)).size, [filteredRecurring]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader icon={TrendingUp} title="Recurring Revenue" subtitle="Track MRR, service revenue, and agent performance" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Monthly Recurring Revenue" value={fmt(monthlyRevenue)} subtitle="All active recurring" icon={DollarSign} gradient="from-primary to-accent" loading={loading} />
        <StatCard title="Recurring Clients" value={new Set(recurringServices.map((s) => s.client_id)).size} subtitle="Unique clients" icon={Users} gradient="from-[hsl(var(--neon-green))] to-[hsl(var(--success))]" loading={loading} />
        <StatCard title="Total Services" value={services.length} subtitle="All active services" icon={BarChart3} gradient="from-[hsl(var(--neon-blue))] to-[hsl(var(--info))]" loading={loading} />
        <StatCard title="Sales Agents" value={agentPerformance.length} subtitle="With active clients" icon={UserCheck} gradient="from-[hsl(var(--neon-purple))] to-primary" loading={loading} />
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue by Payment</TabsTrigger>
          <TabsTrigger value="services">Revenue by Service</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Clients</TabsTrigger>
        </TabsList>

        {/* Revenue by Payment Method */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> MRR by Payment Method</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Type</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead className="text-right">Monthly Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mrrByPaymentMethod.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No recurring revenue data</TableCell></TableRow>
                  ) : (
                    <>
                      {mrrByPaymentMethod.map((row) => (
                        <TableRow key={row.method}>
                          <TableCell>
                            <Badge variant={row.method === "credit_card" ? "default" : "secondary"}>
                              {row.method === "credit_card" ? "Credit Card" : "EFT (Bank Transfer)"}
                            </Badge>
                          </TableCell>
                          <TableCell>{row.customers}</TableCell>
                          <TableCell className="text-right font-semibold">{fmt(row.revenue)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>Total</TableCell>
                        <TableCell>{mrrByPaymentMethod.reduce((s, r) => s + r.customers, 0)}</TableCell>
                        <TableCell className="text-right">{fmt(monthlyRevenue)}</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue by Service */}
        <TabsContent value="services">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Revenue by Service</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueByService.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No service data</TableCell></TableRow>
                  ) : (
                    revenueByService.map((row) => (
                      <TableRow key={row.service}>
                        <TableCell>{row.service}</TableCell>
                        <TableCell>{row.customers}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(row.revenue)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agent Performance */}
        <TabsContent value="agents">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5" /> Agent Sales Performance</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Clients</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead className="text-right">Recurring Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentPerformance.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No agent data</TableCell></TableRow>
                  ) : (
                    agentPerformance.map((agent) => (
                      <TableRow key={agent.agentId}>
                        <TableCell className="font-medium">{agent.agentName}</TableCell>
                        <TableCell>{agent.totalClients}</TableCell>
                        <TableCell>{agent.servicesCount}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(agent.recurringRevenue)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recurring Clients with Filters */}
        <TabsContent value="recurring">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Clients</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Service" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {allServiceTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={agentFilter} onValueChange={setAgentFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Agent" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {allAgents.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Payment" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="eft">EFT</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={cycleFilter} onValueChange={setCycleFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Cycle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cycles</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <span>Clients: <strong className="text-foreground">{uniqueClients}</strong></span>
                <span>MRR: <strong className="text-foreground">{fmt(filteredMRR)}</strong></span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecurring.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No recurring services found</TableCell></TableRow>
                    ) : (
                      filteredRecurring.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.client_name}</TableCell>
                          <TableCell>{s.service_type}</TableCell>
                          <TableCell><Badge variant="outline">{s.billing_cycle}</Badge></TableCell>
                          <TableCell><Badge variant={s.payment_method === "credit_card" ? "default" : "secondary"}>{s.payment_method === "credit_card" ? "Card" : "EFT"}</Badge></TableCell>
                          <TableCell>{s.salesperson_owner || "—"}</TableCell>
                          <TableCell className="text-right font-semibold">{fmt(s.price_amount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecurringRevenueDashboardPage;
