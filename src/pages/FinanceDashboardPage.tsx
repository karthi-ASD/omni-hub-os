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
  Building2, Users, ArrowUpRight, ArrowDownRight, Calendar
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { useState } from "react";
import { format } from "date-fns";

const COLORS = [
  "hsl(252, 85%, 60%)", "hsl(199, 89%, 48%)", "hsl(152, 60%, 42%)",
  "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(280, 65%, 60%)",
  "hsl(170, 60%, 45%)", "hsl(30, 80%, 55%)"
];

const fmt = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const FinanceDashboardPage = () => {
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
        <div className="flex gap-2 items-center">
          {xeroConnection?.is_connected ? (
            <Badge variant="outline" className="text-[hsl(var(--success))] border-[hsl(var(--success))]">
              <CheckCircle className="h-3 w-3 mr-1" /> Xero Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" /> Xero Not Connected
            </Badge>
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
                      <Cell fill="hsl(var(--success))" />
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
                  <span className={`font-bold text-xl ${grossProfit >= 0 ? "text-[hsl(var(--success))]" : "text-[hsl(var(--destructive))]"}`}>{fmt(grossProfit)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Profit Margin</span>
                  <span className={`font-bold text-xl ${profitMargin >= 0 ? "text-[hsl(var(--success))]" : "text-[hsl(var(--destructive))]"}`}>{profitMargin.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceDashboardPage;
