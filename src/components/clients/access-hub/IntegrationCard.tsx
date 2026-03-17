import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pencil, BarChart3, Search, Megaphone, Facebook, Server } from "lucide-react";
import type { ProjectIntegration } from "@/hooks/useClientAccessHub";

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  google_analytics: { label: "Google Analytics", icon: BarChart3, color: "text-orange-500" },
  search_console: { label: "Search Console", icon: Search, color: "text-blue-500" },
  google_ads: { label: "Google Ads", icon: Megaphone, color: "text-green-500" },
  facebook_ads: { label: "Facebook Ads", icon: Facebook, color: "text-indigo-500" },
  hosting_api: { label: "Hosting API", icon: Server, color: "text-purple-500" },
  other: { label: "Other", icon: Server, color: "text-muted-foreground" },
};

const statusColors: Record<string, string> = {
  connected: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  failed: "bg-destructive/10 text-destructive",
  disabled: "bg-muted text-muted-foreground",
};

interface Props {
  integration: ProjectIntegration;
  onEdit: (i: ProjectIntegration) => void;
  onToggle: (id: string, enabled: boolean) => void;
  isClientView?: boolean;
}

export function IntegrationCard({ integration, onEdit, onToggle, isClientView }: Props) {
  const config = typeConfig[integration.integration_type] || typeConfig.other;
  const Icon = config.icon;

  return (
    <Card className={`rounded-xl border shadow-sm transition-all ${!integration.is_enabled ? "opacity-60" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${config.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{config.label}</h4>
              <p className="text-xs text-muted-foreground">{integration.provider_name || integration.connected_account_name || "Not configured"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`text-[10px] ${statusColors[integration.status] || ""}`}>
              {integration.status}
            </Badge>
            {!isClientView && (
              <Switch
                checked={integration.is_enabled}
                onCheckedChange={(v) => onToggle(integration.id, v)}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {integration.account_id && (
            <InfoField label="Account ID" value={integration.account_id} />
          )}
          {integration.property_id && (
            <InfoField label="Property ID" value={integration.property_id} />
          )}
          {integration.measurement_id && (
            <InfoField label="Measurement ID" value={integration.measurement_id} />
          )}
          {integration.business_manager_id && (
            <InfoField label="Business Manager ID" value={integration.business_manager_id} />
          )}
          {integration.connected_email && (
            <InfoField label="Connected Email" value={integration.connected_email} />
          )}
          {integration.verification_status && (
            <InfoField label="Verification" value={integration.verification_status} />
          )}
          {integration.last_sync_at && (
            <InfoField label="Last Sync" value={new Date(integration.last_sync_at).toLocaleString("en-AU")} />
          )}
        </div>

        {/* Hide sensitive fields from client view */}
        {!isClientView && integration.api_url && (
          <div className="mt-2">
            <InfoField label="API URL" value={integration.api_url} />
          </div>
        )}

        {integration.notes && (
          <div className="mt-3 p-2.5 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">{integration.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <div className="flex gap-2">
            {integration.is_client_visible && (
              <Badge variant="secondary" className="text-[10px]">Client Visible</Badge>
            )}
          </div>
          {!isClientView && (
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => onEdit(integration)}>
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  );
}
