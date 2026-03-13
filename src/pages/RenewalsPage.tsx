import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRenewalReminders } from "@/hooks/useRenewalReminders";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CalendarCheck, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { format, isPast, isFuture, addDays } from "date-fns";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RenewalsPage = () => {
  usePageTitle("Renewals");
  const { reminders, loading, updateStatus } = useRenewalReminders();

  const upcoming = useMemo(
    () => reminders.filter((r) => r.status === "pending" && isFuture(new Date(r.reminder_date))),
    [reminders]
  );
  const overdue = useMemo(
    () => reminders.filter((r) => r.status === "pending" && isPast(new Date(r.reminder_date))),
    [reminders]
  );
  const completed = useMemo(
    () => reminders.filter((r) => r.status === "completed" || r.status === "renewed"),
    [reminders]
  );

  const ReminderTable = ({ items }: { items: typeof reminders }) => (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No reminders found
              </TableCell>
            </TableRow>
          ) : (
            items.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.client_name}</TableCell>
                <TableCell>{r.service_category || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{r.reminder_type.replace(/_/g, " ")}</Badge>
                </TableCell>
                <TableCell>{format(new Date(r.reminder_date), "dd MMM yyyy")}</TableCell>
                <TableCell>${(r.contract_value || 0).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      r.status === "completed" || r.status === "renewed"
                        ? "default"
                        : isPast(new Date(r.reminder_date))
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "renewed")}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Renewed
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(r.id, "dismissed")}>
                        Dismiss
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Renewals" subtitle="Track and manage client contract renewals" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcoming.length}</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overdue.length}</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completed.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overdue">
        <TabsList>
          <TabsTrigger value="overdue">Overdue ({overdue.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="overdue"><ReminderTable items={overdue} /></TabsContent>
        <TabsContent value="upcoming"><ReminderTable items={upcoming} /></TabsContent>
        <TabsContent value="completed"><ReminderTable items={completed} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default RenewalsPage;
