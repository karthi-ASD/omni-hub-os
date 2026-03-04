import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const TasksPage = () => {
  // Placeholder until tasks hook is connected
  const mockTasks = [
    { id: "1", title: "Follow up with John Smith", status: "pending", priority: "high", due: "Today" },
    { id: "2", title: "Prepare proposal for ABC Corp", status: "in_progress", priority: "medium", due: "Tomorrow" },
    { id: "3", title: "Review contract amendments", status: "pending", priority: "low", due: "Mar 7" },
    { id: "4", title: "Send invoice to Client X", status: "completed", priority: "medium", due: "Completed" },
  ];

  const statusIcon: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4 text-amber-500" />,
    in_progress: <AlertCircle className="h-4 w-4 text-blue-500" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  };

  const priorityColor: Record<string, string> = {
    high: "border-l-destructive",
    medium: "border-l-warning",
    low: "border-l-muted-foreground",
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" /> Tasks
        </h1>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="rounded-xl">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-amber-500">{mockTasks.filter(t => t.status === "pending").length}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Pending</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-blue-500">{mockTasks.filter(t => t.status === "in_progress").length}</p>
            <p className="text-[10px] text-muted-foreground font-medium">In Progress</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-green-500">{mockTasks.filter(t => t.status === "completed").length}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Done</p>
          </CardContent>
        </Card>
      </div>

      {/* Task cards */}
      <div className="space-y-2">
        {mockTasks.map(task => (
          <Card key={task.id} className={`rounded-xl border-l-4 ${priorityColor[task.priority]}`}>
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
