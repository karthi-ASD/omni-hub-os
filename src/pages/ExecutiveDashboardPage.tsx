import React, { useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClients } from "@/hooks/useClients";
import { useInvoices } from "@/hooks/useInvoices";
import { usePayments } from "@/hooks/usePayments";
import { useRenewalReminders } from "@/hooks/useRenewalReminders";
import { useSalesCommissions } from "@/hooks/useSalesCommissions";
import { useClientRiskAlerts } from "@/hooks/useClientRiskAlerts";
import { useRevenueForecasting } from "@/hooks/useRevenueForecasting";
import { useDeals } from "@/hooks/useDeals";
import { useLeads } from "@/hooks/useLeads";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  DollarSign, Users, TrendingUp, ShieldAlert, AlertTriangle,
  CalendarCheck, Target, FolderKanban, MapPin, Heart, BarChart3, Receipt,
} from "lucide-react";
import { isPast, isFuture } from "date-fns";

const ExecutiveDashboardPage = () => {
  usePageTitle("Executive Dashboard");
  const { clients } = useClients();
  const { invoices } = useInvoices();
  const { payments } = usePayments();
  const { reminders } = useRenewalReminders();
  const { commissions } = useSalesCommissions();
  const { criticalAlerts } = useClientRiskAlerts();
  const forecast = useRevenueForecasting();
  const { deals } = useDeals();
  const { leads } = useLeads();

  const totalPaymentsReceived = useMemo(
    () => payments.filter((p) => p.status === "success").reduce((s, p) => s + p.amount, 0),
    [payments]
  );

  const overdueCount = useMemo(
    () => (invoices as any[]).filter(
      (i) => (i.status === "sent" || i.status === "pending") && i.due_date && isPast(new Date(i.due_date))
    ).length,
    [invoices]
  );

  const upcomingRenewals = useMemo(
    () => reminders.filter((r) => r.status === "pending" && isFuture(new Date(r.reminder_date))).length,
    [reminders]
  );

  const pipelineValue = useMemo(
    () => (deals as any[])
      .filter((d) => d.stage !== "won" && d.stage !== "lost")
      .reduce((s, d) => s + Number(d.value || 0), 0),
    [deals]
  );

  const activeLeads = useMemo(
    () => (leads as any[]).filter((l) => l.status === "new" || l.status === "contacted" || l.status === "qualified").length,
    [leads]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Executive Dashboard" subtitle="Complete business health at a glance" icon={BarChart3} />

      {/* Row 1 — Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        <StatCard title="Total Clients" value={clients.length} icon={Users} />
        <StatCard title="Active Clients" value={forecast.totalActiveClients} icon={Users} />
        <StatCard title="Total Revenue" value={`$${totalPaymentsReceived.toLocaleString()}`} icon={DollarSign} />
        <StatCard title="MRR" value={`$${Math.round(forecast.mrr).toLocaleString()}`} icon={TrendingUp} />
        <StatCard title="Pipeline" value={`$${pipelineValue.toLocaleString()}`} icon={FolderKanban} />
        <StatCard title="Active Leads" value={activeLeads} icon={Target} />
        <StatCard title="Renewals" value={upcomingRenewals} icon={CalendarCheck} />
        <StatCard title="Overdue" value={overdueCount} icon={AlertTriangle} alert={overdueCount > 0} />
      </div>

      {/* Row 2 — Financial Health + Pipeline + Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Forecast */}
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue Forecast</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">30 Day Renewals</span>
              <span className="font-semibold">${forecast.renewal30.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">60 Day Renewals</span>
              <span className="font-semibold">${forecast.renewal60.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">90 Day Renewals</span>
              <span className="font-semibold">${forecast.renewal90.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Outstanding Payments</span>
              <span className="font-semibold text-destructive">${Math.round(forecast.outstandingPayments).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Client Health */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Heart className="h-4 w-4" /> Client Health</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Excellent</span>
              <Badge variant="outline">{forecast.healthDist.excellent}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Healthy</span>
              <Badge variant="outline">{forecast.healthDist.healthy}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Needs Attention</span>
              <Badge variant="secondary">{forecast.healthDist.needs_attention}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Critical</span>
              <Badge variant="destructive">{forecast.healthDist.critical}</Badge>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm">Risk Alerts</span>
              <Badge variant="destructive">{criticalAlerts.length}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* State Overview */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Revenue by State</CardTitle></CardHeader>
          <CardContent>
            {Object.entries(forecast.revenueByState)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([state, val]) => (
                <div key={state} className="flex justify-between py-2 border-b last:border-0">
                  <div>
                    <span className="text-sm">{state}</span>
                    <span className="text-xs text-muted-foreground ml-2">({forecast.clientsByState[state] || 0} clients)</span>
                  </div>
                  <span className="text-sm font-semibold">${val.toLocaleString()}</span>
                </div>
              ))}
            {Object.keys(forecast.revenueByState).length === 0 && (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — Churn + Commissions + Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

        <Card>
          <CardHeader><CardTitle className="text-base">Sales Commissions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Records</span>
              <span className="font-semibold">{commissions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pending Payout</span>
              <span className="font-semibold">${Math.round(commissions.filter(c => c.status === "pending").reduce((s, c) => s + c.commission_amount, 0)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Approved</span>
              <span className="font-semibold">${Math.round(commissions.filter(c => c.status === "approved").reduce((s, c) => s + c.commission_amount, 0)).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Revenue by Service</CardTitle></CardHeader>
          <CardContent>
            {Object.entries(forecast.revenueByService)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([svc, val]) => (
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
      </div>
    </div>
  );
};

export default ExecutiveDashboardPage;
