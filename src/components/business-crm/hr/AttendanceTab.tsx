import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAttendance, useCheckins } from "@/hooks/useWorkforce";
import { Clock, CalendarCheck, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function AttendanceTab() {
  const { records, loading } = useAttendance();
  const { checkin } = useCheckins();

  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecords = records.filter((r: any) => r.date === todayStr);
  const presentToday = todayRecords.filter((r: any) => r.status === "present").length;
  const absentToday = todayRecords.filter((r: any) => r.status === "absent").length;

  const handleCheckin = async (type: "in" | "out") => {
    await checkin(type);
    toast.success(`Checked ${type} successfully`);
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-3 flex-1 mr-4">
          {[
            { label: "Present Today", value: presentToday, color: "text-emerald-500" },
            { label: "Absent Today", value: absentToday, color: "text-destructive" },
            { label: "Total Records", value: records.length, color: "text-primary" },
          ].map(k => (
            <Card key={k.label} className="rounded-xl border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-[10px] text-muted-foreground">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleCheckin("in")}>
            <LogIn className="h-3.5 w-3.5" /> Check In
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleCheckin("out")}>
            <LogOut className="h-3.5 w-3.5" /> Check Out
          </Button>
        </div>
      </div>

      {/* Records Table */}
      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Check In</TableHead>
                <TableHead className="text-xs">Check Out</TableHead>
                <TableHead className="text-xs">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">Loading...</TableCell></TableRow>
              ) : records.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">No attendance records</TableCell></TableRow>
              ) : records.slice(0, 50).map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-medium">{r.date ? format(new Date(r.date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "present" ? "default" : "destructive"} className="text-[10px]">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.check_in_time || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.check_out_time || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.total_hours ? `${r.total_hours}h` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
