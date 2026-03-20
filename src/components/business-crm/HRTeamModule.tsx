import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeProfiles, useAttendance, useCheckins } from "@/hooks/useWorkforce";
import { Users, Clock, CalendarCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function HRTeamModule() {
  const { profile } = useAuth();
  const { employees, loading } = useEmployeeProfiles();
  const { records: attendance } = useAttendance();
  const { checkin } = useCheckins();

  const handleCheckin = async (type: "in" | "out") => {
    await checkin(type);
    toast.success(`Checked ${type} successfully`);
  };

  const activeEmployees = employees.filter((e: any) => e.status === "active");
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAttendance = attendance.filter((a: any) => a.date === todayStr);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">HR & Team Management</h2>
          <p className="text-xs text-muted-foreground">Team overview, attendance, and performance</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleCheckin("in")} className="gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" />Check In
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleCheckin("out")} className="gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" />Check Out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Team Members", value: activeEmployees.length, icon: Users },
          { label: "Total Employees", value: employees.length, icon: UserCheck },
          { label: "Present Today", value: todayAttendance.length, icon: CalendarCheck },
          { label: "Attendance Records", value: attendance.length, icon: Clock },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Team Directory</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading team...</p>
          ) : activeEmployees.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No team members found</p>
          ) : (
            <div className="space-y-2">
              {activeEmployees.slice(0, 15).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border bg-secondary/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">{e.full_name || "Team Member"}</p>
                    <p className="text-xs text-muted-foreground">{e.job_title || "Staff"} • {e.department || "General"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
