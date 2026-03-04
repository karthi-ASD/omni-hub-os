import { useLeadConversations, useAutopilotRuns } from "@/hooks/useAutopilot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Inbox, Bot, User, Pause, Play, XCircle, Activity } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  OPEN: "bg-green-500/20 text-green-400",
  PAUSED: "bg-yellow-500/20 text-yellow-400",
  CLOSED: "bg-gray-500/20 text-gray-400",
};

const modeIcons: Record<string, React.ElementType> = {
  AUTOPILOT: Bot,
  MANUAL: User,
};

const runStatusColors: Record<string, string> = {
  RUNNING: "bg-blue-500/20 text-blue-400",
  COMPLETED: "bg-green-500/20 text-green-400",
  STOPPED: "bg-yellow-500/20 text-yellow-400",
  FAILED: "bg-red-500/20 text-red-400",
};

const AutopilotInboxPage = () => {
  const { conversations, updateMode, updateStatus } = useLeadConversations();
  const { runs } = useAutopilotRuns();
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = filter === "ALL" ? conversations : conversations.filter(c => c.status === filter);
  const selectedConvo = conversations.find(c => c.id === selected);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Inbox className="h-6 w-6 text-[#d4a853]" /> Autopilot Inbox
        </h1>
        <p className="text-sm text-muted-foreground">Unified lead conversations with AI automation</p>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList className="bg-[#111832]">
          <TabsTrigger value="inbox"><Inbox className="h-4 w-4 mr-1" />Inbox</TabsTrigger>
          <TabsTrigger value="runs"><Activity className="h-4 w-4 mr-1" />Automation Runs</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversation list */}
            <div className="space-y-3">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="bg-[#111832] border-[#1e2a4a] text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>

              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">No conversations.</p>
              ) : (
                filtered.map(c => {
                  const ModeIcon = modeIcons[c.mode] || Bot;
                  return (
                    <button key={c.id} onClick={() => setSelected(c.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${selected === c.id ? "bg-[#1e2a4a] border-[#d4a853]/40" : "bg-[#0d1117] border-[#1e2a4a] hover:bg-[#111832]"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <ModeIcon className="h-4 w-4 text-[#d4a853]" />
                          <span className="text-sm font-medium text-foreground">Lead #{c.lead_id?.slice(0, 8) || "–"}</span>
                        </div>
                        <Badge className={statusColors[c.status] || ""}>{c.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {c.last_message_at ? format(new Date(c.last_message_at), "PPp") : "No messages"}
                      </p>
                    </button>
                  );
                })
              )}
            </div>

            {/* Detail */}
            <div className="lg:col-span-2">
              {selectedConvo ? (
                <Card className="bg-[#0d1117] border-[#1e2a4a]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-foreground">
                        Conversation Detail
                      </CardTitle>
                      <div className="flex gap-2">
                        {selectedConvo.mode === "AUTOPILOT" ? (
                          <Button size="sm" variant="outline" onClick={() => updateMode(selectedConvo.id, "MANUAL")} className="border-[#1e2a4a] text-foreground">
                            <Pause className="h-4 w-4 mr-1" />Manual Takeover
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => updateMode(selectedConvo.id, "AUTOPILOT")} className="border-[#1e2a4a] text-foreground">
                            <Play className="h-4 w-4 mr-1" />Resume Autopilot
                          </Button>
                        )}
                        {selectedConvo.status !== "CLOSED" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(selectedConvo.id, "CLOSED")} className="border-red-500/30 text-red-400">
                            <XCircle className="h-4 w-4 mr-1" />Close
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-[#111832] border border-[#1e2a4a]">
                        <p className="text-xs text-muted-foreground">Mode</p>
                        <p className="text-sm font-medium text-foreground">{selectedConvo.mode}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#111832] border border-[#1e2a4a]">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="text-sm font-medium text-foreground">{selectedConvo.status}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#111832] border border-[#1e2a4a]">
                        <p className="text-xs text-muted-foreground">Lead ID</p>
                        <p className="text-sm font-medium text-foreground font-mono">{selectedConvo.lead_id || "–"}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#111832] border border-[#1e2a4a]">
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="text-sm font-medium text-foreground">{format(new Date(selectedConvo.created_at), "PPp")}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-[#111832]/50 border border-[#1e2a4a] text-center text-muted-foreground text-sm">
                      Message timeline will appear here when channels are connected
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                  Select a conversation to view details
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="runs">
          <Card className="bg-[#0d1117] border-[#1e2a4a]">
            <CardHeader><CardTitle className="text-foreground">Automation Runs</CardTitle></CardHeader>
            <CardContent>
              {runs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No automation runs yet.</p>
              ) : (
                <div className="space-y-2">
                  {runs.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-[#111832] border border-[#1e2a4a]">
                      <div>
                        <span className="text-sm text-foreground">Step {r.current_step_order}</span>
                        <span className="text-xs text-muted-foreground ml-2">{format(new Date(r.created_at), "PPp")}</span>
                      </div>
                      <Badge className={runStatusColors[r.status] || ""}>{r.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutopilotInboxPage;
