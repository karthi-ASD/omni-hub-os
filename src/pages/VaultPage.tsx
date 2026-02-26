import { useVault } from "@/hooks/useVault";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Eye, Plus, ScrollText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";

const VaultPage = () => {
  const { items, logs, loading, create, logAccess } = useVault();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("hosting");
  const [username, setUsername] = useState("");
  const [secret, setSecret] = useState("");
  const [url, setUrl] = useState("");
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const handleCreate = async () => {
    await create({ title, category, username, secret_encrypted: secret, url });
    setTitle(""); setCategory("hosting"); setUsername(""); setSecret(""); setUrl("");
    setOpen(false);
  };

  const handleReveal = (id: string) => {
    logAccess(id, "view");
    setRevealedIds(prev => new Set(prev).add(id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Secure Vault</h1>
          <p className="text-muted-foreground">Encrypted credential storage with access logging</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add Secret</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Vault Item</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. cPanel Login" /></div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["hosting","domain","dns","email","analytics","ads","app_store","other"].map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Username</Label><Input value={username} onChange={e => setUsername(e.target.value)} /></div>
              <div><Label>Secret / Password</Label><Input type="password" value={secret} onChange={e => setSecret(e.target.value)} /></div>
              <div><Label>URL</Label><Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." /></div>
              <Button onClick={handleCreate} className="w-full" disabled={!title}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items"><Lock className="h-4 w-4 mr-1" /> Vault Items</TabsTrigger>
          <TabsTrigger value="logs"><ScrollText className="h-4 w-4 mr-1" /> Access Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Secret</TableHead>
                    <TableHead>URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : items.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No vault items</TableCell></TableRow>
                  ) : items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{item.category}</Badge></TableCell>
                      <TableCell>{item.username || "—"}</TableCell>
                      <TableCell>
                        {revealedIds.has(item.id) ? (
                          <span className="font-mono text-xs">{item.secret_encrypted || "—"}</span>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => handleReveal(item.id)}>
                            <Eye className="h-3 w-3 mr-1" /> Reveal
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">Open</a> : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Vault Item</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No access logs</TableCell></TableRow>
                  ) : logs.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="capitalize">{l.action}</TableCell>
                      <TableCell>{l.vault_item_id?.slice(0, 8)}…</TableCell>
                      <TableCell>{format(new Date(l.created_at), "dd MMM HH:mm")}</TableCell>
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

export default VaultPage;
