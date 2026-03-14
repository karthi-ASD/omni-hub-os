import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Copy, Trash2, Facebook, Linkedin, Twitter, MessageCircle,
  MoreVertical, Pause, Play, Eye,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { CampaignPreview } from "./CampaignPreview";
import type { AdvocacyCampaign } from "@/hooks/useAdvocacy";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  expired: "bg-muted text-muted-foreground",
  draft: "bg-yellow-500/10 text-yellow-600",
  paused: "bg-orange-500/10 text-orange-600",
};

interface Props {
  campaign: AdvocacyCampaign;
  stats: { shares: number; clicks: number; leads: number; conversions: number };
  canManage: boolean;
  onShare: (campaignId: string, platform: string, campaign: AdvocacyCampaign) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  referralCode: string;
}

export function CampaignCard({ campaign: camp, stats, canManage, onShare, onDelete, onStatusChange, referralCode }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const refLink = `${window.location.origin}/ref/${referralCode}/${camp.id.substring(0, 8)}`;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Badge className={statusColors[camp.status] || ""}>{camp.status}</Badge>
            <CardTitle className="text-base">{camp.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline">{camp.category}</Badge>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {camp.status === "active" && (
                    <DropdownMenuItem onClick={() => onStatusChange(camp.id, "paused")}>
                      <Pause className="h-3.5 w-3.5 mr-2" /> Pause
                    </DropdownMenuItem>
                  )}
                  {camp.status === "paused" && (
                    <DropdownMenuItem onClick={() => onStatusChange(camp.id, "active")}>
                      <Play className="h-3.5 w-3.5 mr-2" /> Resume
                    </DropdownMenuItem>
                  )}
                  {camp.status === "draft" && (
                    <DropdownMenuItem onClick={() => onStatusChange(camp.id, "active")}>
                      <Play className="h-3.5 w-3.5 mr-2" /> Activate
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onDelete(camp.id)} className="text-destructive">
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {camp.description && <p className="text-sm text-muted-foreground line-clamp-2">{camp.description}</p>}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span>{stats.shares} shares</span>
          <span>{stats.clicks} clicks</span>
          <span>{stats.leads} leads</span>
          {camp.visibility_type !== "all_employees" && (
            <Badge variant="secondary" className="text-[10px]">{camp.visibility_type.replace("_", " ")}</Badge>
          )}
          <span>{camp.start_date ? format(new Date(camp.start_date), "MMM d") : ""}</span>
        </div>

        {camp.status === "active" && (
          <>
            <div className="flex gap-1 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => onShare(camp.id, "whatsapp", camp)} title="WhatsApp">
                <MessageCircle className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onShare(camp.id, "facebook", camp)} title="Facebook">
                <Facebook className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onShare(camp.id, "twitter", camp)} title="Twitter/X">
                <Twitter className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onShare(camp.id, "linkedin", camp)} title="LinkedIn">
                <Linkedin className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onShare(camp.id, "copy", camp)} title="Copy Link">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} title="Preview">
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </div>
            {showPreview && (
              <CampaignPreview
                title={camp.title}
                description={camp.description}
                shareTemplate={camp.share_message_template}
                referralLink={refLink}
                mediaUrl={camp.media_url}
              />
            )}
          </>
        )}
        {camp.status === "expired" && (
          <p className="text-xs text-muted-foreground italic">Campaign expired.</p>
        )}
      </CardContent>
    </Card>
  );
}
