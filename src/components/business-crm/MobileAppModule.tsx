import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Smartphone, Home, Star, FileText, Bell, Calendar, HelpCircle, BookOpen, MessageCircle } from "lucide-react";
import { useState } from "react";

const SECTIONS = [
  { key: "home", label: "Investor App Home", icon: Home, description: "Featured content and welcome screen for investors", enabled: true },
  { key: "opportunities", label: "Featured Opportunities", icon: Star, description: "Showcase selected properties and investment opportunities", enabled: true },
  { key: "documents", label: "Document Requests", icon: FileText, description: "Allow investors to request and submit documents", enabled: true },
  { key: "status", label: "Investment Status Tracker", icon: Smartphone, description: "Let investors track their deal progress in real-time", enabled: true },
  { key: "announcements", label: "Announcements", icon: Bell, description: "Push announcements and updates to investors", enabled: false },
  { key: "events", label: "Workshops & Events", icon: Calendar, description: "Promote investment workshops, webinars, and meetups", enabled: false },
  { key: "faq", label: "FAQs", icon: HelpCircle, description: "Common questions about the investment process", enabled: true },
  { key: "education", label: "Educational Content", icon: BookOpen, description: "Investor guides, articles, and learning resources", enabled: false },
  { key: "support", label: "Support Prompts", icon: MessageCircle, description: "Quick support access for investor queries", enabled: true },
];

export function MobileAppModule() {
  const [sections, setSections] = useState(SECTIONS);

  const toggle = (key: string) => {
    setSections(prev => prev.map(s => s.key === key ? { ...s, enabled: !s.enabled } : s));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Smartphone className="h-5 w-5" />Mobile App Content Manager</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage what your investors see in their mobile app experience</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="bg-card border-border"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-foreground">{sections.filter(s => s.enabled).length}</p><p className="text-[10px] text-muted-foreground">Active Sections</p></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-foreground">{sections.length}</p><p className="text-[10px] text-muted-foreground">Total Sections</p></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-primary">Live</p><p className="text-[10px] text-muted-foreground">App Status</p></CardContent></Card>
      </div>

      <div className="space-y-3">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <Card key={section.key} className={`bg-card border-border ${section.enabled ? "border-primary/20" : ""}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${section.enabled ? "bg-primary/10" : "bg-muted"}`}>
                  <Icon className={`h-5 w-5 ${section.enabled ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{section.label}</p>
                    <Badge variant={section.enabled ? "default" : "secondary"} className="text-[10px]">{section.enabled ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                </div>
                <Switch checked={section.enabled} onCheckedChange={() => toggle(section.key)} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card border-primary/20">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Note:</strong> Changes to mobile app content are managed through your ACE1 CRM workspace. 
            Content updates will sync automatically to connected investor mobile apps.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
