import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHRTasks } from "@/hooks/useHRTasks";
import { ClipboardList } from "lucide-react";
import { format } from "date-fns";

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  medium: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  overdue: "bg-destructive/10 text-destructive border-destructive/30",
};

export function TasksTab() {
  const { tasks, loading } = useHRTasks();

  const pending = tasks.filter((t: any) => t.status === "pending").length;
  const inProgress = tasks.filter((t: any) => t.status === "in_progress").length;
  const completed = tasks.filter((t: any) => t.status === "completed").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", value: pending, color: "text-amber-500" },
          { label: "In Progress", value: inProgress, color: "text-blue-500" },
          { label: "Completed", value: completed, color: "text-emerald-500" },
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
                <TableHead className="text-xs">Task</TableHead>
                <TableHead className="text-xs">Assigned To</TableHead>
                <TableHead className="text-xs">Department</TableHead>
                <TableHead className="text-xs">Priority</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">Loading...</TableCell></TableRow>
              ) : tasks.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />No tasks
                </TableCell></TableRow>
              ) : tasks.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs font-medium max-w-[200px] truncate">{t.title}</TableCell>
                  <TableCell className="text-xs">{t.hr_employees?.full_name || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.departments?.name || "—"}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] border ${PRIORITY_COLORS[t.priority] || ""}`}>{t.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] border ${STATUS_COLORS[t.status] || ""}`}>{(t.status || "").replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.due_date ? format(new Date(t.due_date), "dd MMM yyyy") : "—"}
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
