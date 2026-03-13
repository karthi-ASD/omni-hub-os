import { useHREmployees } from "@/hooks/useHREmployees";
import { useHRDepartments } from "@/hooks/useHRDepartments";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import { Plus, Trash2, Building2, Users, Briefcase, Network, ChevronRight, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const OrgChartPage = () => {
  const { nodes, loading: nodesLoading, create, remove } = useOrgStructure();
  const { employees } = useHREmployees();
  const { departments } = useHRDepartments();
  const { isSuperAdmin, isHRManager } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [nodeType, setNodeType] = useState("department");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");

  const canManage = isSuperAdmin || isHRManager;

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    await create({ node_type: nodeType, name, parent_node_id: parentId || null });
    toast.success("Node created");
    setName("");
    setParentId("");
    setOpen(false);
  };

  const iconFor = (t: string) => {
    switch (t) {
      case "department": return <Building2 className="h-4 w-4" />;
      case "team": return <Users className="h-4 w-4" />;
      case "role": return <Briefcase className="h-4 w-4" />;
      default: return <Network className="h-4 w-4" />;
    }
  };

  const colorFor = (t: string) => {
    switch (t) {
      case "department": return "bg-primary/10 text-primary border-primary/20";
      case "team": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "role": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default: return "bg-muted text-muted-foreground border-muted";
    }
  };

  const rootNodes = nodes.filter(n => !n.parent_node_id);
  const childrenOf = (id: string) => nodes.filter(n => n.parent_node_id === id);

  // Also generate a department-based hierarchy from actual employees
  const deptHierarchy = departments.filter(d => d.status === "active").map(dept => {
    const deptEmployees = employees.filter(e => e.department_id === dept.id && e.employment_status === "active");
    // Find managers (employees who are reporting_manager for others)
    const managerIds = new Set(
      deptEmployees.filter(e => e.reporting_manager_id).map(e => e.reporting_manager_id)
    );
    const managers = deptEmployees.filter(e => managerIds.has(e.id));
    const nonManagers = deptEmployees.filter(e => !managerIds.has(e.id));
    return { dept, employees: deptEmployees, managers, nonManagers };
  });

  const renderNode = (node: any, depth: number, isLast: boolean) => {
    const children = childrenOf(node.id);
    return (
      <div key={node.id} className="relative">
        <div className={`flex items-center gap-3 py-3 px-4 rounded-xl border ${colorFor(node.node_type)} transition-all hover:shadow-sm`}>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${colorFor(node.node_type)}`}>
            {iconFor(node.node_type)}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{node.name}</p>
            <Badge variant="outline" className="text-[10px] capitalize mt-0.5">{node.node_type}</Badge>
          </div>
          {canManage && (
            <Button size="icon" variant="ghost" className="h-7 w-7 opacity-50 hover:opacity-100" onClick={() => { remove(node.id); toast.success("Removed"); }}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        {children.length > 0 && (
          <div className="ml-8 mt-2 space-y-2 border-l-2 border-muted pl-4">
            {children.map((child, i) => renderNode(child, depth + 1, i === children.length - 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Chart</h1>
          <p className="text-muted-foreground mt-1">Visual team hierarchy & reporting structure</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Node</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Organization Node</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={nodeType} onValueChange={setNodeType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="role">Role</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Engineering" />
                </div>
                <div className="space-y-2">
                  <Label>Parent (optional)</Label>
                  <Select value={parentId} onValueChange={setParentId}>
                    <SelectTrigger><SelectValue placeholder="None (root)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (root)</SelectItem>
                      {nodes.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={!name}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Custom Org Tree */}
      {nodes.length > 0 && (
        <Card className="border-0 shadow-elevated">
          <CardHeader><CardTitle className="text-lg">Custom Hierarchy</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rootNodes.map((node, i) => renderNode(node, 0, i === rootNodes.length - 1))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department-based Hierarchy from actual employees */}
      <Card className="border-0 shadow-elevated">
        <CardHeader>
          <CardTitle className="text-lg">Team Structure by Department</CardTitle>
        </CardHeader>
        <CardContent>
          {deptHierarchy.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No departments with active employees</p>
          ) : (
            <div className="space-y-6">
              {deptHierarchy.map(({ dept, employees: deptEmps, managers }) => (
                <div key={dept.id} className="space-y-2">
                  {/* Department header */}
                  <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{dept.name}</p>
                      <p className="text-xs text-muted-foreground">{deptEmps.length} member{deptEmps.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>

                  {/* Employees in department */}
                  <div className="ml-8 space-y-1.5 border-l-2 border-muted pl-4">
                    {deptEmps.map(emp => {
                      const isManager = managers.some(m => m.id === emp.id);
                      const reportees = deptEmps.filter(e => e.reporting_manager_id === emp.id);
                      return (
                        <div key={emp.id}>
                          <div
                            className={`flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${isManager ? "bg-muted/30" : ""}`}
                            onClick={() => navigate(`/hr/employee/${emp.id}`)}
                          >
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isManager ? "bg-amber-500/10" : "bg-muted"}`}>
                              <User className={`h-4 w-4 ${isManager ? "text-amber-600" : "text-muted-foreground"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{emp.full_name}</p>
                              <p className="text-xs text-muted-foreground">{emp.designation || "—"}</p>
                            </div>
                            {isManager && <Badge variant="outline" className="text-[10px]">Manager</Badge>}
                            <Badge variant={emp.employment_status === "active" ? "default" : "secondary"} className="text-[10px]">
                              {emp.employee_code || "—"}
                            </Badge>
                          </div>
                          {/* Show reportees indented */}
                          {reportees.length > 0 && (
                            <div className="ml-10 space-y-1 border-l border-muted/50 pl-3">
                              {reportees.map(r => (
                                <div
                                  key={r.id}
                                  className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/30 cursor-pointer text-sm"
                                  onClick={() => navigate(`/hr/employee/${r.id}`)}
                                >
                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium">{r.full_name}</span>
                                  <span className="text-xs text-muted-foreground">· {r.designation || "—"}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrgChartPage;
