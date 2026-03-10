import { useFinanceDashboard } from "@/hooks/useFinanceDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Clock, FileText, BarChart3, PieChart, RefreshCw, Plus, Wallet,
  Building2, Users, ArrowUpRight, ArrowDownRight, Calendar, Brain, Link, Unlink, Zap
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { useState, useCallback } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const COLORS = [
  "hsl(252, 85%, 60%)", "hsl(199, 89%, 48%)", "hsl(152, 60%, 42%)",
  "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(280, 65%, 60%)",
  "hsl(170, 60%, 45%)", "hsl(30, 80%, 55%)"
];

const fmt = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const FinanceDashboardPage = () => {
  const { profile } = useAuth();
  const {
    loading, xeroInvoices, xeroPayments, expenses, billingSchedules,
    xeroConnection, syncLogs,
    totalRevenue, totalExpenses, grossProfit, profitMargin,
    paidInvoices, overdueInvoices, outstandingInvoices, totalOutstanding, avgInvoiceValue,
    monthlyRevenue, revenueByDepartment, revenueByClient,
    mrr, arr, activeSchedules, revenueGrowth,
    addExpense, addBillingSchedule, departments, refresh,
  } = useFinanceDashboard();

  const [expenseForm, setExpenseForm] = useState({ category: "", department: "", description: "", amount: "", expense_date: format(new Date(), "yyyy-MM-dd") });
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [forecasting, setForecasting] = useState(false);
  const [forecast, setForecast] = useState<any>(null);

  const handleAddExpense = async () => {
    if (!expenseForm.category || !expenseForm.amount) return;
    await addExpense({
      category: expenseForm.category,
      department: expenseForm.department || undefined,
      description: expenseForm.description || undefined,
      amount: parseFloat(expenseForm.amount),
      expense_date: expenseForm.expense_date,
    } as any);
    setExpenseForm({ category: "", department: "", description: "", amount: "", expense_date: format(new Date(), "yyyy-MM-dd") });
    setExpenseOpen(false);
  };

  const handleXeroSync = useCallback(async () => {
    if (!profile?.business_id) return;
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("xero-sync", {
        body: { action: "sync", business_id: profile.business_id },
      });
      if (error) throw error;
      toast.success(`Synced: ${data.contactsSynced} contacts, ${data.invoicesSynced} invoices, ${data.paymentsSynced} payments`);
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [profile?.business_id, refresh]);

  const handleConnectXero = useCallback(() => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const redirectUri = `${window.location.origin}/finance`;
    const clientId = "YOUR_XERO_CLIENT_ID"; // Will be replaced after secrets are configured
    const scopes = "openid profile email accounting.transactions accounting.contacts offline_access";
    const authUrl = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    window.open(authUrl, "_blank", "width=600,height=700");
  }, []);

  const handleRunForecast = useCallback(async () => {
    if (!profile?.business_id) return;
    setForecasting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("ai-finance-forecast", {
        body: { business_id: profile.business_id },
      });
      if (error) throw error;
      setForecast(data.forecast);
      toast.success("Forecast generated successfully");
    } catch (e: any) {
      toast.error(e.message || "Forecast failed");
    } finally {
      setForecasting(false);
    }
  }, [profile?.business_id]);

  const statCards = [
    { title: "Total Revenue", value: fmt(totalRevenue), icon: DollarSign, sub: "From paid invoices", trend: revenueGrowth },
    { title: "Outstanding", value: fmt(totalOutstanding), icon: Clock, sub: `${outstandingInvoices.length} invoices` },
    { title: "Overdue", value: String(overdueInvoices.length), icon: AlertTriangle, sub: "Need attention", alert: overdueInvoices.length > 0 },
    { title: "Gross Profit", value: fmt(grossProfit), icon: TrendingUp, sub: `${profitMargin.toFixed(1)}% margin` },
    { title: "MRR", value: fmt(mrr), icon: RefreshCw, sub: `ARR: ${fmt(arr)}` },
    { title: "Avg Invoice", value: fmt(avgInvoiceValue), icon: FileText, sub: `${paidInvoices.length} paid` },
    { title: "Total Expenses", value: fmt(totalExpenses), icon: Wallet, sub: `${expenses.length} entries` },
    { title: "Revenue Growth", value: `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}%`, icon: revenueGrowth >= 0 ? ArrowUpRight : ArrowDownRight, sub: "Month-over-month" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Finance Intelligence</h1>
          <p className="text-muted-foreground">Agency financial analytics · Read-only from Xero</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {xeroConnection?.is_connected ? (
            <>
              <Badge variant="outline" className="text-[hsl(var(--success))] border-[hsl(var(--success))]">
                <CheckCircle className="h-3 w-3 mr-1" /> Xero Connected
              </Badge>
              <Button variant="outline" size="sm" onClick={handleXeroSync} disabled={syncing}>
                <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Syncing…" : "Sync Now"}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={handleConnectXero}>
              <Link className="h-4 w-4 mr-1" /> Connect Xero
            </Button>
          )}
          {xeroConnection?.last_sync_at && (
            <span className="text-xs text-muted-foreground">
              Last sync: {format(new Date(xeroConnection.last_sync_at), "dd MMM HH:mm")}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <Card key={card.title} className={`hover:shadow-md transition-shadow ${card.alert ? "border-[hsl(var(--destructive))]/30" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.alert ? "text-[hsl(var(--destructive))]" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-24" /> : (
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold">{card.value}</p>
                  {card.trend !== undefined && (
                    <span className={`text-xs font-medium ${card.trend >= 0 ? "text-[hsl(var(--success))]" : "text-[hsl(var(--destructive))]"}`}>
                      {card.trend >= 0 ? "↑" : "↓"} {Math.abs(card.trend).toFixed(1)}%
                    </span>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-1" /> Overview</TabsTrigger>
          <TabsTrigger value="department"><Building2 className="h-4 w-4 mr-1" /> By Department</TabsTrigger>
          <TabsTrigger value="clients"><Users className="h-4 w-4 mr-1" /> By Client</TabsTrigger>
          <TabsTrigger value="invoices"><FileText className="h-4 w-4 mr-1" /> Invoices</TabsTrigger>
          <TabsTrigger value="expenses"><Wallet className="h-4 w-4 mr-1" /> Expenses</TabsTrigger>
          <TabsTrigger value="recurring"><RefreshCw className="h-4 w-4 mr-1" /> Recurring</TabsTrigger>
          <TabsTrigger value="profit"><PieChart className="h-4 w-4 mr-1" /> Profit</TabsTrigger>
          <TabsTrigger value="forecast"><Brain className="h-4 w-4 mr-1" /> AI Forecast</TabsTrigger>
          <TabsTrigger value="sync"><Zap className="h-4 w-4 mr-1" /> Sync Logs</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Monthly Revenue</CardTitle></CardHeader>
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
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No revenue data yet. Connect Xero to sync invoices.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Revenue by Department</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                {revenueByDepartment.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={revenueByDepartment} dataKey="revenue" nameKey="department" cx="50%" cy="50%" outerRadius={100} label={({ department, percent }) => `${department} ${(percent * 100).toFixed(0)}%`}>
                        {revenueByDepartment.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Assign department categories to invoices for breakdown.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Department */}
        <TabsContent value="department">
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue by Department</CardTitle></CardHeader>
            <CardContent>
              {revenueByDepartment.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={revenueByDepartment} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="department" type="category" width={140} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No department data available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients */}
        <TabsContent value="clients">
          <Card>
            <CardHeader><CardTitle className="text-base">Top 10 Clients by Revenue</CardTitle></CardHeader>
            <CardContent>
              {revenueByClient.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByClient.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(c.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No client revenue data yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader><CardTitle className="text-base">Xero Invoices ({xeroInvoices.length})</CardTitle></CardHeader>
            <CardContent>
              {xeroInvoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Department</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {xeroInvoices.slice(0, 50).map(inv => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-sm">{inv.invoice_number || "—"}</TableCell>
                          <TableCell>{inv.contact_name || "—"}</TableCell>
                          <TableCell className="text-sm">{inv.invoice_date ? format(new Date(inv.invoice_date), "dd MMM yyyy") : "—"}</TableCell>
                          <TableCell className="text-sm">{inv.due_date ? format(new Date(inv.due_date), "dd MMM yyyy") : "—"}</TableCell>
                          <TableCell className="text-right font-medium">{fmt(Number(inv.total_amount))}</TableCell>
                          <TableCell className="text-right">{fmt(Number(inv.amount_due))}</TableCell>
                          <TableCell>
                            <Badge variant={inv.status === "PAID" ? "default" : inv.status === "OVERDUE" ? "destructive" : "secondary"} className="text-xs">
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{inv.department_category || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No invoices synced yet. Connect Xero to begin.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Agency Expenses</CardTitle>
              <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Expense</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Select value={expenseForm.category} onValueChange={v => setExpenseForm(p => ({ ...p, category: v }))}>
                      <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        {["salary", "rent", "software", "marketing", "utilities", "contractor", "other"].map(c => (
                          <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={expenseForm.department} onValueChange={v => setExpenseForm(p => ({ ...p, department: v }))}>
                      <SelectTrigger><SelectValue placeholder="Department (optional)" /></SelectTrigger>
                      <SelectContent>
                        {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Description" value={expenseForm.description} onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))} />
                    <Input type="number" placeholder="Amount" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} />
                    <Input type="date" value={expenseForm.expense_date} onChange={e => setExpenseForm(p => ({ ...p, expense_date: e.target.value }))} />
                    <Button onClick={handleAddExpense} className="w-full">Save Expense</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {expenses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="text-sm">{format(new Date(e.expense_date), "dd MMM yyyy")}</TableCell>
                        <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                        <TableCell className="text-sm">{e.department || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.description || "—"}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(Number(e.amount))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No expenses recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recurring */}
        <TabsContent value="recurring">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">MRR</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{fmt(mrr)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">ARR</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{fmt(arr)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Subscriptions</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{activeSchedules.length}</p></CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Billing Schedules</CardTitle></CardHeader>
            <CardContent>
              {billingSchedules.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Cycle</TableHead>
                      <TableHead className="text-right">Fee</TableHead>
                      <TableHead>Next Billing</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingSchedules.map(bs => (
                      <TableRow key={bs.id}>
                        <TableCell className="font-medium">{bs.service_type}</TableCell>
                        <TableCell className="capitalize">{bs.billing_cycle}</TableCell>
                        <TableCell className="text-right">{fmt(Number(bs.monthly_fee))}</TableCell>
                        <TableCell className="text-sm">{bs.next_billing_date ? format(new Date(bs.next_billing_date), "dd MMM yyyy") : "—"}</TableCell>
                        <TableCell>
                          <Badge variant={bs.is_active ? "default" : "secondary"}>{bs.is_active ? "Active" : "Inactive"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No billing schedules set up.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit */}
        <TabsContent value="profit">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Revenue vs Costs</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: "Revenue", value: totalRevenue }, { name: "Expenses", value: totalExpenses }, { name: "Profit", value: grossProfit }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      <Cell fill="hsl(var(--primary))" />
                      <Cell fill="hsl(var(--destructive))" />
                      <Cell fill="hsl(var(--success, 152 60% 42%))" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Profitability Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Gross Revenue</span>
                  <span className="font-semibold text-lg">{fmt(totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Operational Costs</span>
                  <span className="font-semibold text-lg text-[hsl(var(--destructive))]">-{fmt(totalExpenses)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Net Profit</span>
                  <span className={`font-bold text-xl ${grossProfit >= 0 ? "text-[hsl(152,60%,42%)]" : "text-[hsl(var(--destructive))]"}`}>{fmt(grossProfit)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Profit Margin</span>
                  <span className={`font-bold text-xl ${profitMargin >= 0 ? "text-[hsl(152,60%,42%)]" : "text-[hsl(var(--destructive))]"}`}>{profitMargin.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Forecast */}
        <TabsContent value="forecast">
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">AI Financial Forecasting</CardTitle>
                <Button size="sm" onClick={handleRunForecast} disabled={forecasting}>
                  <Brain className={`h-4 w-4 mr-1 ${forecasting ? "animate-pulse" : ""}`} />
                  {forecasting ? "Analyzing…" : "Generate Forecast"}
                </Button>
              </CardHeader>
              <CardContent>
                {forecast ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">3-Month Forecast</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{fmt(forecast.forecast_3m || 0)}</p></CardContent>
                      </Card>
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">6-Month Forecast</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{fmt(forecast.forecast_6m || 0)}</p></CardContent>
                      </Card>
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">12-Month Forecast</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{fmt(forecast.forecast_12m || 0)}</p></CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Projected MRR (3m)</CardTitle></CardHeader>
                        <CardContent><p className="text-xl font-bold">{fmt(forecast.projected_mrr_3m || 0)}</p></CardContent>
                      </Card>
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Projected Clients (3m)</CardTitle></CardHeader>
                        <CardContent><p className="text-xl font-bold">{forecast.projected_client_count_3m || 0}</p></CardContent>
                      </Card>
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Growth Trend</CardTitle></CardHeader>
                        <CardContent>
                          <Badge variant={forecast.growth_trend === "increasing" ? "default" : forecast.growth_trend === "declining" ? "destructive" : "secondary"} className="text-sm">
                            {forecast.growth_trend === "increasing" ? "↑" : forecast.growth_trend === "declining" ? "↓" : "→"} {forecast.growth_trend || "N/A"}
                          </Badge>
                          {forecast.confidence_score && (
                            <p className="text-xs text-muted-foreground mt-1">Confidence: {forecast.confidence_score}%</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {forecast.department_forecasts && Object.keys(forecast.department_forecasts).length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="text-sm">Department Revenue Forecasts (3m)</CardTitle></CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.entries(forecast.department_forecasts).map(([dept, val]: [string, any]) => (
                              <div key={dept} className="p-3 rounded-lg bg-muted/30 border border-border">
                                <p className="text-xs text-muted-foreground">{dept}</p>
                                <p className="text-lg font-semibold">{fmt(val)}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {(forecast.risk_factors?.length > 0 || forecast.opportunities?.length > 0) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {forecast.risk_factors?.length > 0 && (
                          <Card className="border-[hsl(var(--destructive))]/20">
                            <CardHeader><CardTitle className="text-sm text-[hsl(var(--destructive))]">⚠ Risk Factors</CardTitle></CardHeader>
                            <CardContent>
                              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                {forecast.risk_factors.map((r: string, i: number) => <li key={i}>{r}</li>)}
                              </ul>
                            </CardContent>
                          </Card>
                        )}
                        {forecast.opportunities?.length > 0 && (
                          <Card className="border-[hsl(152,60%,42%)]/20">
                            <CardHeader><CardTitle className="text-sm text-[hsl(152,60%,42%)]">✦ Opportunities</CardTitle></CardHeader>
                            <CardContent>
                              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                {forecast.opportunities.map((o: string, i: number) => <li key={i}>{o}</li>)}
                              </ul>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">AI Financial Forecasting</p>
                    <p className="text-sm mb-4">Analyze historical invoice data to forecast revenue, recurring revenue, department growth, and client trends.</p>
                    <Button onClick={handleRunForecast} disabled={forecasting}>
                      {forecasting ? "Analyzing…" : "Generate Forecast"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sync Logs */}
        <TabsContent value="sync">
          <Card>
            <CardHeader><CardTitle className="text-base">Xero Sync Logs</CardTitle></CardHeader>
            <CardContent>
              {syncLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">{log.created_at ? format(new Date(log.created_at), "dd MMM yyyy HH:mm") : "—"}</TableCell>
                        <TableCell className="capitalize">{log.sync_type || "full"}</TableCell>
                        <TableCell>
                          <Badge variant={log.status === "success" ? "default" : log.status === "partial" ? "secondary" : "destructive"}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.records_synced || 0}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{log.error_message || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No sync logs yet. Connect Xero and run a sync.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceDashboardPage;
