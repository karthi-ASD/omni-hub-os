import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Search, Eye, ThumbsUp, Plus, Star, Bot, Sparkles } from "lucide-react";
import { useKBArticles } from "@/hooks/useKBArticles";
import { useTicketAI } from "@/hooks/useTicketAI";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const KnowledgeBasePage = () => {
  usePageTitle("Knowledge Base");
  const { articles, loading, create } = useKBArticles();
  const { isBusinessAdmin, isSuperAdmin } = useAuth();
  const { searchingKB, kbAnswer, searchKB } = useTicketAI();
  const canManage = isBusinessAdmin || isSuperAdmin;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", content: "", category: "General", status: "published" });
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const handleCreate = async () => {
    if (!form.title) return;
    await create(form);
    toast({ title: "Article created" });
    setOpen(false);
    setForm({ title: "", content: "", category: "General", status: "published" });
  };

  const handleAISearch = async () => {
    if (!search.trim()) return;
    await searchKB(search, articles.map((a: any) => ({
      id: a.id, title: a.title, category: a.category,
      content: a.content?.substring(0, 300),
    })));
  };

  const filtered = articles.filter((a: any) =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase()) ||
    a.content?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(articles.map((a: any) => a.category))];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Knowledge Base</h1>
            <p className="text-xs text-muted-foreground">Help articles, FAQs, and AI-powered search</p>
          </div>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Article</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New KB Article</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><Label>Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
                <div><Label>Content</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={6} /></div>
                <Button onClick={handleCreate} className="w-full">Publish Article</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* AI-Powered Search */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ask a question or search articles..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAISearch()}
              />
            </div>
            <Button onClick={handleAISearch} disabled={searchingKB} variant="outline">
              <Bot className="h-4 w-4 mr-1" />
              {searchingKB ? "Searching..." : "AI Search"}
            </Button>
          </div>
          {kbAnswer && (
            <div className="mt-3 bg-background rounded-lg p-3 border border-border">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-medium text-primary">AI Answer</span>
                <Badge variant="outline" className="text-[9px] ml-auto">{kbAnswer.confidence}% confidence</Badge>
              </div>
              <p className="text-xs text-foreground whitespace-pre-wrap">{kbAnswer.answer}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-foreground">{articles.length}</p>
          <p className="text-[9px] text-muted-foreground">Articles</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-foreground">{categories.length}</p>
          <p className="text-[9px] text-muted-foreground">Categories</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-foreground">{articles.filter((a: any) => a.status === "published").length}</p>
          <p className="text-[9px] text-muted-foreground">Published</p>
        </CardContent></Card>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Categories</h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <Card key={cat} className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSearch(cat)}>
                <CardContent className="p-3">
                  <p className="text-sm font-medium text-foreground">{cat}</p>
                  <p className="text-[10px] text-muted-foreground">{articles.filter((a: any) => a.category === cat).length} articles</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Articles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-warning" /> Articles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center"><p className="text-sm text-muted-foreground">No articles found</p></div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="divide-y divide-border">
                {filtered.map((a: any) => (
                  <div key={a.id} className="px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setSelectedArticle(selectedArticle?.id === a.id ? null : a)}>
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.views_count}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {a.helpful_count}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">{a.category}</Badge>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${a.status === "published" ? "bg-success/10 text-success" : ""}`}>{a.status}</Badge>
                    </div>
                    {selectedArticle?.id === a.id && a.content && (
                      <div className="mt-3 bg-accent/50 rounded-lg p-3 border border-border">
                        <p className="text-xs text-foreground whitespace-pre-wrap">{a.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBasePage;
