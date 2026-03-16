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
import { DollarSign, Users, TrendingUp, CreditCard, BarChart3, UserCheck, CalendarClock, AlertTriangle, Clock } from "lucide-react";

const fmt = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const cycleLabelMap: Record<string, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  half_yearly: "Half Yearly",
  yearly: "Yearly",
  one_time: "One-Time",
};

const statusBadge = (status: string) => {
  switch (status) {
    case "paid": return <Badge className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">Paid</Badge>;
    case "overdue": return <Badge variant="destructive">Overdue</Badge>;
    default: return <Badge variant="secondary">Pending</Badge>;
  }
};

const RecurringRevenueDashboardPage = () => {
  usePageTitle("Recurring Revenue");
  const {
    services, recurringServices, loading,
    monthlyRevenue, yearlyRevenue,
    mrrByPaymentMethod, revenueByService, agentPerformance,
    paymentsDueToday, pendingThisMonth, overduePayments,
    renewalsToday, renewalsThisWeek, renewalsThisMonth,
  } = useRecurringRevenue();

  const [serviceFilter, setServiceFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [renewalFilter, setRenewalFilter] = useState<"today" | "week" | "month">("month");

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
    const toMonthly = (amt: number, cycle: string) => {
      switch (cycle) {
        case "weekly": return amt * 4.33;
        case "fortnightly": return amt * 2.17;
        case "monthly": return amt;
        case "quarterly": return amt / 3;
        case "half_yearly": return amt / 6;
        case "yearly": return amt / 12;
        default: return 0;
      }
    };
    return filteredRecurring.filter((s) => s.service_status === "active").reduce((sum, s) => sum + toMonthly(s.price_amount, s.billing_cycle), 0);
  }, [filteredRecurring]);

  const uniqueClients = useMemo(() => new Set(filteredRecurring.map((s) => s.client_id)).size, [filteredRecurring]);

  const renewalsList = renewalFilter === "today" ? renewalsToday : renewalFilter === "week" ? renewalsThisWeek : renewalsThisMonth;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader icon={TrendingUp} title="Recurring Revenue" subtitle="Track MRR, payments due, renewals, and agent performance" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Monthly Recurring Revenue" value={fmt(monthlyRevenue)} subtitle="All active recurring" icon={DollarSign} gradient="from-primary to-accent" loading={loading} />
        <StatCard title="Yearly Revenue" value={fmt(yearlyRevenue)} subtitle="Annualized MRR" icon={TrendingUp} gradient="from-[hsl(var(--neon-green))] to-[hsl(var(--success))]" loading={loading} />
        <StatCard title="Payments Due Today" value={paymentsDueToday.length} subtitle={fmt(paymentsDueToday.reduce((s, p) => s + p.price_amount, 0))} icon={CalendarClock} gradient="from-[hsl(var(--neon-blue))] to-[hsl(var(--info))]" loading={loading} />
        <StatCard title="Overdue Payments" value={overduePayments.length} subtitle={fmt(overduePayments.reduce((s, p) => s + p.price_amount, 0))} icon={AlertTriangle} gradient="from-destructive to-destructive/70" loading={loading} />
        <StatCard title="Pending This Month" value={pendingThisMonth.length} subtitle={fmt(pendingThisMonth.reduce((s, p) => s + p.price_amount, 0))} icon={Clock} gradient="from-[hsl(var(--warning))] to-[hsl(var(--neon-orange))]" loading={loading} />
        <StatCard title="Recurring Clients" value={new Set(recurringServices.map((s) => s.client_id)).size} subtitle="Unique clients" icon={Users} gradient="from-[hsl(var(--neon-purple))] to-primary" loading={loading} />
        <StatCard title="Total Services" value={services.length} subtitle="All services" icon={BarChart3} gradient="from-muted-foreground to-muted-foreground/70" loading={loading} />
        <StatCard title="Sales Agents" value={agentPerformance.length} subtitle="With active clients" icon={UserCheck} gradient="from-accent to-primary" loading={loading} />
      </div>

      <Tabs defaultValue="due-today" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="due-today">Due Today</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="renewals">Renewals</TabsTrigger>
          <TabsTrigger value="revenue">Revenue by Payment</TabsTrigger>
          <TabsTrigger value="services">Revenue by Service</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="recurring">All Recurring</TabsTrigger>
        </TabsList>

        {/* Payments Due Today */}
        <TabsContent value="due-today">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Payments Due Today</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Sales Agent</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsDueToday.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payments due today</TableCell></TableRow>
                  ) : paymentsDueToday.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.client_name}</TableCell>
                      <TableCell>{s.service_name || s.service_type}</TableCell>
                      <TableCell className="font-semibold">{fmt(s.price_amount)}</TableCell>
                      <TableCell>{s.salesperson_owner || "—"}</TableCell>
                      <TableCell><Badge variant={s.payment_method === "credit_card" ? "default" : "secondary"}>{s.payment_method === "credit_card" ? "Credit Card" : "EFT"}</Badge></TableCell>
                      <TableCell>{statusBadge(s.payment_status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Payments */}
        <TabsContent value="overdue">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Overdue Payments</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Sales Agent</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overduePayments.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No overdue payments</TableCell></TableRow>
                  ) : overduePayments.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.client_name}</TableCell>
                      <TableCell>{s.service_name || s.service_type}</TableCell>
                      <TableCell className="font-semibold">{fmt(s.price_amount)}</TableCell>
                      <TableCell>{s.next_billing_date || "—"}</TableCell>
                      <TableCell>{s.salesperson_owner || "—"}</TableCell>
                      <TableCell>{statusBadge(s.payment_status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Renewals */}
        <TabsContent value="renewals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Renewal Tracking</CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant={renewalFilter === "today" ? "default" : "outline"} className="cursor-pointer" onClick={() => setRenewalFilter("today")}>Today ({renewalsToday.length})</Badge>
                <Badge variant={renewalFilter === "week" ? "default" : "outline"} className="cursor-pointer" onClick={() => setRenewalFilter("week")}>This Week ({renewalsThisWeek.length})</Badge>
                <Badge variant={renewalFilter === "month" ? "default" : "outline"} className="cursor-pointer" onClick={() => setRenewalFilter("month")}>This Month ({renewalsThisMonth.length})</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Renewal Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Sales Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renewalsList.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No renewals in this period</TableCell></TableRow>
                  ) : renewalsList.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.client_name}</TableCell>
                      <TableCell>{s.service_name || s.service_type}</TableCell>
                      <TableCell>{s.renewal_date}</TableCell>
                      <TableCell className="font-semibold">{fmt(s.price_amount)}</TableCell>
                      <TableCell><Badge variant="outline">{cycleLabelMap[s.billing_cycle] || s.billing_cycle}</Badge></TableCell>
                      <TableCell>{s.salesperson_owner || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

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
                  ) : revenueByService.map((row) => (
                    <TableRow key={row.service}>
                      <TableCell>{row.service}</TableCell>
                      <TableCell>{row.customers}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(row.revenue)}</TableCell>
                    </TableRow>
                  ))}
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
                    <TableHead className="text-right">Monthly Recurring Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentPerformance.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No agent data</TableCell></TableRow>
                  ) : agentPerformance.map((agent) => (
                    <TableRow key={agent.agentId}>
                      <TableCell className="font-medium">{agent.agentName}</TableCell>
                      <TableCell>{agent.totalClients}</TableCell>
                      <TableCell>{agent.servicesCount}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(agent.recurringRevenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Recurring Clients with Filters */}
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
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="fortnightly">Fortnightly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="half_yearly">Half Yearly</SelectItem>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Next Billing</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecurring.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No recurring services found</TableCell></TableRow>
                    ) : filteredRecurring.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.client_name}</TableCell>
                        <TableCell>{s.service_name || s.service_type}</TableCell>
                        <TableCell><Badge variant="outline">{cycleLabelMap[s.billing_cycle] || s.billing_cycle}</Badge></TableCell>
                        <TableCell><Badge variant={s.payment_method === "credit_card" ? "default" : "secondary"}>{s.payment_method === "credit_card" ? "Card" : "EFT"}</Badge></TableCell>
                        <TableCell>{statusBadge(s.payment_status)}</TableCell>
                        <TableCell>{s.next_billing_date || "—"}</TableCell>
                        <TableCell>{s.salesperson_owner || "—"}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(s.price_amount)}</TableCell>
                      </TableRow>
                    ))}
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
