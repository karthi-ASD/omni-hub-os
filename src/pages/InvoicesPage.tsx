import { useState } from "react";
import { useInvoices, type Invoice } from "@/hooks/useInvoices";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, ChevronDown, ExternalLink, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  PAID: "bg-green-500/10 text-green-600",
  AUTHORISED: "bg-primary/10 text-primary",
  SUBMITTED: "bg-primary/10 text-primary",
  OVERDUE: "bg-destructive/10 text-destructive",
  VOIDED: "bg-muted text-muted-foreground",
  DRAFT: "bg-muted text-muted-foreground",
  DELETED: "bg-muted text-muted-foreground line-through",
  // Legacy CRM statuses
  draft: "bg-muted text-muted-foreground",
  open: "bg-primary/10 text-primary",
  paid: "bg-green-500/10 text-green-600",
  overdue: "bg-destructive/10 text-destructive",
  void: "bg-muted text-muted-foreground line-through",
};

const InvoicesPage = () => {
  const { profile } = useAuth();
  const [xeroInvoices, setXeroInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const { clients } = useClients();

  // Load Xero invoices
  const fetchXeroInvoices = async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data } = await supabase
      .from("xero_invoices")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("invoice_date", { ascending: false })
      .limit(500);
    setXeroInvoices(data || []);

    // Get last sync time
    const { data: logs } = await supabase
      .from("xero_sync_logs")
      .select("synced_at")
      .eq("business_id", profile.business_id)
      .order("synced_at", { ascending: false })
      .limit(1);
    if (logs && logs.length > 0) {
      setLastSynced((logs[0] as any).synced_at);
    }
    setLoading(false);
  };

  useState(() => { fetchXeroInvoices(); });

  const handleSync = async () => {
    if (!profile?.business_id) return;
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("xero-sync", {
        body: { action: "sync", business_id: profile.business_id },
      });
      if (error) throw error;
      toast.success("Xero sync started");
      setTimeout(() => { fetchXeroInvoices(); setSyncing(false); }, 5000);
    } catch {
      toast.error("Sync failed");
      setSyncing(false);
    }
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "—";
    const c = clients.find((cl) => cl.id === clientId);
    return c?.contact_name || "Unknown";
  };

  const openXeroInvoice = (xeroInvoiceId?: string) => {
    if (xeroInvoiceId) {
      window.open(`https://go.xero.com/AccountsReceivable/View.aspx?invoiceID=${xeroInvoiceId}`, "_blank");
    } else {
      window.open("https://go.xero.com/AccountsReceivable/Edit.aspx", "_blank");
    }
  };

  const totalRevenue = xeroInvoices.filter(i => i.status === "PAID").reduce((s, i) => s + Number(i.total_amount || 0), 0);
  const totalOutstanding = xeroInvoices.filter(i => ["AUTHORISED", "SUBMITTED"].includes(i.status)).reduce((s, i) => s + Number(i.amount_due || 0), 0);
  const overdueCount = xeroInvoices.filter(i => i.status === "OVERDUE" || (["AUTHORISED", "SUBMITTED"].includes(i.status) && i.due_date && new Date(i.due_date) < new Date())).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Invoices"
        subtitle={`${xeroInvoices.length} invoices synced from Xero`}
        icon={FileText}
      >
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} /> Sync Xero
        </Button>
        <Button size="sm" onClick={() => openXeroInvoice()}>
          <ExternalLink className="h-4 w-4 mr-1" /> Create Invoice in Xero
        </Button>
      </PageHeader>

      {/* Sync Status Banner */}
      <Card className="rounded-2xl border-border/50 bg-muted/30">
        <CardContent className="py-3 px-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            {lastSynced
              ? `Last synced: ${format(new Date(lastSynced), "dd MMM yyyy, HH:mm")}`
              : "No sync data available"}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3" />
            All invoices are managed in Xero. CRM is read-only.
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold">{xeroInvoices.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">${totalRevenue.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-bold text-primary">${totalOutstanding.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : xeroInvoices.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No invoices synced from Xero yet.</p>
            <p className="text-sm mt-1">Create invoices in Xero and sync to view them here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-0 shadow-elevated">
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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {xeroInvoices.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">{inv.invoice_number || "—"}</TableCell>
                  <TableCell>{getClientName(inv.client_id)}</TableCell>
                  <TableCell className="text-sm">{inv.invoice_date ? format(new Date(inv.invoice_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell className="text-sm">{inv.due_date ? format(new Date(inv.due_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell className="text-right font-medium">${Number(inv.total_amount || 0).toLocaleString("en-AU", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right">${Number(inv.amount_due || 0).toLocaleString("en-AU", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[inv.status] || "bg-muted text-muted-foreground"} variant="secondary">
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => openXeroInvoice(inv.xero_invoice_id)}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default InvoicesPage;
