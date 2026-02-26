import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

const TasksPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold">Tasks</h1>
      <p className="text-muted-foreground">Manage and track team tasks</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Task Board</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-12">Task management module coming soon.</p>
      </CardContent>
    </Card>
  </div>
);

export default TasksPage;
