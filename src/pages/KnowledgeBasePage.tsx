import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Search, Eye, ThumbsUp, Plus, Star } from "lucide-react";
import { useKBArticles } from "@/hooks/useKBArticles";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const KnowledgeBasePage = () => {
  usePageTitle("Knowledge Base");
  const { articles, loading, create } = useKBArticles();
  const { isBusinessAdmin, isSuperAdmin } = useAuth();
  const canManage = isBusinessAdmin || isSuperAdmin;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", content: "", category: "General", status: "published" });

  const handleCreate = async () => {
    if (!form.title) return;
    await create(form);
    toast({ title: "Article created" });
    setOpen(false);
    setForm({ title: "", content: "", category: "General", status: "published" });
  };

  const filtered = articles.filter((a: any) =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase())
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
            <p className="text-xs text-muted-foreground">Help articles, FAQs, and resources</p>
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search articles..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            Articles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center"><p className="text-sm text-muted-foreground">No articles found</p></div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((a: any) => (
                <div key={a.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.views_count}</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {a.helpful_count}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">{a.category}</Badge>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${a.status === "published" ? "bg-emerald-500/10 text-emerald-600" : ""}`}>{a.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBasePage;
