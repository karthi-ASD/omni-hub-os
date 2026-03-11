import { useSLAPolicies, useSLAEvents } from "@/hooks/useSLA";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, Clock, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";

const SLAPage = () => {
  const { policies, loading: polLoading, create } = useSLAPolicies();
  const { events, loading: evtLoading } = useSLAEvents();

  const [open, setOpen] = useState(false);
  const [entityType, setEntityType] = useState("ticket");
  const [priority, setPriority] = useState("medium");
  const [responseMin, setResponseMin] = useState(60);
  const [resolutionMin, setResolutionMin] = useState(480);

  const handleCreate = async () => {
    await create({ entity_type: entityType, priority, first_response_minutes: responseMin, resolution_minutes: resolutionMin });
    setOpen(false);
  };

  const eventColor = (t: string) => {
    switch (t) {
      case "breached": return "destructive";
      case "escalated": return "destructive";
      case "due_soon": return "secondary";
      case "resolved": return "default";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="SLA Management"
        subtitle="Policies, deadlines & escalation tracking"
        icon={ShieldAlert}
        actions={[{ label: "New Policy", icon: Plus, onClick: () => setOpen(true) }]}
      />

      <Tabs defaultValue="policies">
        <TabsList>
          <TabsTrigger value="policies"><ShieldAlert className="h-4 w-4 mr-1" /> Policies</TabsTrigger>
          <TabsTrigger value="events"><Clock className="h-4 w-4 mr-1" /> Events</TabsTrigger>
        </TabsList>

        <TabsContent value="policies">
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead>Resolution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {polLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : policies.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No SLA policies</TableCell></TableRow>
                  ) : policies.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="capitalize font-medium">{p.entity_type}</TableCell>
                      <TableCell className="capitalize">{p.priority}</TableCell>
                      <TableCell>{p.first_response_minutes} min</TableCell>
                      <TableCell>{p.resolution_minutes} min</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Triggered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evtLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : events.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No SLA events</TableCell></TableRow>
                  ) : events.map(e => (
                    <TableRow key={e.id}>
                      <TableCell><Badge variant={eventColor(e.event_type)}>{e.event_type}</Badge></TableCell>
                      <TableCell className="capitalize">{e.entity_type}</TableCell>
                      <TableCell>{format(new Date(e.triggered_at), "dd MMM yyyy HH:mm")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create SLA Policy</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Entity Type</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ticket">Ticket</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>First Response (min)</Label><Input type="number" value={responseMin} onChange={e => setResponseMin(Number(e.target.value))} /></div>
            <div><Label>Resolution (min)</Label><Input type="number" value={resolutionMin} onChange={e => setResolutionMin(Number(e.target.value))} /></div>
            <Button onClick={handleCreate} className="w-full">Create Policy</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SLAPage;
