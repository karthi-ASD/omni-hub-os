import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { useCSTickets } from "@/hooks/useCSTickets";
import { useKBArticles } from "@/hooks/useKBArticles";
import { useTicketAI } from "@/hooks/useTicketAI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe, MessageSquare, FileText, Bell, Bot, Palette,
  Search, BookOpen, Ticket, HelpCircle, ExternalLink,
} from "lucide-react";
import { useCustomerPortalSettings } from "@/hooks/useCustomerPortalSettings";

const portalFeatures = [
  { key: "ticket_submission", name: "Ticket Submission", description: "Allow customers to raise support tickets", icon: MessageSquare },
  { key: "live_chat", name: "Live Chat Widget", description: "Embed live chat on customer portal", icon: MessageSquare },
  { key: "ai_chatbot", name: "AI Chatbot", description: "AI-powered self-service chatbot", icon: Bot },
  { key: "ticket_tracking", name: "Ticket Status Tracking", description: "Customers can track ticket progress", icon: FileText },
  { key: "push_notifications", name: "Push Notifications", description: "Send push notifications for ticket updates", icon: Bell },
  { key: "invoice_history", name: "Invoice & Payment History", description: "View invoices and payment history", icon: FileText },
  { key: "knowledge_base", name: "Knowledge Base Access", description: "Browse help articles and FAQs", icon: BookOpen },
  { key: "custom_branding", name: "Custom Branding", description: "White-label the portal with your brand", icon: Palette },
];

const CustomerPortalPage = () => {
  usePageTitle("Customer Portal Settings");
  const navigate = useNavigate();
  const { settings, loading, upsert } = useCustomerPortalSettings();
  const { tickets } = useCSTickets();
  const { articles } = useKBArticles();

  const features = settings?.features_json || {};
  const isActive = settings?.is_active ?? false;

  const handleTogglePortal = (v: boolean) => {
    upsert({ ...settings, is_active: v });
  };

  const handleToggleFeature = (key: string, v: boolean) => {
    const updated = { ...features, [key]: v };
    upsert({ ...settings, features_json: updated });
  };

  const activeFeatures = portalFeatures.filter(f => features[f.key]).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Customer Portal</h1>
            <p className="text-xs text-muted-foreground">Configure the customer-facing self-service portal</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate("/customer-app")}>
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Preview Portal
        </Button>
      </div>

      {/* Portal Status */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Portal Status</p>
              <p className="text-[11px] text-muted-foreground">
                {loading ? "Loading..." : isActive ? "Portal is active — customers can access it" : "Portal is disabled"}
              </p>
            </div>
            {loading ? <Skeleton className="h-6 w-10" /> : <Switch checked={isActive} onCheckedChange={handleTogglePortal} />}
          </div>
        </CardContent>
      </Card>

      {/* Portal Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-primary">{activeFeatures}</p>
          <p className="text-[9px] text-muted-foreground">Active Features</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-foreground">{tickets.length}</p>
          <p className="text-[9px] text-muted-foreground">Tickets</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-foreground">{articles.filter((a: any) => a.status === "published").length}</p>
          <p className="text-[9px] text-muted-foreground">KB Articles</p>
        </CardContent></Card>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Portal Features</h2>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : (
          <div className="space-y-3">
            {portalFeatures.map((f) => (
              <Card key={f.key} className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{f.name}</p>
                    <p className="text-[11px] text-muted-foreground">{f.description}</p>
                  </div>
                  <Switch checked={features[f.key] ?? false} onCheckedChange={(v) => handleToggleFeature(f.key, v)} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPortalPage;
