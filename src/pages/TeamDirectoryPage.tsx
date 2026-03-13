import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, ArrowLeft, Users, Building2, Phone, Mail } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string | null;
  designation: string | null;
  department_id: string | null;
  employment_status: string;
  profile_photo_url: string | null;
  departments: { name: string } | null;
}

interface Department {
  id: string;
  name: string;
  count: number;
}

export default function TeamDirectoryPage() {
  usePageTitle("Team Directory");
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const fetchData = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("hr_employees")
      .select("id, full_name, email, mobile_number, designation, department_id, employment_status, profile_photo_url, departments(name)")
      .eq("business_id", profile.business_id)
      .eq("employment_status", "active")
      .order("full_name");
    const emps = (data ?? []) as Employee[];
    setEmployees(emps);

    // Build department list from employees
    const deptMap = new Map<string, Department>();
    emps.forEach((e) => {
      const dId = e.department_id || "unassigned";
      const dName = e.departments?.name || "Unassigned";
      const existing = deptMap.get(dId);
      if (existing) {
        existing.count++;
      } else {
        deptMap.set(dId, { id: dId, name: dName, count: 1 });
      }
    });
    setDepartments(Array.from(deptMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredEmployees = employees.filter((e) => {
    if (selectedDept && (e.department_id || "unassigned") !== selectedDept) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.full_name.toLowerCase().includes(q) ||
        (e.designation?.toLowerCase().includes(q)) ||
        (e.departments?.name?.toLowerCase().includes(q)) ||
        e.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const DEPT_COLORS = [
    "bg-blue-500/10 text-blue-700 border-blue-200",
    "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    "bg-violet-500/10 text-violet-700 border-violet-200",
    "bg-amber-500/10 text-amber-700 border-amber-200",
    "bg-rose-500/10 text-rose-700 border-rose-200",
    "bg-cyan-500/10 text-cyan-700 border-cyan-200",
    "bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-200",
    "bg-lime-500/10 text-lime-700 border-lime-200",
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {selectedDept && (
            <Button variant="ghost" size="icon" onClick={() => setSelectedDept(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {selectedDept
                ? departments.find((d) => d.id === selectedDept)?.name || "Team"
                : "Team Directory"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {selectedDept
                ? `${filteredEmployees.length} team members`
                : `${employees.length} team members across ${departments.length} departments`}
            </p>
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, role, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Department Cards (when no dept selected and no search) */}
      {!selectedDept && !search && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {departments.map((dept, i) => (
            <Card
              key={dept.id}
              className={`cursor-pointer hover:shadow-md transition-all border ${DEPT_COLORS[i % DEPT_COLORS.length]}`}
              onClick={() => setSelectedDept(dept.id)}
            >
              <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                <div className="h-12 w-12 rounded-xl bg-background/80 flex items-center justify-center">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-sm">{dept.name}</h3>
                <div className="flex items-center gap-1 text-xs opacity-80">
                  <Users className="h-3 w-3" />
                  <span>{dept.count} {dept.count === 1 ? "member" : "members"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Employee Grid */}
      {(selectedDept || search) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No team members found.
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <Card
                key={emp.id}
                className="hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setSelectedEmployee(emp)}
              >
                <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <Avatar className="h-20 w-20 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                    <AvatarImage src={emp.profile_photo_url || undefined} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">
                      {initials(emp.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 min-w-0 w-full">
                    <h3 className="font-semibold text-sm truncate">{emp.full_name}</h3>
                    {emp.designation && (
                      <p className="text-xs text-muted-foreground truncate">{emp.designation}</p>
                    )}
                    <Badge variant="secondary" className="text-[10px]">
                      {emp.departments?.name || "Unassigned"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    {emp.mobile_number && (
                      <a
                        href={`tel:${emp.mobile_number}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-primary transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                    <a
                      href={`mailto:${emp.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-primary transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* All employees when no dept and no search — show all */}
      {!selectedDept && !search && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">All Team Members</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {employees.map((emp) => (
              <Card
                key={emp.id}
                className="hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setSelectedEmployee(emp)}
              >
                <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <Avatar className="h-20 w-20 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                    <AvatarImage src={emp.profile_photo_url || undefined} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">
                      {initials(emp.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 min-w-0 w-full">
                    <h3 className="font-semibold text-sm truncate">{emp.full_name}</h3>
                    {emp.designation && (
                      <p className="text-xs text-muted-foreground truncate">{emp.designation}</p>
                    )}
                    <Badge variant="secondary" className="text-[10px]">
                      {emp.departments?.name || "Unassigned"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    {emp.mobile_number && (
                      <a
                        href={`tel:${emp.mobile_number}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-primary transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                    <a
                      href={`mailto:${emp.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-primary transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Employee Detail Sheet */}
      <Sheet open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <SheetContent className="sm:max-w-md">
          {selectedEmployee && (
            <>
              <SheetHeader>
                <SheetTitle>Team Member</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col items-center gap-4">
                <Avatar className="h-28 w-28 ring-4 ring-border">
                  <AvatarImage src={selectedEmployee.profile_photo_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                    {initials(selectedEmployee.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-foreground">{selectedEmployee.full_name}</h2>
                  {selectedEmployee.designation && (
                    <p className="text-sm text-muted-foreground">{selectedEmployee.designation}</p>
                  )}
                  <Badge variant="secondary">{selectedEmployee.departments?.name || "Unassigned"}</Badge>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a href={`mailto:${selectedEmployee.email}`} className="text-sm font-medium text-foreground hover:text-primary truncate block">
                      {selectedEmployee.email}
                    </a>
                  </div>
                </div>
                {selectedEmployee.mobile_number && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <a href={`tel:${selectedEmployee.mobile_number}`} className="text-sm font-medium text-foreground hover:text-primary">
                        {selectedEmployee.mobile_number}
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="text-sm font-medium text-foreground">{selectedEmployee.departments?.name || "Unassigned"}</p>
                  </div>
                </div>
                {selectedEmployee.designation && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Role</p>
                      <p className="text-sm font-medium text-foreground">{selectedEmployee.designation}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
