import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Globe, MessageSquare, FileText, Bell, Bot, Palette, Shield, Settings } from "lucide-react";

const portalFeatures = [
  { name: "Ticket Submission", description: "Allow customers to raise support tickets", icon: MessageSquare, enabled: true },
  { name: "Live Chat Widget", description: "Embed live chat on customer portal", icon: MessageSquare, enabled: true },
  { name: "AI Chatbot", description: "AI-powered self-service chatbot", icon: Bot, enabled: true },
  { name: "Ticket Status Tracking", description: "Customers can track their ticket progress", icon: FileText, enabled: true },
  { name: "Push Notifications", description: "Send push notifications for ticket updates", icon: Bell, enabled: false },
  { name: "Invoice & Payment History", description: "View invoices and payment history", icon: FileText, enabled: true },
  { name: "Knowledge Base Access", description: "Browse help articles and FAQs", icon: FileText, enabled: true },
  { name: "Custom Branding", description: "White-label the portal with your brand", icon: Palette, enabled: false },
];

const CustomerPortalPage = () => {
  usePageTitle("Customer Portal Settings");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Customer Portal</h1>
          <p className="text-xs text-muted-foreground">Configure the customer-facing self-service portal</p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Portal Status</p>
              <p className="text-[11px] text-muted-foreground">Customer portal is currently active</p>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-0">Live</Badge>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Portal Features</h2>
        <div className="space-y-3">
          {portalFeatures.map((f) => (
            <Card key={f.name} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{f.name}</p>
                  <p className="text-[11px] text-muted-foreground">{f.description}</p>
                </div>
                <Switch checked={f.enabled} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerPortalPage;
