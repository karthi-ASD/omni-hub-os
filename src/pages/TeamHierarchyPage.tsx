import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Employee {
  id: string;
  full_name: string;
  employee_code: string;
  designation: string | null;
  employment_status: string;
  department_id: string | null;
  reporting_manager_id: string | null;
}

interface Department {
  id: string;
  name: string;
}

const TeamHierarchyPage = () => {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.business_id) return;
    Promise.all([
      (supabase.from("hr_employees") as any)
        .select("id, full_name, employee_code, designation, employment_status, department_id, reporting_manager_id")
        .eq("business_id", profile.business_id)
        .eq("employment_status", "active"),
      (supabase.from("departments") as any)
        .select("id, name")
        .eq("business_id", profile.business_id),
    ]).then(([empRes, deptRes]: any[]) => {
      setEmployees(empRes.data ?? []);
      setDepartments(deptRes.data ?? []);
      setLoading(false);
    });
  }, [profile?.business_id]);

  const getDeptName = (id: string | null) => departments.find(d => d.id === id)?.name || "Unassigned";
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  // Group by department
  const deptGroups = departments.map(dept => {
    const deptEmployees = employees.filter(e => e.department_id === dept.id);
    const managers = deptEmployees.filter(e =>
      e.designation?.toLowerCase().includes("manager") ||
      e.designation?.toLowerCase().includes("head") ||
      e.designation?.toLowerCase().includes("lead") ||
      deptEmployees.some(sub => sub.reporting_manager_id === e.id)
    );
    const nonManagers = deptEmployees.filter(e => !managers.includes(e));
    return { dept, managers, nonManagers, all: deptEmployees };
  }).filter(g => g.all.length > 0);

  // Build tree per manager
  const renderManagerTree = (manager: Employee, allInDept: Employee[]) => {
    const reports = allInDept.filter(e => e.reporting_manager_id === manager.id && e.id !== manager.id);
    return (
      <Collapsible key={manager.id} defaultOpen>
        <CollapsibleTrigger className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-1 text-muted-foreground">
            {reports.length > 0 ? <ChevronDown className="h-4 w-4" /> : <div className="w-4" />}
          </div>
          <Avatar className="h-9 w-9 bg-primary/10 border-2 border-primary/30">
            <AvatarFallback className="text-xs font-bold text-primary">{getInitials(manager.full_name)}</AvatarFallback>
          </Avatar>
          <div className="text-left flex-1">
            <p className="font-semibold text-sm">{manager.full_name}</p>
            <p className="text-xs text-muted-foreground">{manager.designation || "Manager"} • {manager.employee_code}</p>
          </div>
          <Badge variant="outline" className="text-xs bg-primary/5">{reports.length} reports</Badge>
        </CollapsibleTrigger>
        {reports.length > 0 && (
          <CollapsibleContent>
            <div className="ml-12 border-l-2 border-muted pl-4 space-y-1 pb-2">
              {reports.map(emp => (
                <div key={emp.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors">
                  <Avatar className="h-7 w-7 bg-muted">
                    <AvatarFallback className="text-[10px]">{getInitials(emp.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{emp.full_name}</p>
                    <p className="text-xs text-muted-foreground">{emp.designation || "Team Member"} • {emp.employee_code}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    );
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Hierarchy</h1>
        <p className="text-muted-foreground">Visual department structure with managers and their teams</p>
      </div>

      {deptGroups.length === 0 && (
        <Card className="glass-card"><CardContent className="py-12 text-center text-muted-foreground">No departments or employees found. Add employees in HR → Employees first.</CardContent></Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {deptGroups.map(({ dept, managers, nonManagers, all }) => (
          <Card key={dept.id} className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                {dept.name}
                <Badge variant="secondary" className="ml-auto">{all.length} members</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {managers.map(mgr => renderManagerTree(mgr, all))}
              {/* Employees without a manager */}
              {nonManagers.filter(e => !e.reporting_manager_id || !employees.find(m => m.id === e.reporting_manager_id)).map(emp => (
                <div key={emp.id} className="flex items-center gap-3 p-2 ml-4 rounded-md hover:bg-muted/30">
                  <Avatar className="h-7 w-7 bg-muted">
                    <AvatarFallback className="text-[10px]">{getInitials(emp.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{emp.full_name}</p>
                    <p className="text-xs text-muted-foreground">{emp.designation || "Team Member"}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TeamHierarchyPage;
