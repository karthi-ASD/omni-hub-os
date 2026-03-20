import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHRLeaveRequests } from "@/hooks/useHRLeave";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarOff, Check, X } from "lucide-react";
import { format } from "date-fns";

export function LeaveTab() {
  const { user } = useAuth();
  const { requests, loading, approve, reject } = useHRLeaveRequests();

  const pending = requests.filter((r: any) => r.status === "pending");
  const approved = requests.filter((r: any) => r.status === "approved");

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    rejected: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", value: pending.length, color: "text-amber-500" },
          { label: "Approved", value: approved.length, color: "text-emerald-500" },
          { label: "Total Requests", value: requests.length, color: "text-primary" },
        ].map(k => (
          <Card key={k.label} className="rounded-xl border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Employee</TableHead>
                <TableHead className="text-xs">Department</TableHead>
                <TableHead className="text-xs">Leave Type</TableHead>
                <TableHead className="text-xs">From</TableHead>
                <TableHead className="text-xs">To</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">Loading...</TableCell></TableRow>
              ) : requests.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                  <CalendarOff className="h-8 w-8 mx-auto mb-2 opacity-30" />No leave requests
                </TableCell></TableRow>
              ) : requests.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-medium">{r.hr_employees?.full_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.hr_employees?.departments?.name || "—"}</TableCell>
                  <TableCell className="text-xs">{r.hr_leave_types?.name || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.start_date}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.end_date}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] border ${STATUS_COLORS[r.status] || ""}`}>{r.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {r.status === "pending" && user?.id && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-emerald-500" onClick={() => approve(r.id, user.id)}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => reject(r.id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
