import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bot, Search, FileText, Mail, Target, Sparkles, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const AISalesAssistantPage = () => {
  const [tab, setTab] = useState("research");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [contactName, setContactName] = useState("");
  const [notes, setNotes] = useState("");
  const [emailPurpose, setEmailPurpose] = useState("");

  const callAI = async (type: string, context: Record<string, any>) => {
    if (!businessName.trim()) { toast.error("Business name is required"); return; }
    setLoading(true);
    setResult("");
    setScoreResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-sales-assistant", {
        body: { type, context },
      });

      if (error) throw error;
      if (data?.error) { toast.error(data.error); setLoading(false); return; }

      if (type === "lead_score") {
        setScoreResult(data.result);
      } else {
        setResult(data.result || "No response generated.");
      }
    } catch (err: any) {
      toast.error(err.message || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const baseContext = { businessName, website, industry, location, notes };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="AI Sales Assistant" subtitle="AI-powered tools for smarter selling" icon={Bot} />

      {/* Common fields */}
      <Card className="rounded-2xl border-0 shadow-elevated">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Business Name *</Label><Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Smith Plumbing" className="rounded-xl" /></div>
            <div><Label>Website</Label><Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="e.g. smithplumbing.com.au" className="rounded-xl" /></div>
            <div><Label>Industry</Label><Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Plumbing" className="rounded-xl" /></div>
            <div><Label>Location</Label><Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Sydney, Australia" className="rounded-xl" /></div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full flex-wrap h-auto gap-1">
          <TabsTrigger value="research"><Search className="h-3.5 w-3.5 mr-1" />Research</TabsTrigger>
          <TabsTrigger value="script"><FileText className="h-3.5 w-3.5 mr-1" />Script</TabsTrigger>
          <TabsTrigger value="email"><Mail className="h-3.5 w-3.5 mr-1" />Email</TabsTrigger>
          <TabsTrigger value="score"><Target className="h-3.5 w-3.5 mr-1" />Score</TabsTrigger>
          <TabsTrigger value="deal"><Sparkles className="h-3.5 w-3.5 mr-1" />Deal</TabsTrigger>
        </TabsList>

        {/* Research Tab */}
        <TabsContent value="research" className="mt-4 space-y-4">
          <Button onClick={() => callAI("research", baseContext)} disabled={loading} className="rounded-xl">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Research Business
          </Button>
        </TabsContent>

        {/* Script Tab */}
        <TabsContent value="script" className="mt-4 space-y-4">
          <div><Label>Sales Notes (optional)</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any context for the script..." rows={2} /></div>
          <Button onClick={() => callAI("script", baseContext)} disabled={loading} className="rounded-xl">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            Generate Script
          </Button>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Contact Name</Label><Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="e.g. John Smith" className="rounded-xl" /></div>
            <div><Label>Purpose</Label><Input value={emailPurpose} onChange={e => setEmailPurpose(e.target.value)} placeholder="e.g. Follow up after demo" className="rounded-xl" /></div>
          </div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Context for the email..." rows={2} /></div>
          <Button onClick={() => callAI("email", { ...baseContext, contactName, purpose: emailPurpose })} disabled={loading} className="rounded-xl">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
            Generate Email
          </Button>
        </TabsContent>

        {/* Score Tab */}
        <TabsContent value="score" className="mt-4 space-y-4">
          <Button onClick={() => callAI("lead_score", baseContext)} disabled={loading} className="rounded-xl">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Target className="h-4 w-4 mr-2" />}
            Score This Lead
          </Button>
          {scoreResult && (
            <Card className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white ${
                    scoreResult.score >= 70 ? "bg-success" : scoreResult.score >= 40 ? "bg-warning" : "bg-destructive"
                  }`}>
                    {scoreResult.score}
                  </div>
                  <div>
                    <Badge className={scoreResult.priority === "high" ? "bg-success/10 text-success" : scoreResult.priority === "medium" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}>
                      {scoreResult.priority} priority
                    </Badge>
                    <p className="text-sm mt-2 text-muted-foreground">{scoreResult.recommendation}</p>
                  </div>
                </div>
                {scoreResult.factors?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Scoring Factors</p>
                    {scoreResult.factors.map((f: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className={f.impact === "positive" ? "text-success" : f.impact === "negative" ? "text-destructive" : "text-muted-foreground"}>
                          {f.impact === "positive" ? "↑" : f.impact === "negative" ? "↓" : "–"}
                        </span>
                        <span><strong>{f.factor}:</strong> {f.detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Deal Suggestion Tab */}
        <TabsContent value="deal" className="mt-4 space-y-4">
          <div><Label>SEO Score (if known)</Label><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. 35" className="rounded-xl" /></div>
          <Button onClick={() => callAI("deal_suggestion", { ...baseContext, seoScore: notes })} disabled={loading} className="rounded-xl">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Suggest Deal
          </Button>
        </TabsContent>
      </Tabs>

      {/* AI Result Output */}
      {result && (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">AI Output</CardTitle>
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{result}</ReactMarkdown>
          </CardContent>
        </Card>
      )}

      {loading && !result && !scoreResult && (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-sm text-muted-foreground">AI is analyzing...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AISalesAssistantPage;
