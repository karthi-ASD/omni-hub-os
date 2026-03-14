import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyInsights, useInsightViews, useInsightComments } from "@/hooks/useDailyInsights";
import { useBroadcastPolls } from "@/hooks/useBroadcastPolls";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Plus, Trash2, BarChart3, Send, MessageSquare, Vote, Eye, CheckCircle, Clock
} from "lucide-react";
import { format } from "date-fns";

const DEPARTMENTS = ["All Employees", "Sales", "SEO", "Accounts", "Development", "Management"];

const priorityColors: Record<string, string> = {
  normal: "bg-info/10 text-info",
  important: "bg-warning/10 text-warning",
  mandatory: "bg-destructive/10 text-destructive",
};

export default function InternalBroadcastPage() {
  usePageTitle("Internal Broadcast", "Broadcast messages, polls and feedback to your team.");
  const { user, isSuperAdmin, isBusinessAdmin, isHRManager } = useAuth();
  const canManage = isSuperAdmin || isBusinessAdmin || isHRManager;
  const { insights, loading, createInsight, deleteInsight } = useDailyInsights();
  const { views } = useInsightViews();
  const { polls, createPoll, castVote, myVote, getResults } = useBroadcastPolls();
  const [open, setOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [depts, setDepts] = useState<string[]>(["All Employees"]);
  const [priority, setPriority] = useState("normal");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [allowComments, setAllowComments] = useState(true);
  const [requireAck, setRequireAck] = useState(false);

  // Poll form
  const [includePoll, setIncludePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", "", ""]);

  const handlePublish = async () => {
    if (!title.trim()) return;
    await createInsight({
      title,
      message: message || null,
      department_target: depts.includes("All Employees") ? ["all"] : depts.map((d) => d.toLowerCase()),
      priority_level: priority,
      start_date: startDate,
      expiry_date: expiryDate || null,
      allow_comments: allowComments,
      require_acknowledgement: requireAck,
      status: "published",
    });

    // After creating the insight, attach poll if enabled
    if (includePoll && pollQuestion.trim()) {
      // We need the latest insight to attach the poll - small delay to ensure creation
      setTimeout(async () => {
        const { data } = await (await import("@/integrations/supabase/client")).supabase
          .from("daily_insights")
          .select("id")
          .eq("title", title)
          .order("created_at", { ascending: false })
          .limit(1);

        if (data?.[0]) {
          const validOptions = pollOptions.filter((o) => o.trim());
          if (validOptions.length >= 2) {
            await createPoll(data[0].id, pollQuestion, validOptions);
          }
        }
      }, 500);
    }

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle(""); setMessage(""); setDepts(["All Employees"]); setPriority("normal");
    setStartDate(new Date().toISOString().split("T")[0]); setExpiryDate("");
    setAllowComments(true); setRequireAck(false);
    setIncludePoll(false); setPollQuestion(""); setPollOptions(["", "", ""]);
  };

  const toggleDept = (d: string) => {
    if (d === "All Employees") { setDepts(["All Employees"]); return; }
    setDepts((prev) => {
      const without = prev.filter((x) => x !== "All Employees");
      return without.includes(d) ? without.filter((x) => x !== d) : [...without, d];
    });
  };

  const addPollOption = () => setPollOptions((prev) => [...prev, ""]);
  const updatePollOption = (i: number, val: string) =>
    setPollOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  const removePollOption = (i: number) =>
    setPollOptions((prev) => prev.filter((_, idx) => idx !== i));

  const getViewCount = (insightId: string) => views.filter((v) => v.insight_id === insightId).length;
  const getAckCount = (insightId: string) => views.filter((v) => v.insight_id === insightId && v.acknowledged).length;
  const getPollForInsight = (insightId: string) => polls.find((p) => p.insight_id === insightId);

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Broadcast"
        subtitle="Send announcements, polls and collect team feedback."
        actions={
          canManage ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> New Broadcast</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Broadcast</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" /></div>
                  <div><Label>Message Body</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your message to the team..." rows={4} /></div>
                  <div>
                    <Label className="mb-2 block">Target Audience</Label>
                    <div className="flex flex-wrap gap-3">
                      {DEPARTMENTS.map((d) => (
                        <label key={d} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={depts.includes(d)} onCheckedChange={() => toggleDept(d)} />
                          {d}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Priority</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="important">Important</SelectItem>
                          <SelectItem value="mandatory">Mandatory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Expiry Date</Label><Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></div>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm"><Switch checked={allowComments} onCheckedChange={setAllowComments} /> Allow Comments</label>
                    <label className="flex items-center gap-2 text-sm"><Switch checked={requireAck} onCheckedChange={setRequireAck} /> Require Acknowledgement</label>
                  </div>

                  {/* Poll Section */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Switch checked={includePoll} onCheckedChange={setIncludePoll} />
                      <Vote className="h-4 w-4" /> Attach Poll
                    </label>
                    {includePoll && (
                      <>
                        <div><Label>Poll Question</Label><Input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="e.g. Do you support this change?" /></div>
                        <Label>Options</Label>
                        {pollOptions.map((opt, i) => (
                          <div key={i} className="flex gap-2">
                            <Input value={opt} onChange={(e) => updatePollOption(i, e.target.value)} placeholder={`Option ${i + 1}`} />
                            {pollOptions.length > 2 && (
                              <Button variant="ghost" size="icon" onClick={() => removePollOption(i)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {pollOptions.length < 6 && (
                          <Button variant="outline" size="sm" onClick={addPollOption}>+ Add Option</Button>
                        )}
                      </>
                    )}
                  </div>

                  <Button onClick={handlePublish} className="w-full gap-2" disabled={!title.trim()}>
                    <Send className="h-4 w-4" /> Publish Broadcast
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <Tabs defaultValue="broadcasts">
        <TabsList>
          <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
          {canManage && <TabsTrigger value="results" className="gap-1"><BarChart3 className="h-3.5 w-3.5" /> Poll Results</TabsTrigger>}
          {canManage && <TabsTrigger value="history"><Clock className="h-3.5 w-3.5 mr-1" /> History</TabsTrigger>}
        </TabsList>

        <TabsContent value="broadcasts">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No broadcasts yet.</p>}
            {insights.map((ins) => {
              const poll = getPollForInsight(ins.id);
              return (
                <Card key={ins.id} className="group hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedInsight(ins.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge className={priorityColors[ins.priority_level] || ""}>{ins.priority_level}</Badge>
                        <CardTitle className="text-base">{ins.title}</CardTitle>
                      </div>
                      {poll && <Vote className="h-5 w-5 text-primary" />}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {ins.message && <p className="text-sm text-muted-foreground line-clamp-2">{ins.message}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {getViewCount(ins.id)}</span>
                      {ins.require_acknowledgement && <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {getAckCount(ins.id)}</span>}
                      {poll && <span className="flex items-center gap-1"><Vote className="h-3 w-3" /> Poll</span>}
                      <span>{ins.start_date ? format(new Date(ins.start_date), "MMM d") : ""}</span>
                    </div>
                    {canManage && (
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteInsight(ins.id); }}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {canManage && (
          <TabsContent value="results">
            <PollResultsDashboard polls={polls} getResults={getResults} insights={insights} />
          </TabsContent>
        )}

        {canManage && (
          <TabsContent value="history">
            <BroadcastHistory insights={insights} views={views} polls={polls} />
          </TabsContent>
        )}
      </Tabs>

      {/* Detail dialog */}
      {selectedInsight && (
        <BroadcastDetailDialog
          insightId={selectedInsight}
          insight={insights.find((i) => i.id === selectedInsight)!}
          poll={getPollForInsight(selectedInsight)}
          onClose={() => setSelectedInsight(null)}
          castVote={castVote}
          myVote={myVote}
          getResults={getResults}
          canManage={canManage}
        />
      )}
    </div>
  );
}

function BroadcastDetailDialog({
  insightId, insight, poll, onClose, castVote, myVote, getResults, canManage,
}: {
  insightId: string;
  insight: any;
  poll: any;
  onClose: () => void;
  castVote: (pollId: string, optionId: string) => void;
  myVote: (pollId: string) => any;
  getResults: (pollId: string) => any[];
  canManage: boolean;
}) {
  const { comments, addComment } = useInsightComments(insightId);
  const [commentText, setCommentText] = useState("");
  const [selectedOption, setSelectedOption] = useState("");

  if (!insight) return null;

  const voted = poll ? myVote(poll.id) : null;
  const results = poll ? getResults(poll.id) : [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{insight.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Badge className={priorityColors[insight.priority_level] || ""}>{insight.priority_level}</Badge>
          {insight.message && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{insight.message}</p>}

          {/* Poll Section */}
          {poll && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Vote className="h-4 w-4" /> {poll.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!voted && !canManage ? (
                  <>
                    <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                      {results.map((opt: any) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <RadioGroupItem value={opt.id} id={opt.id} />
                          <Label htmlFor={opt.id} className="cursor-pointer">{opt.option_text}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                    <Button
                      size="sm"
                      disabled={!selectedOption}
                      onClick={() => { castVote(poll.id, selectedOption); setSelectedOption(""); }}
                    >
                      Submit Vote
                    </Button>
                  </>
                ) : (
                  <div className="space-y-2">
                    {results.map((opt: any) => (
                      <div key={opt.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{opt.option_text}</span>
                          <span className="text-muted-foreground">{opt.votes} ({opt.percentage}%)</span>
                        </div>
                        <Progress value={opt.percentage} className="h-2" />
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">{results.reduce((s: number, r: any) => s + r.votes, 0)} total votes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          {insight.allow_comments && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet.</p>}
                {comments.map((c) => (
                  <div key={c.id} className="border-b pb-2 last:border-0">
                    <p className="text-sm">{c.comment}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(c.created_at), "MMM d, HH:mm")}</p>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add your feedback..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && commentText.trim()) {
                        addComment(commentText.trim());
                        setCommentText("");
                      }
                    }}
                  />
                  <Button size="sm" disabled={!commentText.trim()} onClick={() => { addComment(commentText.trim()); setCommentText(""); }}>
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PollResultsDashboard({ polls, getResults, insights }: { polls: any[]; getResults: (id: string) => any[]; insights: any[] }) {
  if (polls.length === 0) return <p className="text-muted-foreground text-center py-12">No polls created yet.</p>;

  return (
    <div className="space-y-4">
      {polls.map((poll) => {
        const results = getResults(poll.id);
        const insight = insights.find((i: any) => i.id === poll.insight_id);
        const totalVotes = results.reduce((s: number, r: any) => s + r.votes, 0);

        return (
          <Card key={poll.id}>
            <CardHeader>
              <CardTitle className="text-base">{poll.question}</CardTitle>
              {insight && <p className="text-xs text-muted-foreground">Broadcast: {insight.title}</p>}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Option</TableHead>
                    <TableHead className="text-right">Votes</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="w-[200px]">Distribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.option_text}</TableCell>
                      <TableCell className="text-right">{r.votes}</TableCell>
                      <TableCell className="text-right">{r.percentage}%</TableCell>
                      <TableCell><Progress value={r.percentage} className="h-2" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-2">Total: {totalVotes} votes</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function BroadcastHistory({ insights, views, polls }: { insights: any[]; views: any[]; polls: any[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Broadcast History</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Poll</TableHead>
              <TableHead>Target</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {insights.map((ins) => (
              <TableRow key={ins.id}>
                <TableCell className="font-medium">{ins.title}</TableCell>
                <TableCell><Badge className={priorityColors[ins.priority_level] || ""}>{ins.priority_level}</Badge></TableCell>
                <TableCell>{ins.created_at ? format(new Date(ins.created_at), "MMM d, yyyy") : "-"}</TableCell>
                <TableCell>{views.filter((v) => v.insight_id === ins.id).length}</TableCell>
                <TableCell>{polls.some((p) => p.insight_id === ins.id) ? <Badge variant="outline">Yes</Badge> : "-"}</TableCell>
                <TableCell className="text-xs">{(ins.department_target || []).join(", ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
