import { useClientProfiles } from "@/hooks/useClientProfiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const Client360Page = () => {
  const { profiles, loading, create } = useClientProfiles();
  const [open, setOpen] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [notes, setNotes] = useState("");

  const handleCreate = async () => {
    await create({ legal_name: legalName, notes });
    setLegalName("");
    setNotes("");
    setOpen(false);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "default";
      case "in_progress": return "secondary";
      case "on_hold": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Client 360</h1>
          <p className="text-muted-foreground">Full client profiles, onboarding & service management</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New Client Profile</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Client Profile</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Legal Name</Label><Input value={legalName} onChange={e => setLegalName(e.target.value)} placeholder="Business legal name" /></div>
              <div><Label>Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes" /></div>
              <Button onClick={handleCreate} className="w-full" disabled={!legalName}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Profiles</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{profiles.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Onboarding</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{profiles.filter(p => p.onboarding_status === 'in_progress').length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{profiles.filter(p => p.onboarding_status === 'completed').length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Legal Name</TableHead>
                <TableHead>Onboarding</TableHead>
                <TableHead>Renewal</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : profiles.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No client profiles yet</TableCell></TableRow>
              ) : profiles.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{p.legal_name || "—"}</TableCell>
                  <TableCell><Badge variant={statusColor(p.onboarding_status)}>{p.onboarding_status}</Badge></TableCell>
                  <TableCell>{p.renewal_date || "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{p.notes || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Client360Page;
