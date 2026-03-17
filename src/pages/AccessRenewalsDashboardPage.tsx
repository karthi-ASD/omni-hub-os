import { useState, useMemo } from "react";
import { useAccessRenewalsDashboard, CredentialExpiry } from "@/hooks/useAccessRenewalsDashboard";
import { usePageTitle } from "@/hooks/usePageTitle";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, CheckCircle, Clock, Server, Globe, Layout,
  Shield, RefreshCw, ExternalLink,
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";

const typeIcons: Record<string, React.ElementType> = {
  hosting: Server,
  domain: Globe,
  website: Layout,
};

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  expiring_soon: "bg-warning/10 text-warning",
  expired: "bg-destructive/10 text-destructive",
  suspended: "bg-muted text-muted-foreground",
};

const AccessRenewalsDashboardPage = () => {
  usePageTitle("Access Renewals Dashboard");
  const { credentials, reminderLogs, loading, refresh } = useAccessRenewalsDashboard();
  const navigate = useNavigate();

  const expired = useMemo(() => credentials.filter(c => c.status === "expired"), [credentials]);
  const expiringSoon = useMemo(() => credentials.filter(c => c.status === "expiring_soon"), [credentials]);
  const active = useMemo(() => credentials.filter(c => c.status === "active"), [credentials]);

  const CredentialTable = ({ items }: { items: CredentialExpiry[] }) => (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Days Left</TableHead>
            <TableHead>Auto-Renew</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                No items found
              </TableCell>
            </TableRow>
          ) : (
            items.map((c) => {
              const daysLeft = differenceInDays(new Date(c.expiry_date), new Date());
              const Icon = typeIcons[c.credential_type] || Globe;
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.client_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="capitalize">{c.credential_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>{c.provider_name || "—"}</TableCell>
                  <TableCell>{c.domain_name || "—"}</TableCell>
                  <TableCell>{format(new Date(c.expiry_date), "dd MMM yyyy")}</TableCell>
                  <TableCell>
                    <span className={daysLeft <= 0 ? "text-destructive font-bold" : daysLeft <= 30 ? "text-warning font-medium" : ""}>
                      {daysLeft <= 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.auto_renew_status === "on" ? "default" : "outline"} className="text-xs">
                      {c.auto_renew_status === "on" ? "On" : c.auto_renew_status === "off" ? "Off" : "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[c.status] || ""}`}>
                      {c.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1"
                      onClick={() => navigate(`/clients/${c.client_id}/access`)}>
                      <ExternalLink className="h-3 w-3" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Access & Credential Renewals" subtitle="Track domain, hosting, and website credential expiry across all clients" />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={refresh}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expired.length}</p>
              <p className="text-sm text-muted-foreground">Expired</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expiringSoon.length}</p>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{active.length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reminderLogs.length}</p>
              <p className="text-sm text-muted-foreground">Reminders Sent</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expired">
        <TabsList>
          <TabsTrigger value="expired">Expired ({expired.length})</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon ({expiringSoon.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="all">All ({credentials.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="expired"><CredentialTable items={expired} /></TabsContent>
        <TabsContent value="expiring"><CredentialTable items={expiringSoon} /></TabsContent>
        <TabsContent value="active"><CredentialTable items={active} /></TabsContent>
        <TabsContent value="all"><CredentialTable items={credentials} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AccessRenewalsDashboardPage;
