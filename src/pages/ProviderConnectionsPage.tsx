import { useState } from "react";
import { useProviderConnections } from "@/hooks/useProviderConnections";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plug, Plus, TestTube, Key, Shield, Wifi, WifiOff,
  MessageCircle, Phone, Mail, Calendar, Webhook, Globe,
} from "lucide-react";
import { format } from "date-fns";

const providerTypes = [
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageCircle },
  { value: "SMS", label: "SMS", icon: Phone },
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "VOICE", label: "Voice", icon: Phone },
  { value: "PLIVO", label: "Plivo (Voice & SMS)", icon: Phone },
  { value: "GOOGLE_CALENDAR", label: "Google Calendar", icon: Calendar },
  { value: "WEBHOOK", label: "Webhook", icon: Webhook },
];

const providerNames: Record<string, string[]> = {
  WHATSAPP: ["WhatsAppCloud", "Twilio"],
  SMS: ["Twilio", "MessageBird", "Vonage", "Plivo", "MX Global"],
  EMAIL: ["SendGrid", "Mailgun", "SMTP", "SES"],
  VOICE: ["Twilio", "Vapi", "Retell", "ElevenLabs", "Plivo"],
  PLIVO: ["Plivo"],
  GOOGLE_CALENDAR: ["Google"],
  WEBHOOK: ["Custom"],
};

const statusIcons: Record<string, React.ElementType> = {
  CONNECTED: Wifi,
  DISCONNECTED: WifiOff,
  ERROR: Shield,
};

const ProviderConnectionsPage = () => {
  usePageTitle("Provider Connections");
  const { connections, accessLogs, loading, createConnection, testConnection, storeCredential } = useProviderConnections();
  const [tab, setTab] = useState("connections");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [credDialog, setCredDialog] = useState<string | null>(null);

  const [providerType, setProviderType] = useState("WHATSAPP");
  const [providerName, setProviderName] = useState("");
  const [displayLabel, setDisplayLabel] = useState("");
  const [keyName, setKeyName] = useState("");
  const [keyValue, setKeyValue] = useState("");

  const handleCreate = async () => {
    if (!providerName) return;
    await createConnection({ provider_type: providerType, provider_name: providerName, display_label: displayLabel || undefined });
    setDialogOpen(false);
    setProviderName("");
    setDisplayLabel("");
  };

  const handleStoreCred = async () => {
    if (!credDialog || !keyName || !keyValue) return;
    await storeCredential(credDialog, keyName, keyValue);
    setCredDialog(null);
    setKeyName("");
    setKeyValue("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Provider Connections</h1>
          <p className="text-sm text-muted-foreground">Secure credential vault for messaging and integration providers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#d4a853] text-[#0a0e1a] hover:bg-[#c49b48]">
              <Plus className="h-4 w-4 mr-2" /> Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Connect Provider</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <Select value={providerType} onValueChange={v => { setProviderType(v); setProviderName(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {providerTypes.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={providerName} onValueChange={setProviderName}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {(providerNames[providerType] || []).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Display label (optional)" value={displayLabel} onChange={e => setDisplayLabel(e.target.value)} />
              <Button onClick={handleCreate} className="w-full bg-[#d4a853] text-[#0a0e1a]">Connect</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Provider cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">Loading...</div>
        ) : connections.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Plug className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No providers connected yet</p>
          </div>
        ) : (
          connections.map(c => {
            const StatusIcon = statusIcons[c.status] || WifiOff;
            const typeInfo = providerTypes.find(p => p.value === c.provider_type);
            const TypeIcon = typeInfo?.icon || Globe;
            return (
              <Card key={c.id} className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#111832] border border-[#1e2a4a] flex items-center justify-center">
                        <TypeIcon className="h-5 w-5 text-[#d4a853]" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{c.provider_name}</p>
                        <p className="text-xs text-muted-foreground">{c.provider_type}</p>
                      </div>
                    </div>
                    <Badge className={c.status === "CONNECTED"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : c.status === "ERROR"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-500/20 text-gray-400"
                    }>
                      {c.status}
                    </Badge>
                  </div>
                  {c.display_label && <p className="text-xs text-muted-foreground mb-3">{c.display_label}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => testConnection(c.id)}>
                      <TestTube className="h-3 w-3 mr-1" /> Test
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setCredDialog(c.id)}>
                      <Key className="h-3 w-3 mr-1" /> Credentials
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Access logs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="connections">Overview</TabsTrigger>
          <TabsTrigger value="logs">Access Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="logs">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessLogs.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No logs</TableCell></TableRow>
                  ) : (
                    accessLogs.map(l => {
                      const conn = connections.find(c => c.id === l.provider_connection_id);
                      return (
                        <TableRow key={l.id}>
                          <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                          <TableCell>{conn?.provider_name || "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(l.created_at), "MMM d, h:mm a")}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Credential dialog */}
      <Dialog open={!!credDialog} onOpenChange={v => !v && setCredDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Store Credential</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input placeholder="Key name (e.g. API_KEY)" value={keyName} onChange={e => setKeyName(e.target.value)} />
            <Input placeholder="Value" type="password" value={keyValue} onChange={e => setKeyValue(e.target.value)} />
            <p className="text-xs text-muted-foreground">Credentials are stored securely and access-logged.</p>
            <Button onClick={handleStoreCred} className="w-full bg-[#d4a853] text-[#0a0e1a]">Store Securely</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderConnectionsPage;
