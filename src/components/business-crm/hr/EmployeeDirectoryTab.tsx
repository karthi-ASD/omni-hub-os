import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Mail, Phone, Building2 } from "lucide-react";
import { AddEmployeeDialog } from "./AddEmployeeDialog";
import { format } from "date-fns";

interface Props {
  employees: any[];
  departments: any[];
  loading: boolean;
  onCreate: (v: Record<string, any>) => Promise<void>;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  on_leave: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  terminated: "bg-destructive/10 text-destructive border-destructive/30",
  probation: "bg-blue-500/10 text-blue-600 border-blue-500/30",
};

export function EmployeeDirectoryTab({ employees, departments, loading, onCreate }: Props) {
  const [search, setSearch] = useState("");

  const filtered = employees.filter((e: any) =>
    !search || e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.designation?.toLowerCase().includes(search.toLowerCase())
  );

  const active = employees.filter((e: any) => e.employment_status === "active").length;
  const onLeave = employees.filter((e: any) => e.employment_status === "on_leave").length;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Employees", value: employees.length, color: "text-primary" },
          { label: "Active", value: active, color: "text-emerald-500" },
          { label: "On Leave", value: onLeave, color: "text-amber-500" },
          { label: "Departments", value: departments.length, color: "text-blue-500" },
        ].map(k => (
          <Card key={k.label} className="rounded-xl border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-xs" />
        </div>
        <AddEmployeeDialog departments={departments} onSubmit={onCreate} />
      </div>

      {/* Table */}
      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Employee</TableHead>
                <TableHead className="text-xs">Role</TableHead>
                <TableHead className="text-xs">Department</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Contact</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">No employees found</TableCell></TableRow>
              ) : filtered.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">{e.employee_code}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-foreground">{e.designation || "—"}</TableCell>
                  <TableCell className="text-xs text-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      {e.departments?.name || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] capitalize">{(e.employment_type || "").replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail className="h-2.5 w-2.5" />{e.email}</p>
                      {e.mobile_number && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{e.mobile_number}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] border ${STATUS_COLORS[e.employment_status] || ""}`}>
                      {(e.employment_status || "").replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {e.joining_date ? format(new Date(e.joining_date), "dd MMM yyyy") : "—"}
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
