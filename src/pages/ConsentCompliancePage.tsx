import { useState } from "react";
import { useConsentCompliance } from "@/hooks/useConsentCompliance";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Plus, UserCheck, UserX, Ban, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const consentTypes = ["WHATSAPP", "SMS", "EMAIL_MARKETING", "VOICE_CALL_RECORDING"];
const channels = ["SMS", "WHATSAPP", "EMAIL"];

const ConsentCompliancePage = () => {
  usePageTitle("Consent & Compliance");
  const { consentRecords, optOuts, loading, addConsent, revokeConsent, addOptOut, removeOptOut } = useConsentCompliance();
  const [tab, setTab] = useState("consent");
  const [consentDialog, setConsentDialog] = useState(false);
  const [optOutDialog, setOptOutDialog] = useState(false);

  // Consent form
  const [cType, setCType] = useState("WHATSAPP");
  const [cPhone, setCPhone] = useState("");
  const [cEmail, setCEmail] = useState("");

  // Opt-out form
  const [oChannel, setOChannel] = useState("SMS");
  const [oPhone, setOPhone] = useState("");
  const [oEmail, setOEmail] = useState("");

  const stats = {
    granted: consentRecords.filter(c => c.status === "GRANTED").length,
    revoked: consentRecords.filter(c => c.status === "REVOKED").length,
    optOuts: optOuts.length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Consent & Compliance</h1>
        <p className="text-sm text-muted-foreground">Manage communication consent and opt-out registries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Granted", value: stats.granted, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Revoked", value: stats.revoked, icon: UserX, color: "text-red-400" },
          { label: "Opt-Outs", value: stats.optOuts, icon: Ban, color: "text-amber-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="consent">Consent Records</TabsTrigger>
          <TabsTrigger value="optout">Opt-Out Registry</TabsTrigger>
        </TabsList>

        <TabsContent value="consent">
          <Card className="bg-card border-border">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <p className="font-semibold text-foreground">Consent Records</p>
              <Dialog open={consentDialog} onOpenChange={setConsentDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#d4a853] text-[#0a0e1a]"><Plus className="h-3 w-3 mr-1" /> Add</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Record Consent</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <Select value={cType} onValueChange={setCType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{consentTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="Phone" value={cPhone} onChange={e => setCPhone(e.target.value)} />
                    <Input placeholder="Email" value={cEmail} onChange={e => setCEmail(e.target.value)} />
                    <Button onClick={async () => {
                      await addConsent({ person_type: "LEAD", consent_type: cType, phone: cPhone || undefined, email: cEmail || undefined });
                      setConsentDialog(false); setCPhone(""); setCEmail("");
                    }} className="w-full bg-[#d4a853] text-[#0a0e1a]">Record Consent</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : consentRecords.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records</TableCell></TableRow>
                  ) : (
                    consentRecords.map(c => (
                      <TableRow key={c.id}>
                        <TableCell><Badge variant="outline">{c.consent_type?.replace(/_/g, " ")}</Badge></TableCell>
                        <TableCell className="text-sm">{c.phone || c.email || "—"}</TableCell>
                        <TableCell>
                          <Badge className={c.status === "GRANTED" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.source}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(c.created_at), "MMM d")}</TableCell>
                        <TableCell className="text-right">
                          {c.status === "GRANTED" && (
                            <Button size="sm" variant="destructive" onClick={() => revokeConsent(c.id)}>Revoke</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optout">
          <Card className="bg-card border-border">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <p className="font-semibold text-foreground">Opt-Out Registry</p>
              <Dialog open={optOutDialog} onOpenChange={setOptOutDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#d4a853] text-[#0a0e1a]"><Plus className="h-3 w-3 mr-1" /> Add</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Register Opt-Out</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <Select value={oChannel} onValueChange={setOChannel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{channels.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="Phone" value={oPhone} onChange={e => setOPhone(e.target.value)} />
                    <Input placeholder="Email" value={oEmail} onChange={e => setOEmail(e.target.value)} />
                    <Button onClick={async () => {
                      await addOptOut({ channel: oChannel, phone: oPhone || undefined, email: oEmail || undefined });
                      setOptOutDialog(false); setOPhone(""); setOEmail("");
                    }} className="w-full bg-[#d4a853] text-[#0a0e1a]">Register Opt-Out</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {optOuts.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No opt-outs</TableCell></TableRow>
                  ) : (
                    optOuts.map(o => (
                      <TableRow key={o.id}>
                        <TableCell><Badge variant="outline">{o.channel}</Badge></TableCell>
                        <TableCell className="text-sm">{o.phone || o.email || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{o.reason}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(o.created_at), "MMM d")}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => removeOptOut(o.id)}>Remove</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsentCompliancePage;
