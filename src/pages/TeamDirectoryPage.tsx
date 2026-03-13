import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, ArrowLeft, Users, Building2, Phone, Mail, Network,
  Gift, CalendarHeart, Crown, Circle, MessageSquare, UserCheck,
  Activity, Briefcase,
} from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { format, isSameMonth, isSameDay, parseISO, addDays } from "date-fns";

/* ───── types ───── */
interface Employee {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string | null;
  designation: string | null;
  department_id: string | null;
  employment_status: string;
  profile_photo_url: string | null;
  reporting_manager_id: string | null;
  is_department_head: boolean;
  availability_status: string;
  skill_tags: string[];
  date_of_birth: string | null;
  joining_date: string | null;
  departments: { name: string } | null;
}

interface DeptSummary {
  id: string;
  name: string;
  count: number;
  head: Employee | null;
}

/* ───── helpers ───── */
const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const STATUS_DOT: Record<string, string> = {
  online: "bg-emerald-500",
  offline: "bg-muted-foreground/40",
  in_meeting: "bg-amber-500",
  on_leave: "bg-rose-500",
};

const STATUS_LABEL: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  in_meeting: "In Meeting",
  on_leave: "On Leave",
};

const DEPT_COLORS = [
  "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
  "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800",
  "bg-lime-500/10 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-800",
];

