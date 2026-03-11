import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

const TasksPage = () => {
  const mockTasks = [
    { id: "1", title: "Follow up with John Smith", status: "pending", priority: "high", due: "Today" },
    { id: "2", title: "Prepare proposal for ABC Corp", status: "in_progress", priority: "medium", due: "Tomorrow" },
    { id: "3", title: "Review contract amendments", status: "pending", priority: "low", due: "Mar 7" },
    { id: "4", title: "Send invoice to Client X", status: "completed", priority: "medium", due: "Completed" },
  ];

  const statusIcon: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4 text-warning" />,
    in_progress: <AlertCircle className="h-4 w-4 text-primary" />,
    completed: <CheckCircle2 className="h-4 w-4 text-success" />,
  };

  const priorityColor: Record<string, string> = {
    high: "border-l-destructive",
    medium: "border-l-warning",
    low: "border-l-muted-foreground",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Tasks" subtitle="Manage and track your tasks" icon={ClipboardList} />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pending" value={mockTasks.filter(t => t.status === "pending").length} icon={Clock} gradient="from-warning to-neon-orange" />
        <StatCard label="In Progress" value={mockTasks.filter(t => t.status === "in_progress").length} icon={AlertCircle} gradient="from-primary to-accent" />
        <StatCard label="Done" value={mockTasks.filter(t => t.status === "completed").length} icon={CheckCircle2} gradient="from-neon-green to-success" />
      </div>

      <div className="space-y-2">
        {mockTasks.map(task => (
          <Card key={task.id} className={`rounded-2xl border-0 shadow-elevated border-l-4 ${priorityColor[task.priority]} hover-lift transition-all`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {statusIcon[task.status]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.due}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-4">
        Task management with full CRUD coming soon.
      </p>
    </div>
  );
};

export default TasksPage;
