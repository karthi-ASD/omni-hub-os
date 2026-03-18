import { useState, useEffect } from "react";
import { useClientIntegrations } from "@/hooks/useClientIntegrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, BarChart3, Search, Megaphone, Globe, Phone, MessageSquare } from "lucide-react";

interface Props {
  clientId: string;
}

interface SectionConfig {
  title: string;
  icon: React.ElementType;
  fields: { key: string; label: string; placeholder: string }[];
}

const SECTIONS: SectionConfig[] = [
  {
    title: "Google Analytics",
    icon: BarChart3,
    fields: [{ key: "ga_property_id", label: "GA4 Property ID", placeholder: "e.g. 123456789" }],
  },
  {
    title: "Google Search Console",
    icon: Search,
    fields: [{ key: "gsc_property", label: "Property URL", placeholder: "e.g. sc-domain:example.com" }],
  },
  {
    title: "Google Ads",
    icon: Megaphone,
    fields: [{ key: "google_ads_id", label: "Account ID", placeholder: "e.g. 123-456-7890" }],
  },
  {
    title: "Facebook Ads",
    icon: Megaphone,
    fields: [{ key: "facebook_ads_id", label: "Ad Account ID", placeholder: "e.g. act_123456" }],
  },
  {
    title: "Website / Hosting",
    icon: Globe,
    fields: [
      { key: "website_url", label: "Website URL", placeholder: "https://example.com" },
      { key: "hosting_details", label: "Hosting Details", placeholder: "e.g. SiteGround, cPanel" },
    ],
  },
  {
    title: "Call Tracking",
    icon: Phone,
    fields: [{ key: "call_tracking_number", label: "Tracking Number", placeholder: "+61400000000" }],
  },
  {
    title: "WhatsApp",
    icon: MessageSquare,
    fields: [
      { key: "whatsapp_number", label: "WhatsApp Number", placeholder: "+61400000000" },
      { key: "webhook_url", label: "Webhook URL", placeholder: "https://..." },
    ],
  },
];

export const ClientIntegrationsTab = ({ clientId }: Props) => {
  const { integration, loading, save } = useClientIntegrations(clientId);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (integration) {
      const initial: Record<string, string> = {};
      SECTIONS.forEach(s =>
        s.fields.forEach(f => {
          initial[f.key] = (integration as any)[f.key] || "";
        })
      );
      setForm(initial);
    }
  }, [integration]);

  const handleSave = async () => {
    setSaving(true);
    await save(form as any);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const isConnected = (section: SectionConfig) =>
    section.fields.some(f => !!form[f.key]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Client Integrations</h3>
          <p className="text-sm text-muted-foreground">
            Manage analytics, ads, and communication integrations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {integration?.last_synced_at && (
            <span className="text-xs text-muted-foreground">
              Last synced: {new Date(integration.last_synced_at).toLocaleDateString()}
            </span>
          )}
          <Badge variant={integration?.status === "connected" ? "default" : "secondary"}>
            {integration?.status || "not_connected"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map(section => (
          <Card key={section.title} className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <section.icon className="h-4 w-4 text-primary" />
                  {section.title}
                </span>
                <Badge variant={isConnected(section) ? "default" : "outline"} className="text-[10px]">
                  {isConnected(section) ? "Connected" : "Not Connected"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {section.fields.map(field => (
                <div key={field.key}>
                  <Label className="text-xs">{field.label}</Label>
                  <Input
                    value={form[field.key] || ""}
                    onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />
          {saving ? "Saving..." : "Save Integrations"}
        </Button>
      </div>
    </div>
  );
};
