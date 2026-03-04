import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, BarChart3, TrendingUp, FileText, Download, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const reportTypes = [
  { icon: TrendingUp, title: "Revenue Report", desc: "Monthly revenue breakdown & trends", color: "from-[#d4a853] to-[#b8902e]" },
  { icon: BarChart3, title: "Sales Pipeline", desc: "Deal stages & conversion rates", color: "from-[#2563eb] to-[#0ea5e9]" },
  { icon: PieChart, title: "Client Analytics", desc: "Client acquisition & retention", color: "from-[#22c55e] to-[#16a34a]" },
  { icon: FileText, title: "Invoice Summary", desc: "Paid, pending & overdue invoices", color: "from-[#f59e0b] to-[#d97706]" },
  { icon: Calendar, title: "Activity Report", desc: "Team productivity & task completion", color: "from-[#8b5cf6] to-[#7c3aed]" },
  { icon: Download, title: "Export Data", desc: "Download CSV/PDF reports", color: "from-[#ec4899] to-[#db2777]" },
];

const ReportsPage = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a0e1a] via-[#111832] to-[#0a0e1a] border border-[#1e2a4a] p-5">
      <div className="absolute top-0 right-0 h-32 w-32 bg-[#d4a853]/10 rounded-full blur-3xl" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-[#d4a853]" />
          <span className="text-xs text-[#d4a853] font-medium">Business Intelligence</span>
        </div>
        <h1 className="text-xl font-bold text-white">Reports</h1>
        <p className="text-sm text-gray-400 mt-1">Generate insights and analytics reports</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {reportTypes.map((report) => (
        <button
          key={report.title}
          className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-4 text-left hover:border-[#d4a853]/30 transition-all active:bg-[#1e2a4a]"
        >
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${report.color} flex items-center justify-center mb-3`}>
            <report.icon className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-semibold text-sm text-white">{report.title}</h3>
          <p className="text-[11px] text-gray-500 mt-1">{report.desc}</p>
        </button>
      ))}
    </div>

    <Card className="bg-[#111832] border-[#1e2a4a]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-white flex items-center gap-2">
          <PieChart className="h-4 w-4 text-[#d4a853]" /> Report Builder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500 text-sm text-center py-8">
          Advanced report builder with drag-and-drop widgets coming soon.
        </p>
        <Button className="w-full bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold hover:from-[#e0b85e] hover:to-[#c99d3a]" disabled>
          Coming Soon
        </Button>
      </CardContent>
    </Card>
  </div>
);

export default ReportsPage;
