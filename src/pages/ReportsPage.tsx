import { PieChart, BarChart3, TrendingUp, FileText, Download, Calendar, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

const reportTypes = [
  { icon: TrendingUp, title: "Revenue Report", desc: "Monthly revenue breakdown & trends", gradient: "from-neon-orange to-warning" },
  { icon: BarChart3, title: "Sales Pipeline", desc: "Deal stages & conversion rates", gradient: "from-primary to-accent" },
  { icon: PieChart, title: "Client Analytics", desc: "Client acquisition & retention", gradient: "from-neon-green to-success" },
  { icon: FileText, title: "Invoice Summary", desc: "Paid, pending & overdue invoices", gradient: "from-warning to-neon-orange" },
  { icon: Calendar, title: "Activity Report", desc: "Team productivity & task completion", gradient: "from-neon-purple to-primary" },
  { icon: Download, title: "Export Data", desc: "Download CSV/PDF reports", gradient: "from-neon-pink to-destructive" },
];

const ReportsPage = () => (
  <div className="space-y-6 animate-fade-in">
    <PageHeader
      title="Reports"
      subtitle="Generate insights and analytics reports"
      icon={Sparkles}
      badge="Business Intelligence"
    />

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {reportTypes.map((report) => (
        <Card
          key={report.title}
          className="group rounded-2xl border-0 shadow-elevated hover-lift cursor-pointer transition-all duration-300 overflow-hidden"
        >
          <CardContent className="p-5">
            <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${report.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-glow-sm`}>
              <report.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-sm">{report.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{report.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card className="rounded-2xl border-0 shadow-elevated">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <PieChart className="h-4 w-4 text-primary" /> Report Builder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm text-center py-8">
          Advanced report builder with drag-and-drop widgets coming soon.
        </p>
        <Button className="w-full rounded-xl" disabled>
          Coming Soon
        </Button>
      </CardContent>
    </Card>
  </div>
);

export default ReportsPage;
