import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, FileText, HelpCircle, Star, Eye, ThumbsUp } from "lucide-react";

const categories = [
  { name: "Getting Started", articles: 12, icon: "🚀" },
  { name: "Billing & Payments", articles: 8, icon: "💳" },
  { name: "Account Management", articles: 15, icon: "👤" },
  { name: "Technical Support", articles: 22, icon: "🔧" },
  { name: "API & Integrations", articles: 10, icon: "🔗" },
  { name: "Security & Privacy", articles: 6, icon: "🔒" },
];

const popularArticles = [
  { title: "How to reset your password", views: 1240, helpful: 98, category: "Account Management" },
  { title: "Understanding your invoice", views: 890, helpful: 94, category: "Billing & Payments" },
  { title: "Setting up two-factor authentication", views: 756, helpful: 97, category: "Security & Privacy" },
  { title: "API rate limits explained", views: 623, helpful: 91, category: "API & Integrations" },
  { title: "Getting started with your first project", views: 1580, helpful: 96, category: "Getting Started" },
];

const KnowledgeBasePage = () => {
  usePageTitle("Knowledge Base");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-xs text-muted-foreground">Help articles, FAQs, and self-service resources</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search articles, FAQs, guides..." className="pl-9" />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Categories</h2>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((c) => (
            <Card key={c.name} className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors">
              <CardContent className="p-3 flex items-center gap-3">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">{c.articles} articles</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            Most Popular Articles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {popularArticles.map((a) => (
              <div key={a.title} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">{a.title}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.views}</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {a.helpful}%</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">{a.category}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBasePage;
