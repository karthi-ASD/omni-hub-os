import { useOrgStructure } from "@/hooks/useOrgStructure";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Building2, Users, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const OrgChartPage = () => {
  const { nodes, loading, create, remove } = useOrgStructure();
  const [open, setOpen] = useState(false);
  const [nodeType, setNodeType] = useState("department");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");

  const handleCreate = async () => {
    await create({ node_type: nodeType, name, parent_node_id: parentId || null });
    setName("");
    setParentId("");
    setOpen(false);
  };

  const iconFor = (t: string) => {
    switch (t) {
      case "department": return <Building2 className="h-4 w-4" />;
      case "team": return <Users className="h-4 w-4" />;
      case "role": return <Briefcase className="h-4 w-4" />;
      default: return null;
    }
  };

  const rootNodes = nodes.filter(n => !n.parent_node_id);
  const childrenOf = (id: string) => nodes.filter(n => n.parent_node_id === id);

  const renderNode = (node: any, depth: number) => (
    <div key={node.id} style={{ marginLeft: depth * 24 }} className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/50">
      {iconFor(node.node_type)}
      <span className="font-medium">{node.name}</span>
      <Badge variant="outline" className="text-xs capitalize">{node.node_type}</Badge>
      <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto" onClick={() => remove(node.id)}>
        <Trash2 className="h-3 w-3 text-muted-foreground" />
      </Button>
    </div>
  );

  const renderTree = (parentId: string | null, depth: number): React.ReactNode => {
    const children = parentId ? childrenOf(parentId) : rootNodes;
    return children.map(node => (
      <div key={node.id}>
        {renderNode(node, depth)}
        {renderTree(node.id, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organization Structure</h1>
          <p className="text-muted-foreground">Departments, teams & reporting hierarchy</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add Node</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Organization Node</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
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
              <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Engineering" /></div>
              <div>
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
      </div>

      <Card>
        <CardHeader><CardTitle>Org Tree</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading…</p>
          ) : nodes.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No organization nodes. Add departments, teams, and roles to build your hierarchy.</p>
          ) : (
            <div className="space-y-1">{renderTree(null, 0)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrgChartPage;
