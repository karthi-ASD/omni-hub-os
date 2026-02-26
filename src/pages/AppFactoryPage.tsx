import { useAppFactory } from "@/hooks/useAppFactory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Smartphone, Plus } from "lucide-react";
import { useState } from "react";

const AppFactoryPage = () => {
  const { builds, loading, createBuild } = useAppFactory();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ platform: "ios", version: "1.0.0", bundleId: "" });

  const handleCreate = async () => {
    const ok = await createBuild(form.platform, form.version, form.bundleId);
    if (ok) { setOpen(false); setForm({ platform: "ios", version: "1.0.0", bundleId: "" }); }
  };

  const statusColors: Record<string, string> = {
    pending: "secondary", building: "outline", completed: "default", failed: "destructive",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">App Factory</h1>
          <p className="text-muted-foreground">White-label mobile app build & deployment</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Build</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Queue App Build</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Platform</Label>
                <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ios">iOS</SelectItem>
                    <SelectItem value="android">Android</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Version</Label><Input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} /></div>
              <div><Label>Bundle ID</Label><Input value={form.bundleId} onChange={e => setForm(f => ({ ...f, bundleId: e.target.value }))} placeholder="com.example.app" /></div>
              <Button onClick={handleCreate} className="w-full">Queue Build</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" />Build History</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead><TableHead>Version</TableHead><TableHead>Bundle ID</TableHead>
                  <TableHead>Build Status</TableHead><TableHead>Store Status</TableHead><TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {builds.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="uppercase font-medium">{b.platform}</TableCell>
                    <TableCell>{b.version}</TableCell>
                    <TableCell className="font-mono text-xs">{b.bundle_id || "—"}</TableCell>
                    <TableCell><Badge variant={(statusColors[b.build_status] || "outline") as any}>{b.build_status}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{b.store_status.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {builds.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No builds yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AppFactoryPage;
