import { useState } from "react";
import { useGovernance } from "@/hooks/useGovernance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gavel, Plus, Users, CalendarDays } from "lucide-react";

const GovernancePage = () => {
  const { members, meetings, resolutions, loading, addMember, addMeeting, addResolution } = useGovernance();
  const [memberOpen, setMemberOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [mForm, setMForm] = useState({ name: "", role: "DIRECTOR" });
  const [mtForm, setMtForm] = useState({ meeting_date: "", agenda: "" });

  const handleAddMember = async () => {
    const ok = await addMember(mForm);
    if (ok) { setMemberOpen(false); setMForm({ name: "", role: "DIRECTOR" }); }
  };

  const handleAddMeeting = async () => {
    const ok = await addMeeting({ meeting_date: mtForm.meeting_date, agenda: mtForm.agenda || undefined });
    if (ok) { setMeetingOpen(false); setMtForm({ meeting_date: "", agenda: "" }); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Governance</h1>
          <p className="text-muted-foreground">Board management, meetings & resolutions</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Member</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Board Member</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <Input placeholder="Full name" value={mForm.name} onChange={e => setMForm(p => ({ ...p, name: e.target.value }))} />
                <Input placeholder="Role (e.g. DIRECTOR, CHAIR)" value={mForm.role} onChange={e => setMForm(p => ({ ...p, role: e.target.value }))} />
                <Button onClick={handleAddMember} disabled={!mForm.name} className="w-full">Add</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Meeting</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Schedule Meeting</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <Input type="date" value={mtForm.meeting_date} onChange={e => setMtForm(p => ({ ...p, meeting_date: e.target.value }))} />
                <Input placeholder="Agenda" value={mtForm.agenda} onChange={e => setMtForm(p => ({ ...p, agenda: e.target.value }))} />
                <Button onClick={handleAddMeeting} disabled={!mtForm.meeting_date} className="w-full">Schedule</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6 flex items-center gap-4"><Users className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Board Members</p><p className="text-2xl font-bold">{members.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><CalendarDays className="h-8 w-8 text-accent" /><div><p className="text-sm text-muted-foreground">Meetings</p><p className="text-2xl font-bold">{meetings.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><Gavel className="h-8 w-8 text-warning" /><div><p className="text-sm text-muted-foreground">Resolutions</p><p className="text-2xl font-bold">{resolutions.length}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="members">
        <TabsList><TabsTrigger value="members">Members</TabsTrigger><TabsTrigger value="meetings">Meetings</TabsTrigger><TabsTrigger value="resolutions">Resolutions</TabsTrigger></TabsList>
        <TabsContent value="members" className="space-y-3 mt-4">
          {loading ? <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div> :
            members.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No board members yet.</CardContent></Card> :
            members.map(m => (
              <Card key={m.id}><CardContent className="flex items-center justify-between py-4">
                <div><p className="font-medium">{m.name}</p><p className="text-sm text-muted-foreground">Voting power: {m.voting_power}</p></div>
                <Badge>{m.role}</Badge>
              </CardContent></Card>
            ))
          }
        </TabsContent>
        <TabsContent value="meetings" className="space-y-3 mt-4">
          {meetings.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No meetings scheduled.</CardContent></Card> :
            meetings.map(mt => (
              <Card key={mt.id}><CardContent className="py-4">
                <p className="font-medium">{new Date(mt.meeting_date).toLocaleDateString()}</p>
                {mt.agenda && <p className="text-sm text-muted-foreground mt-1">{mt.agenda}</p>}
                {mt.resolution_summary && <p className="text-xs text-muted-foreground mt-2">Summary: {mt.resolution_summary}</p>}
              </CardContent></Card>
            ))
          }
        </TabsContent>
        <TabsContent value="resolutions" className="space-y-3 mt-4">
          {resolutions.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No resolutions yet.</CardContent></Card> :
            resolutions.map(r => (
              <Card key={r.id}><CardContent className="flex items-center justify-between py-4">
                <p className="text-sm">{r.resolution_text}</p>
                <Badge variant={r.vote_result === "PASSED" ? "default" : "secondary"}>{r.vote_result}</Badge>
              </CardContent></Card>
            ))
          }
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GovernancePage;