/* ───── EmployeeCard ───── */
function EmployeeCard({ emp, onClick }: { emp: Employee; onClick: () => void }) {
  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group" onClick={onClick}>
      <CardContent className="p-5 flex flex-col items-center text-center gap-3">
        <div className="relative">
          <Avatar className="h-20 w-20 ring-2 ring-border group-hover:ring-primary/30 transition-all">
            <AvatarImage src={emp.profile_photo_url || undefined} />
            <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">
              {initials(emp.full_name)}
            </AvatarFallback>
          </Avatar>
          <span
            className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background ${STATUS_DOT[emp.availability_status] || STATUS_DOT.offline}`}
            title={STATUS_LABEL[emp.availability_status] || "Offline"}
          />
        </div>
        <div className="space-y-1 min-w-0 w-full">
          <h3 className="font-semibold text-sm truncate flex items-center justify-center gap-1">
            {emp.full_name}
            {emp.is_department_head && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
          </h3>
          {emp.designation && <p className="text-xs text-muted-foreground truncate">{emp.designation}</p>}
          <Badge variant="secondary" className="text-[10px]">
            {emp.departments?.name || "Unassigned"}
          </Badge>
          {emp.is_department_head && (
            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 dark:text-amber-400 ml-1">
              Dept Head
            </Badge>
          )}
        </div>
        {emp.skill_tags && emp.skill_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center">
            {emp.skill_tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0">{t}</Badge>
            ))}
            {emp.skill_tags.length > 3 && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">+{emp.skill_tags.length - 3}</Badge>
            )}
          </div>
        )}
        <div className="flex items-center gap-3 text-muted-foreground">
          {emp.mobile_number && (
            <a href={`tel:${emp.mobile_number}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary transition-colors" title="Call">
              <Phone className="h-4 w-4" />
            </a>
          )}
          <a href={`mailto:${emp.email}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary transition-colors" title="Email">
            <Mail className="h-4 w-4" />
          </a>
          <button onClick={(e) => e.stopPropagation()} className="hover:text-primary transition-colors" title="Chat (coming soon)">
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───── OrgNode ───── */
function OrgNode({
  emp,
  employees,
  onSelect,
  depth = 0,
}: {
  emp: Employee;
  employees: Employee[];
  onSelect: (e: Employee) => void;
  depth?: number;
}) {
  const reports = employees.filter((e) => e.reporting_manager_id === emp.id);
  return (
    <div className={depth > 0 ? "ml-6 md:ml-10 border-l-2 border-border pl-4 mt-2" : ""}>
      <div
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
        onClick={() => onSelect(emp)}
      >
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={emp.profile_photo_url || undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {initials(emp.full_name)}
            </AvatarFallback>
          </Avatar>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${STATUS_DOT[emp.availability_status] || STATUS_DOT.offline}`}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate flex items-center gap-1">
            {emp.full_name}
            {emp.is_department_head && <Crown className="h-3 w-3 text-amber-500" />}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {emp.designation || "Team Member"} · {emp.departments?.name || "Unassigned"}
          </p>
        </div>
        {reports.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-[10px] shrink-0">
            {reports.length} report{reports.length > 1 ? "s" : ""}
          </Badge>
        )}
      </div>
      {reports.length > 0 && (
        <div>
          {reports.map((r) => (
            <OrgNode key={r.id} emp={r} employees={employees} onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ───── Main Page ───── */
export default function TeamDirectoryPage() {
  usePageTitle("Team Directory");
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterManager, setFilterManager] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("directory");

  const fetchData = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("hr_employees")
      .select("id, full_name, email, mobile_number, designation, department_id, employment_status, profile_photo_url, reporting_manager_id, is_department_head, availability_status, skill_tags, date_of_birth, joining_date, departments(name)")
      .eq("business_id", profile.business_id)
      .eq("employment_status", "active")
      .order("full_name");
    setEmployees((data ?? []) as any as Employee[]);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* derived data */
  const departments = useMemo(() => {
    const map = new Map<string, DeptSummary>();
    employees.forEach((e) => {
      const dId = e.department_id || "unassigned";
      const dName = e.departments?.name || "Unassigned";
      const existing = map.get(dId);
      if (existing) {
        existing.count++;
        if (e.is_department_head) existing.head = e;
      } else {
        map.set(dId, { id: dId, name: dName, count: 1, head: e.is_department_head ? e : null });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const roles = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => { if (e.designation) set.add(e.designation); });
    return Array.from(set).sort();
  }, [employees]);

  const managers = useMemo(() => {
    const ids = new Set(employees.map((e) => e.reporting_manager_id).filter(Boolean));
    return employees.filter((e) => ids.has(e.id));
  }, [employees]);

  const onLeaveCount = employees.filter((e) => e.availability_status === "on_leave").length;

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (selectedDept && (e.department_id || "unassigned") !== selectedDept) return false;
      if (filterRole !== "all" && e.designation !== filterRole) return false;
      if (filterManager !== "all" && e.reporting_manager_id !== filterManager) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.full_name.toLowerCase().includes(q) ||
          (e.designation?.toLowerCase().includes(q)) ||
          (e.departments?.name?.toLowerCase().includes(q)) ||
          e.email.toLowerCase().includes(q) ||
          (e.skill_tags ?? []).some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [employees, selectedDept, filterRole, filterManager, search]);

  /* org chart roots */
  const orgRoots = useMemo(() => {
    const managerIds = new Set(employees.map((e) => e.reporting_manager_id).filter(Boolean));
    return employees.filter((e) => !e.reporting_manager_id || !employees.some((m) => m.id === e.reporting_manager_id));
  }, [employees]);

  /* birthday & anniversary */
  const today = new Date();
  const upcoming = useMemo(() => {
    const birthdays: Employee[] = [];
    const anniversaries: Employee[] = [];
    const next30 = addDays(today, 30);
    employees.forEach((e) => {
      if (e.date_of_birth) {
        try {
          const dob = parseISO(e.date_of_birth);
          const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
          if (thisYear >= today && thisYear <= next30) birthdays.push(e);
        } catch {}
      }
      if (e.joining_date) {
        try {
          const jd = parseISO(e.joining_date);
          if (jd.getFullYear() < today.getFullYear()) {
            const anniv = new Date(today.getFullYear(), jd.getMonth(), jd.getDate());
            if (anniv >= today && anniv <= next30) anniversaries.push(e);
          }
        } catch {}
      }
    });
    return { birthdays, anniversaries };
  }, [employees]);

  const managerName = (id: string | null) => {
    if (!id) return null;
    const m = employees.find((e) => e.id === id);
    return m?.full_name ?? null;
  };

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
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Employees", value: employees.length, icon: Users, color: "text-primary" },
          { label: "Departments", value: departments.length, icon: Building2, color: "text-violet-600 dark:text-violet-400" },
          { label: "Active Now", value: employees.filter((e) => e.availability_status === "online").length, icon: Activity, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "On Leave", value: onLeaveCount, icon: CalendarHeart, color: "text-rose-600 dark:text-rose-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Birthday / Anniversary alerts */}
      {(upcoming.birthdays.length > 0 || upcoming.anniversaries.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {upcoming.birthdays.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-500/10 text-pink-700 dark:text-pink-300 text-xs">
              <Gift className="h-4 w-4" />
              <span>
                🎂 Upcoming birthdays: {upcoming.birthdays.map((e) => e.full_name).join(", ")}
              </span>
            </div>
          )}
          {upcoming.anniversaries.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs">
              <CalendarHeart className="h-4 w-4" />
              <span>
                🎉 Work anniversaries: {upcoming.anniversaries.map((e) => e.full_name).join(", ")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="directory" className="gap-1.5">
              <Users className="h-4 w-4" /> Directory
            </TabsTrigger>
            <TabsTrigger value="org-chart" className="gap-1.5">
              <Network className="h-4 w-4" /> Organization Chart
            </TabsTrigger>
          </TabsList>

          {activeTab === "directory" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search name, role, skill..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-40 h-9"><SelectValue placeholder="All Roles" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterManager} onValueChange={setFilterManager}>
                <SelectTrigger className="w-44 h-9"><SelectValue placeholder="All Managers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Managers</SelectItem>
                  {managers.map((m) => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* ── Directory Tab ── */}
        <TabsContent value="directory" className="mt-6 space-y-6">
          {/* Header with back */}
          {selectedDept && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedDept(null)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> All Departments
              </Button>
              <h2 className="text-lg font-semibold">{departments.find((d) => d.id === selectedDept)?.name}</h2>
            </div>
          )}

          {/* Department cards */}
          {!selectedDept && !search && filterRole === "all" && filterManager === "all" && (
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
                    {dept.head && (
                      <p className="text-[10px] flex items-center gap-1">
                        <Crown className="h-3 w-3 text-amber-500" /> {dept.head.full_name}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs opacity-80">
                      <Users className="h-3 w-3" />
                      <span>{dept.count} {dept.count === 1 ? "member" : "members"}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Employee grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEmployees.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">No team members found.</div>
            ) : (
              (selectedDept || search || filterRole !== "all" || filterManager !== "all"
                ? filteredEmployees
                : employees
              ).map((emp) => (
                <EmployeeCard key={emp.id} emp={emp} onClick={() => setSelectedEmployee(emp)} />
              ))
            )}
          </div>
        </TabsContent>

        {/* ── Org Chart Tab ── */}
        <TabsContent value="org-chart" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" /> Company Hierarchy
              </h2>
              {orgRoots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hierarchy data available. Assign reporting managers to employees to build the org chart.</p>
              ) : (
                <div className="space-y-1">
                  {orgRoots.map((root) => (
                    <OrgNode key={root.id} emp={root} employees={employees} onSelect={setSelectedEmployee} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Employee Detail Sheet */}
      <Sheet open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedEmployee && (
            <>
              <SheetHeader>
                <SheetTitle>Team Member</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-28 w-28 ring-4 ring-border">
                    <AvatarImage src={selectedEmployee.profile_photo_url || undefined} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                      {initials(selectedEmployee.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-background ${STATUS_DOT[selectedEmployee.availability_status] || STATUS_DOT.offline}`}
                  />
                </div>
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-foreground flex items-center justify-center gap-1.5">
                    {selectedEmployee.full_name}
                    {selectedEmployee.is_department_head && <Crown className="h-4 w-4 text-amber-500" />}
                  </h2>
                  {selectedEmployee.designation && (
                    <p className="text-sm text-muted-foreground">{selectedEmployee.designation}</p>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="secondary">{selectedEmployee.departments?.name || "Unassigned"}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      <Circle className={`h-2 w-2 mr-1 fill-current ${STATUS_DOT[selectedEmployee.availability_status]?.replace("bg-", "text-") || "text-muted-foreground"}`} />
                      {STATUS_LABEL[selectedEmployee.availability_status] || "Offline"}
                    </Badge>
                  </div>
                  {selectedEmployee.is_department_head && (
                    <Badge variant="outline" className="border-amber-300 text-amber-600 dark:text-amber-400">
                      Department Head
                    </Badge>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div className="mt-4 flex justify-center gap-2">
                {selectedEmployee.mobile_number && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${selectedEmployee.mobile_number}`}><Phone className="h-4 w-4 mr-1" /> Call</a>
                  </Button>
                )}
                <Button size="sm" variant="outline" asChild>
                  <a href={`mailto:${selectedEmployee.email}`}><Mail className="h-4 w-4 mr-1" /> Email</a>
                </Button>
              </div>

              <div className="mt-6 space-y-3">
                <InfoRow icon={Mail} label="Email" value={selectedEmployee.email} href={`mailto:${selectedEmployee.email}`} />
                {selectedEmployee.mobile_number && (
                  <InfoRow icon={Phone} label="Phone" value={selectedEmployee.mobile_number} href={`tel:${selectedEmployee.mobile_number}`} />
                )}
                <InfoRow icon={Building2} label="Department" value={selectedEmployee.departments?.name || "Unassigned"} />
                {selectedEmployee.designation && (
                  <InfoRow icon={Briefcase} label="Role" value={selectedEmployee.designation} />
                )}
                {managerName(selectedEmployee.reporting_manager_id) && (
                  <InfoRow icon={UserCheck} label="Reports To" value={managerName(selectedEmployee.reporting_manager_id)!} />
                )}
                {selectedEmployee.joining_date && (
                  <InfoRow icon={CalendarHeart} label="Joined" value={format(parseISO(selectedEmployee.joining_date), "dd MMM yyyy")} />
                )}
              </div>

              {/* Skills */}
              {selectedEmployee.skill_tags && selectedEmployee.skill_tags.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEmployee.skill_tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ───── small reusable row ───── */
function InfoRow({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} className="text-sm font-medium text-foreground hover:text-primary truncate block">{value}</a>
        ) : (
          <p className="text-sm font-medium text-foreground truncate">{value}</p>
        )}
      </div>
    </div>
  );
}
