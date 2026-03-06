import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Star, TrendingUp, MessageSquare, BarChart3 } from "lucide-react";

const surveys = [
  { name: "Post-Resolution Survey", responses: 234, avgScore: 4.7, nps: 82, status: "active" },
  { name: "Quarterly Check-in", responses: 56, avgScore: 4.3, nps: 71, status: "active" },
  { name: "Onboarding Experience", responses: 128, avgScore: 4.8, nps: 88, status: "active" },
  { name: "Product Feedback Q1", responses: 89, avgScore: 4.1, nps: 65, status: "completed" },
];

const recentFeedback = [
  { customer: "Jane S.", score: 5, comment: "Lightning fast response, agent was super helpful!", time: "2h ago" },
  { customer: "Acme Corp", score: 4, comment: "Issue resolved but took a bit longer than expected.", time: "5h ago" },
  { customer: "DevHouse", score: 5, comment: "AI chatbot solved my problem instantly!", time: "1d ago" },
  { customer: "TechStart", score: 3, comment: "Had to explain the issue multiple times.", time: "1d ago" },
];

const SatisfactionSurveysPage = () => {
  usePageTitle("Satisfaction Surveys");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <ThumbsUp className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Satisfaction Surveys</h1>
          <p className="text-xs text-muted-foreground">CSAT, NPS, and customer feedback tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-foreground">4.6</p>
            <p className="text-[10px] text-muted-foreground">Avg CSAT</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-emerald-600">78</p>
            <p className="text-[10px] text-muted-foreground">NPS Score</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-primary">507</p>
            <p className="text-[10px] text-muted-foreground">Responses</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Active Surveys</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {surveys.map((s) => (
              <div key={s.name} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.responses} responses · ⭐ {s.avgScore} · NPS {s.nps}</p>
                </div>
                <Badge className={`text-[10px] border-0 ${s.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                  {s.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Recent Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recentFeedback.map((f, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{f.customer}</span>
                  <span className="text-amber-500 text-xs">{"★".repeat(f.score)}{"☆".repeat(5 - f.score)}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{f.time}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{f.comment}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SatisfactionSurveysPage;
