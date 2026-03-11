import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCSTickets } from "@/hooks/useCSTickets";
import { useKBArticles } from "@/hooks/useKBArticles";
import { useTicketAI } from "@/hooks/useTicketAI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Ticket, MessageSquare, BookOpen, Bot, Search, Send,
  Clock, CheckCircle, AlertCircle, HelpCircle,
} from "lucide-react";
import { ClientNotificationBell } from "@/components/notifications/ClientNotificationBell";
import { format } from "date-fns";

const statusIcons: Record<string, React.ElementType> = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle,
};

const CustomerMobileAppPage = () => {
  usePageTitle("Customer Portal");
  const { tickets, loading } = useCSTickets();
  const { articles } = useKBArticles();
  const { searchingKB, kbAnswer, searchKB } = useTicketAI();
  const [kbQuery, setKBQuery] = useState("");
  const [activeTab, setActiveTab] = useState("tickets");

  const handleKBSearch = async () => {
    if (!kbQuery.trim()) return;
    await searchKB(kbQuery, articles.map((a: any) => ({
      id: a.id, title: a.title, category: a.category,
      content: a.content?.substring(0, 200),
    })));
  };

  const publishedArticles = articles.filter((a: any) => a.status === "published");

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Help Center</h1>
            <p className="text-xs text-muted-foreground">Self-service support portal</p>
          </div>
        </div>
        <ClientNotificationBell />
      </div>

      {/* AI Search */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground mb-2">How can we help you?</p>
          <div className="flex gap-2">
            <Input
              placeholder="Search for help..."
              value={kbQuery}
              onChange={e => setKBQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleKBSearch()}
              className="flex-1"
            />
            <Button size="icon" onClick={handleKBSearch} disabled={searchingKB}>
              {searchingKB ? <Clock className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {kbAnswer && (
            <div className="mt-3 bg-background rounded-lg p-3 border border-border">
              <div className="flex items-center gap-1.5 mb-1">
                <Bot className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-medium text-primary">AI Answer</span>
                <Badge variant="outline" className="text-[9px] ml-auto">{kbAnswer.confidence}% confident</Badge>
              </div>
              <p className="text-xs text-foreground">{kbAnswer.answer}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 h-9">
          <TabsTrigger value="tickets" className="text-xs"><Ticket className="h-3.5 w-3.5 mr-1" />Tickets</TabsTrigger>
          <TabsTrigger value="kb" className="text-xs"><BookOpen className="h-3.5 w-3.5 mr-1" />Help</TabsTrigger>
          <TabsTrigger value="chat" className="text-xs"><MessageSquare className="h-3.5 w-3.5 mr-1" />Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">My Tickets</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No tickets</div>
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <div className="divide-y divide-border">
                    {tickets.map((t: any) => {
                      const Icon = statusIcons[t.status] || Clock;
                      return (
                        <div key={t.id} className="px-4 py-3 flex items-start gap-3">
                          <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[9px] px-1 py-0">{t.status}</Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(t.created_at), "MMM d")}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kb" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Help Articles</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {publishedArticles.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No articles available</div>
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <div className="divide-y divide-border">
                    {publishedArticles.map((a: any) => (
                      <div key={a.id} className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{a.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[9px] px-1 py-0">{a.category}</Badge>
                        </div>
                        {a.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</p>}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-3">
          <Card className="h-[400px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" /> AI Support Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Bot className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">AI Chat coming soon</p>
                <p className="text-xs mt-1">Use the search bar above for instant AI-powered answers</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerMobileAppPage;
