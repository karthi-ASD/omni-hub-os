import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, MessageSquare, Target, Phone, Award } from "lucide-react";

const SCRIPTS = [
  {
    title: "Initial Cold Call — SEO Services",
    content: `**Opening:**
"Hi [Name], this is [Your Name] from NextWeb. I was looking at your website and noticed a few areas where you could be getting more customers from Google. Do you have 30 seconds?"

**Problem:**
"Most businesses in [Industry] are losing leads to competitors who rank higher on Google. I noticed your site isn't showing up for some key searches."

**Value:**
"We help businesses like yours get found on Google, generate more calls and enquiries, and grow revenue through SEO and digital marketing."

**Close:**
"Would you be open to a quick free audit of your website? It takes 5 minutes and I can show you exactly where the opportunities are."`,
  },
  {
    title: "Follow-Up Call — After Audit",
    content: `**Opening:**
"Hi [Name], it's [Your Name] from NextWeb. I sent through the SEO audit for your website — did you get a chance to look at it?"

**Key Points:**
- Reference 2-3 specific issues found in their audit
- Mention what competitors are doing better
- Quantify the opportunity (e.g., "Your competitors are getting X searches/month for these keywords")

**Close:**
"Based on what we found, I think we can help you rank for [X keywords] within 3-6 months. Can I schedule a 15-minute call to walk you through our approach?"`,
  },
  {
    title: "Voicemail Script",
    content: `"Hi [Name], this is [Your Name] from NextWeb. I was reviewing businesses in [Location/Industry] and noticed your website has some great potential for more Google traffic. I'd love to share a quick free audit with you. My number is [Phone]. Again, that's [Your Name] from NextWeb. Have a great day."`,
  },
];

const OBJECTIONS = [
  { objection: "We already have an SEO company", response: "That's great that you're investing in SEO! Many of our best clients came to us from other providers. Would you be open to a free second opinion? We can show you what's working and what could be improved — no obligation." },
  { objection: "SEO doesn't work / We tried it before", response: "I completely understand. Unfortunately, a lot of agencies don't deliver results. We focus on measurable outcomes — more calls, more enquiries, more revenue. I'd love to show you some case studies from businesses similar to yours." },
  { objection: "It's too expensive", response: "I hear you. The good news is our packages start at very competitive rates, and the ROI usually pays for itself within the first few months. Would it help if I showed you the expected return based on your industry?" },
  { objection: "We're too busy right now", response: "Totally understand — that's actually why SEO is so valuable. It works in the background generating leads while you focus on running your business. Can I send you some info to look at when you have a free moment?" },
  { objection: "We get all our work from referrals", response: "Referrals are fantastic! But imagine if people searching Google for [their service] in [their area] could find you too. It's like having a second referral engine running 24/7." },
  { objection: "I need to talk to my partner/boss", response: "Of course! Would it help if I put together a short summary with the audit results and pricing? That way you'll have something concrete to discuss. When would be a good time to follow up?" },
];

const SEO_GUIDES = [
  {
    title: "How to Explain SEO to Clients",
    content: `**Simple explanation:**
"SEO is about making your website show up when people search Google for your services. Right now, when someone searches for [their service] in [their area], your competitors appear first. We fix that."

**Key analogies:**
- SEO is like having the best shopfront on the busiest street
- Google is the new Yellow Pages — if you're not there, you don't exist
- Ranking on page 2 is like having a billboard in the desert

**What to emphasize:**
- SEO drives organic (free) traffic — you don't pay per click
- Results compound over time — it's an investment, not an expense
- Local SEO is essential for service-based businesses`,
  },
  {
    title: "Understanding Website Audit Results",
    content: `**Key metrics to highlight:**
- **Page Speed:** Slow sites lose visitors and rank lower
- **Mobile-Friendliness:** 60%+ of searches are mobile
- **Missing Meta Tags:** Google can't understand pages without them
- **Broken Links:** Hurts user experience and SEO
- **No SSL/HTTPS:** Security warning scares visitors away
- **Thin Content:** Pages with too little text rank poorly
- **Missing Local Signals:** No Google Business Profile or local schema`,
  },
];

const CLOSING_TECHNIQUES = [
  { technique: "The Free Audit Close", script: "\"Let me do a quick free audit of your website. If I find opportunities, we'll discuss them. If your site is already perfect, I'll tell you that too. Sound fair?\"" },
  { technique: "The Competitor Close", script: "\"Your top competitors are already investing in SEO and ranking above you. Every month you wait, they pull further ahead. Let me show you exactly what they're doing.\"" },
  { technique: "The ROI Close", script: "\"Based on the search volume in your area, even a modest improvement in rankings could mean [X] more enquiries per month. At your average job value, that's [Y] in additional revenue. The investment pays for itself.\"" },
  { technique: "The Risk-Free Close", script: "\"We offer month-to-month agreements with no lock-in contracts. If you're not seeing results, you can stop anytime. We earn your business every month.\"" },
];

const SalesKnowledgeBasePage = () => {
  const [tab, setTab] = useState("scripts");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Sales Knowledge Center" subtitle="Scripts, guides, and objection handling for the sales team" icon={BookOpen} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full flex-wrap h-auto gap-1">
          <TabsTrigger value="scripts"><Phone className="h-3.5 w-3.5 mr-1" />Scripts</TabsTrigger>
          <TabsTrigger value="objections"><MessageSquare className="h-3.5 w-3.5 mr-1" />Objections</TabsTrigger>
          <TabsTrigger value="guides"><FileText className="h-3.5 w-3.5 mr-1" />SEO Guides</TabsTrigger>
          <TabsTrigger value="closing"><Award className="h-3.5 w-3.5 mr-1" />Closing</TabsTrigger>
        </TabsList>

        {/* Scripts */}
        <TabsContent value="scripts" className="mt-4 space-y-4">
          {SCRIPTS.map((s, i) => (
            <Card key={i} className="rounded-2xl border-0 shadow-elevated">
              <CardHeader className="pb-2"><CardTitle className="text-sm">{s.title}</CardTitle></CardHeader>
              <CardContent className="text-sm whitespace-pre-line text-muted-foreground">{s.content}</CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Objections */}
        <TabsContent value="objections" className="mt-4 space-y-3">
          {OBJECTIONS.map((o, i) => (
            <Card key={i} className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="shrink-0 mt-0.5 text-destructive border-destructive/30">Objection</Badge>
                  <div>
                    <p className="font-semibold text-sm mb-2">"{o.objection}"</p>
                    <Badge variant="outline" className="mb-2 text-success border-success/30">Response</Badge>
                    <p className="text-sm text-muted-foreground">{o.response}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* SEO Guides */}
        <TabsContent value="guides" className="mt-4 space-y-4">
          {SEO_GUIDES.map((g, i) => (
            <Card key={i} className="rounded-2xl border-0 shadow-elevated">
              <CardHeader className="pb-2"><CardTitle className="text-sm">{g.title}</CardTitle></CardHeader>
              <CardContent className="text-sm whitespace-pre-line text-muted-foreground">{g.content}</CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Closing */}
        <TabsContent value="closing" className="mt-4 space-y-3">
          {CLOSING_TECHNIQUES.map((c, i) => (
            <Card key={i} className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-sm">{c.technique}</p>
                </div>
                <p className="text-sm text-muted-foreground italic">{c.script}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesKnowledgeBasePage;
