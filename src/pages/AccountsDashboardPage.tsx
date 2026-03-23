import React, { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminCommunicationDashboard } from "@/components/crm/AdminCommunicationDashboard";
import { CallbacksPanel } from "@/components/crm/CallbacksPanel";
import { useClients } from "@/hooks/useClients";
import { useInvoices } from "@/hooks/useInvoices";
import { usePayments } from "@/hooks/usePayments";
import { useRenewalReminders } from "@/hooks/useRenewalReminders";
import { useSalesCommissions } from "@/hooks/useSalesCommissions";
import { useClientRiskAlerts } from "@/hooks/useClientRiskAlerts";
import { useRevenueForecasting } from "@/hooks/useRevenueForecasting";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  DollarSign, Receipt, AlertTriangle, CalendarCheck, Users, TrendingUp,
  ShieldAlert, Heart, MapPin, BarChart3, CheckCircle, Clock,
} from "lucide-react";
import { format, isPast, isFuture } from "date-fns";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const AccountsDashboardPage = () => {
  usePageTitle("Accounts Dashboard");
  const { profile, roles } = useAuth();
  const businessId = profile?.business_id;
  const { clients } = useClients();
  const { invoices } = useInvoices();
  const { payments } = usePayments();
  const { reminders } = useRenewalReminders();
  const { commissions, pendingTotal, approvedTotal, approveCommission } = useSalesCommissions();
  const { unresolvedAlerts, criticalAlerts } = useClientRiskAlerts();
  const forecast = useRevenueForecasting();

  const overdueInvoices = useMemo(
    () =>
      (invoices as any[]).filter(
        (i) =>
          (i.status === "sent" || i.status === "pending") &&
          i.due_date &&
          isPast(new Date(i.due_date))
      ),
    [invoices]
  );

  const upcomingRenewals = useMemo(
    () => reminders.filter((r) => r.status === "pending" && isFuture(new Date(r.reminder_date))).slice(0, 8),
    [reminders]
  );

  const paymentHoldClients = useMemo(
    () => clients.filter((c: any) => c.seo_payment_hold),
    [clients]
  );

  console.log("ROLE:", { roles, screen: "accounts-dashboard" });
  console.log("businessId:", businessId);
  console.log("Rendering Communication", businessId);

  return (
    <div className="space-y-6">
      <PageHeader title="Accounts Dashboard" subtitle="Financial control center — billing, renewals, commissions & risk management" />

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        <StatCard title="Active Clients" value={forecast.totalActiveClients} icon={Users} />
        <StatCard title="MRR" value={`$${Math.round(forecast.mrr).toLocaleString()}`} icon={TrendingUp} />
        <StatCard title="Total Revenue" value={`$${forecast.totalRevenue.toLocaleString()}`} icon={DollarSign} />
        <StatCard title="Outstanding" value={`$${Math.round(forecast.outstandingPayments).toLocaleString()}`} icon={Receipt} />
        <StatCard title="Overdue" value={overdueInvoices.length} icon={AlertTriangle} alert />
        <StatCard title="Risk Alerts" value={criticalAlerts.length} icon={ShieldAlert} alert={criticalAlerts.length > 0} />
        <StatCard title="Pending Comm." value={`$${Math.round(pendingTotal).toLocaleString()}`} icon={DollarSign} />
        <StatCard title="Payment Holds" value={paymentHoldClients.length} icon={ShieldAlert} alert={paymentHoldClients.length > 0} />
      </div>

      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
          <TabsTrigger value="renewals">Renewals ({upcomingRenewals.length})</TabsTrigger>
          <TabsTrigger value="risk">Risk Alerts ({unresolvedAlerts.length})</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="health">Client Health</TabsTrigger>
          <TabsTrigger value="states">State Insights</TabsTrigger>
          <TabsTrigger value="communications">Communication</TabsTrigger>
          <TabsTrigger value="callbacks">Callbacks</TabsTrigger>
        </TabsList>

        {/* Revenue Forecast Tab */}
        <TabsContent value="forecast">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Renewal Revenue (30 days)</p>
                <p className="text-2xl font-bold">${forecast.renewal30.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Renewal Revenue (60 days)</p>
                <p className="text-2xl font-bold">${forecast.renewal60.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Renewal Revenue (90 days)</p>
                <p className="text-2xl font-bold">${forecast.renewal90.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Revenue by Service</CardTitle></CardHeader>
              <CardContent>
                {Object.entries(forecast.revenueByService).sort((a, b) => b[1] - a[1]).map(([svc, val]) => (
                  <div key={svc} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{svc}</span>
                    <span className="text-sm font-semibold">${val.toLocaleString()}</span>
                  </div>
                ))}
                {Object.keys(forecast.revenueByService).length === 0 && (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Churn Risk Distribution</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Low Risk</span>
                  <Badge variant="outline">{forecast.churnRisk.low}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Medium Risk</span>
                  <Badge variant="secondary">{forecast.churnRisk.medium}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">High Risk</span>
                  <Badge variant="destructive">{forecast.churnRisk.high}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Renewals Tab */}
        <TabsContent value="renewals">
          <Card>
            <CardContent className="pt-6">
              {upcomingRenewals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No upcoming renewals</p>
              ) : (
                <div className="space-y-3">
                  {upcomingRenewals.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{r.client_name}</p>
                        <p className="text-xs text-muted-foreground">{r.service_category || "General"} · {r.reminder_type.replace(/_/g, " ")}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{format(new Date(r.reminder_date), "dd MMM yyyy")}</Badge>
                        {r.contract_value ? <p className="text-xs font-medium mt-1">${r.contract_value.toLocaleString()}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Alerts Tab */}
        <TabsContent value="risk">
          <Card>
            <CardContent className="pt-6">
              {unresolvedAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-10 w-10 mx-auto text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">No active risk alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unresolvedAlerts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-destructive/20">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={a.severity === "high" || a.severity === "critical" ? "destructive" : "secondary"}>
                            {a.severity}
                          </Badge>
                          <span className="text-sm font-medium">{a.alert_type}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "dd MMM")}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Pending Commissions</p>
                <p className="text-2xl font-bold">${Math.round(pendingTotal).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Approved Commissions</p>
                <p className="text-2xl font-bold">${Math.round(approvedTotal).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{commissions.length}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sales Rep</TableHead>
                      <TableHead>Deal Value</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.slice(0, 20).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.sales_rep_name || "—"}</TableCell>
                        <TableCell>${c.deal_value.toLocaleString()}</TableCell>
                        <TableCell>{c.commission_rate}%</TableCell>
                        <TableCell className="font-semibold">${c.commission_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={c.status === "approved" ? "default" : "secondary"}>{c.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {c.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => approveCommission(c.id)}>Approve</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {commissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No commissions recorded</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Health Tab */}
        <TabsContent value="health">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Heart className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{forecast.healthDist.excellent}</p>
                <p className="text-xs text-muted-foreground">Excellent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Heart className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{forecast.healthDist.healthy}</p>
                <p className="text-xs text-muted-foreground">Healthy</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto text-accent mb-2" />
                <p className="text-2xl font-bold">{forecast.healthDist.needs_attention}</p>
                <p className="text-xs text-muted-foreground">Needs Attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <ShieldAlert className="h-8 w-8 mx-auto text-destructive mb-2" />
                <p className="text-2xl font-bold">{forecast.healthDist.critical}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Churn Risk</TableHead>
                      <TableHead>Renewal Prob.</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>SEO Hold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients
                      .filter((c: any) => c.health_score === "critical" || c.health_score === "needs_attention" || c.churn_risk === "high")
                      .slice(0, 20)
                      .map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.contact_name}</TableCell>
                          <TableCell>
                            <Badge variant={c.health_score === "critical" ? "destructive" : "secondary"}>{c.health_score}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={c.churn_risk === "high" ? "destructive" : "outline"}>{c.churn_risk}</Badge>
                          </TableCell>
                          <TableCell>{c.renewal_probability}</TableCell>
                          <TableCell>{c.payment_status || "current"}</TableCell>
                          <TableCell>{c.seo_payment_hold ? <Badge variant="destructive">Hold</Badge> : "—"}</TableCell>
                        </TableRow>
                      ))}
                    {clients.filter((c: any) => c.health_score === "critical" || c.health_score === "needs_attention" || c.churn_risk === "high").length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No at-risk clients</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* State Insights Tab */}
        <TabsContent value="states">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Clients by State</CardTitle></CardHeader>
              <CardContent>
                {Object.entries(forecast.clientsByState).sort((a, b) => b[1] - a[1]).map(([state, count]) => (
                  <div key={state} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{state}</span>
                    <Badge variant="outline">{count} clients</Badge>
                  </div>
                ))}
                {Object.keys(forecast.clientsByState).length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" /> Revenue by State</CardTitle></CardHeader>
              <CardContent>
                {Object.entries(forecast.revenueByState).sort((a, b) => b[1] - a[1]).map(([state, val]) => (
                  <div key={state} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{state}</span>
                    <span className="text-sm font-semibold">${val.toLocaleString()}</span>
                  </div>
                ))}
                {Object.keys(forecast.revenueByState).length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="communications">
          {businessId && <AdminCommunicationDashboard businessId={businessId} />}
        </TabsContent>

        <TabsContent value="callbacks">
          {businessId && <CallbacksPanel businessId={businessId} showAllStatuses />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountsDashboardPage;
