import React, { useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClients } from "@/hooks/useClients";
import { useInvoices } from "@/hooks/useInvoices";
import { usePayments } from "@/hooks/usePayments";
import { useRenewalReminders } from "@/hooks/useRenewalReminders";
import { usePageTitle } from "@/hooks/usePageTitle";
import { DollarSign, Receipt, AlertTriangle, CalendarCheck, Users, TrendingUp } from "lucide-react";
import { format, isPast, isFuture, addDays } from "date-fns";

const AccountsDashboardPage = () => {
  usePageTitle("Accounts Dashboard");
  const { clients } = useClients();
  const { invoices } = useInvoices();
  const { payments } = usePayments();
  const { reminders } = useRenewalReminders();

  const stats = useMemo(() => {
    const activeClients = clients.filter((c) => c.client_status === "active").length;
    const totalRevenue = payments
      .filter((p) => p.status === "success")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingInvoices = (invoices as any[]).filter(
      (i) => i.status === "sent" || i.status === "pending"
    );
    const pendingAmount = pendingInvoices.reduce(
      (sum, i) => sum + (i.total || i.amount || 0),
      0
    );
    const overdueInvoices = (invoices as any[]).filter(
      (i) =>
        (i.status === "sent" || i.status === "pending") &&
        i.due_date &&
        isPast(new Date(i.due_date))
    );
    const overdueAmount = overdueInvoices.reduce(
      (sum, i) => sum + (i.total || i.amount || 0),
      0
    );
    const upcomingRenewals = reminders.filter(
      (r) => r.status === "pending" && isFuture(new Date(r.reminder_date))
    ).length;

    return { activeClients, totalRevenue, pendingAmount, overdueAmount, overdueCount: overdueInvoices.length, upcomingRenewals };
  }, [clients, invoices, payments, reminders]);

  const upcomingRenewalsList = useMemo(
    () =>
      reminders
        .filter((r) => r.status === "pending")
        .slice(0, 10),
    [reminders]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Accounts Dashboard" subtitle="Financial overview, billing, and renewal management" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Active Clients" value={stats.activeClients} icon={Users} />
        <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} />
        <StatCard title="Pending Payments" value={`$${stats.pendingAmount.toLocaleString()}`} icon={Receipt} />
        <StatCard title="Overdue Amount" value={`$${stats.overdueAmount.toLocaleString()}`} icon={AlertTriangle} alert />
        <StatCard title="Overdue Invoices" value={stats.overdueCount} icon={AlertTriangle} alert />
        <StatCard title="Upcoming Renewals" value={stats.upcomingRenewals} icon={CalendarCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Upcoming Renewals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingRenewalsList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming renewals</p>
            ) : (
              <div className="space-y-3">
                {upcomingRenewalsList.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{r.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.service_category || "General"} · {r.reminder_type.replace("_", " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(r.reminder_date), "dd MMM yyyy")}
                      </Badge>
                      {r.contract_value ? (
                        <p className="text-xs font-medium mt-1">${r.contract_value.toLocaleString()}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue by Service Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const categoryCounts: Record<string, { count: number; value: number }> = {};
              clients.forEach((c: any) => {
                const cat = c.service_category || "Uncategorized";
                if (!categoryCounts[cat]) categoryCounts[cat] = { count: 0, value: 0 };
                categoryCounts[cat].count++;
                categoryCounts[cat].value += Number(c.contract_value || 0);
              });
              const entries = Object.entries(categoryCounts).sort((a, b) => b[1].value - a[1].value);
              if (entries.length === 0) return <p className="text-sm text-muted-foreground">No data</p>;
              return (
                <div className="space-y-3">
                  {entries.map(([cat, info]) => (
                    <div key={cat} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{cat}</p>
                        <p className="text-xs text-muted-foreground">{info.count} clients</p>
                      </div>
                      <p className="text-sm font-semibold">${info.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountsDashboardPage;
