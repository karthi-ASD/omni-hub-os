import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Facebook, Zap, CheckCircle2, Clock, ExternalLink, Copy, RefreshCw, Webhook, BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  businessId: string;
}

export function MetaIntegrationPanel({ businessId }: Props) {
  const [setupOpen, setSetupOpen] = useState(false);

  // Count meta leads to show integration health
  const { data: metaStats } = useQuery({
    queryKey: ["meta-lead-stats", businessId],
    queryFn: async () => {
      const { count: total } = await supabase
        .from("crm_leads")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("source", "meta");

      const { count: last24h } = await supabase
        .from("crm_leads")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("source", "meta")
        .gte("created_at", new Date(Date.now() - 86400000).toISOString());

      const { count: last7d } = await supabase
        .from("crm_leads")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("source", "meta")
        .gte("created_at", new Date(Date.now() - 604800000).toISOString());

      return { total: total || 0, last24h: last24h || 0, last7d: last7d || 0 };
    },
  });

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-lead-webhook`;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("Webhook URL copied");
  };

  const isConnected = (metaStats?.total || 0) > 0;

  return (
    <>
      <Card className="border-blue-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-500" />
              Meta / Facebook Integration
            </CardTitle>
            <Badge variant={isConnected ? "default" : "outline"} className={isConnected ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : ""}>
              {isConnected ? <><CheckCircle2 className="h-3 w-3 mr-1" />Connected</> : <><Clock className="h-3 w-3 mr-1" />Not Connected</>}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Automatically capture leads from Facebook & Instagram Lead Ads. Leads sync in real-time and are tagged as "Meta" source with hot temperature.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-foreground">{metaStats?.total || 0}</p>
              <p className="text-[10px] text-muted-foreground">Total Meta Leads</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-foreground">{metaStats?.last24h || 0}</p>
              <p className="text-[10px] text-muted-foreground">Last 24h</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-foreground">{metaStats?.last7d || 0}</p>
              <p className="text-[10px] text-muted-foreground">Last 7 Days</p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Zap, label: "Real-time sync", desc: "Instant lead capture" },
              { icon: RefreshCw, label: "Auto-dedup", desc: "Prevents duplicates" },
              { icon: Webhook, label: "Webhook API", desc: "Meta Graph API v21" },
              { icon: BarChart3, label: "Auto-scoring", desc: "Hot leads by default" },
            ].map(f => (
              <div key={f.label} className="flex items-start gap-2 bg-muted/30 rounded p-2">
                <f.icon className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Button size="sm" variant="outline" className="w-full" onClick={() => setSetupOpen(true)}>
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            {isConnected ? "View Setup Details" : "Setup Meta Integration"}
          </Button>
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Facebook className="h-5 w-5 text-blue-500" />
              Meta Lead Ads Integration Setup
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Step 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                <h3 className="text-sm font-semibold">Copy Webhook URL</h3>
              </div>
              <div className="flex items-center gap-2">
                <Input value={webhookUrl} readOnly className="text-xs font-mono" />
                <Button size="icon" variant="outline" onClick={copyWebhook}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                <h3 className="text-sm font-semibold">Configure in Meta Business Suite</h3>
              </div>
              <ol className="text-xs text-muted-foreground space-y-1.5 pl-8 list-decimal">
                <li>Go to <a href="https://business.facebook.com/settings" target="_blank" rel="noreferrer" className="text-primary underline">Meta Business Settings</a></li>
                <li>Navigate to <strong>Integrations → Lead Access</strong></li>
                <li>Add a <strong>Webhook</strong> and paste the URL above</li>
                <li>Use verify token: <code className="bg-muted px-1 rounded text-[10px]">nextweb-meta-verify</code></li>
                <li>Subscribe to the <strong>leadgen</strong> event</li>
              </ol>
            </div>

            {/* Step 3 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                <h3 className="text-sm font-semibold">Create Lead Ad Forms</h3>
              </div>
              <p className="text-xs text-muted-foreground pl-8">
                In Facebook Ads Manager, create Lead Ads with forms containing fields like: Full Name, Phone, Email, Budget, City, Property Interest. These will auto-map into your Lead Engine.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</span>
                <h3 className="text-sm font-semibold">Done — Leads Sync Automatically</h3>
              </div>
              <p className="text-xs text-muted-foreground pl-8">
                Once connected, leads from your Facebook & Instagram ads will appear instantly in your Lead Engine with source tagged as <Badge variant="outline" className="text-[10px] py-0 px-1">Meta</Badge> and temperature set to <Badge variant="outline" className="text-[10px] py-0 px-1 text-orange-500 border-orange-500/30">Hot</Badge>.
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-300">
              <strong>Admin Note:</strong> For full real-time data fetching, ask your admin to add the <code>META_PAGE_ACCESS_TOKEN</code> secret. Without it, leads will still be captured but with limited field data.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
