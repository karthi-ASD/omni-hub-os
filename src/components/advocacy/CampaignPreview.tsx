import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2 } from "lucide-react";

interface CampaignPreviewProps {
  title: string;
  description?: string | null;
  shareTemplate?: string | null;
  referralLink: string;
  mediaUrl?: string | null;
}

export function CampaignPreview({ title, description, shareTemplate, referralLink, mediaUrl }: CampaignPreviewProps) {
  const message = shareTemplate
    ? shareTemplate.replace("{referral_link}", referralLink)
    : `${title}${description ? `\n${description}` : ""}\n\n${referralLink}`;

  return (
    <Card className="border-dashed border-2 border-muted-foreground/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
          <Link2 className="h-4 w-4" /> Share Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mediaUrl && (
          <img src={mediaUrl} alt={title} className="rounded-md w-full max-h-40 object-cover" />
        )}
        <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap font-mono">
          {message}
        </div>
        <Badge variant="outline" className="text-xs truncate max-w-full">
          {referralLink}
        </Badge>
      </CardContent>
    </Card>
  );
}
