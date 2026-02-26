import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "lucide-react";

const ReportsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="text-muted-foreground">Business intelligence and reporting</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5" /> Report Builder</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-12">Reporting module coming soon.</p>
      </CardContent>
    </Card>
  </div>
);

export default ReportsPage;
