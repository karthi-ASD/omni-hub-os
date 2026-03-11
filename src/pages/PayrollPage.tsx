import { useSalaryProfiles, usePayslips } from "@/hooks/usePayroll";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, FileText } from "lucide-react";

const PayrollPage = () => {
  const { salaries, loading: salLoading } = useSalaryProfiles();
  const { payslips, loading: payLoading } = usePayslips();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Payroll & Payslips" subtitle="Salary records and payslip vault" icon={DollarSign} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Salary Profiles" value={salaries.length} icon={DollarSign} gradient="from-primary to-accent" loading={salLoading} />
        <StatCard label="Payslips Generated" value={payslips.length} icon={FileText} gradient="from-success to-emerald-500" loading={payLoading} />
      </div>

      <Tabs defaultValue="salaries">
        <TabsList>
          <TabsTrigger value="salaries"><DollarSign className="h-4 w-4 mr-1" /> Salaries</TabsTrigger>
          <TabsTrigger value="payslips"><FileText className="h-4 w-4 mr-1" /> Payslips</TabsTrigger>
        </TabsList>

        <TabsContent value="salaries">
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Frequency</TableHead><TableHead>Base Salary</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                <TableBody>
                  {salLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : salaries.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No salary profiles</TableCell></TableRow>
                  ) : salaries.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="capitalize">{s.pay_frequency}</TableCell>
                      <TableCell>${Number(s.base_salary).toLocaleString()}</TableCell>
                      <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payslips">
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Gross</TableHead><TableHead>Net</TableHead><TableHead>Generated</TableHead></TableRow></TableHeader>
                <TableBody>
                  {payLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : payslips.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No payslips</TableCell></TableRow>
                  ) : payslips.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.period_month}</TableCell>
                      <TableCell>${Number(p.gross_amount).toLocaleString()}</TableCell>
                      <TableCell>${Number(p.net_amount).toLocaleString()}</TableCell>
                      <TableCell>{new Date(p.generated_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PayrollPage;
