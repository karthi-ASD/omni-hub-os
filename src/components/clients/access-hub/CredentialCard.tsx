import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, EyeOff, Copy, Pencil, Archive, Globe, Server, Layout, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { AccessCredential } from "@/hooks/useClientAccessHub";

const typeIcons: Record<string, React.ElementType> = {
  hosting: Server,
  domain: Globe,
  website: Layout,
};

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  expiring_soon: "bg-warning/10 text-warning border-warning/20",
  expired: "bg-destructive/10 text-destructive border-destructive/20",
  suspended: "bg-muted text-muted-foreground border-border",
};

interface Props {
  credential: AccessCredential;
  onEdit: (c: AccessCredential) => void;
  onArchive: (id: string) => void;
  onRevealPassword: (id: string) => void;
  onCopy: (id: string, field: string) => void;
  isClientView?: boolean;
}

export function CredentialCard({ credential, onEdit, onArchive, onRevealPassword, onCopy, isClientView }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const Icon = typeIcons[credential.credential_type] || Globe;

  const copyField = (value: string | null, fieldName: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    onCopy(credential.id, fieldName);
    toast.success(`${fieldName} copied`);
  };

  const handleReveal = () => {
    if (!showPassword) onRevealPassword(credential.id);
    setShowPassword(!showPassword);
  };

  const daysUntilExpiry = credential.expiry_date
    ? Math.ceil((new Date(credential.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="rounded-xl border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{credential.provider_name || "Untitled"}</h4>
              <p className="text-xs text-muted-foreground capitalize">{credential.credential_type} Login</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] ${statusColors[credential.status] || ""}`}>
              {credential.status.replace("_", " ")}
            </Badge>
            {credential.is_client_visible && (
              <Badge variant="secondary" className="text-[10px]">Client Visible</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {credential.domain_name && (
            <FieldRow label="Domain" value={credential.domain_name} onCopy={() => copyField(credential.domain_name, "domain")} />
          )}
          {credential.url && (
            <FieldRow label="URL" value={credential.url} onCopy={() => copyField(credential.url, "URL")} isLink />
          )}
          {credential.login_url && (
            <FieldRow label="Login URL" value={credential.login_url} onCopy={() => copyField(credential.login_url, "login URL")} isLink />
          )}
          {credential.username && (
            <FieldRow label="Username" value={credential.username} onCopy={() => copyField(credential.username, "username")} />
          )}
          {credential.password_encrypted && !isClientView && (
            <div className="flex items-center justify-between py-1.5">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Password</p>
                <p className="font-mono text-sm">
                  {showPassword ? credential.password_encrypted : "••••••••"}
                </p>
              </div>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleReveal}>
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{showPassword ? "Hide" : "Show"}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyField(credential.password_encrypted, "password")}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
          {credential.account_email && (
            <FieldRow label="Account Email" value={credential.account_email} onCopy={() => copyField(credential.account_email, "email")} />
          )}
          {credential.expiry_date && (
            <div className="py-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Expiry</p>
              <p className="text-sm font-medium">
                {new Date(credential.expiry_date).toLocaleDateString("en-AU")}
                {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                  <span className={`ml-2 text-xs ${daysUntilExpiry <= 30 ? "text-warning" : "text-muted-foreground"}`}>
                    ({daysUntilExpiry} days)
                  </span>
                )}
                {daysUntilExpiry !== null && daysUntilExpiry <= 0 && (
                  <span className="ml-2 text-xs text-destructive font-semibold">EXPIRED</span>
                )}
              </p>
            </div>
          )}
          {credential.auto_renew_status !== "unknown" && (
            <div className="py-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Auto-Renew</p>
              <Badge variant={credential.auto_renew_status === "on" ? "default" : "outline"} className="text-xs mt-0.5">
                {credential.auto_renew_status === "on" ? "On" : "Off"}
              </Badge>
            </div>
          )}
          {credential.platform_type && (
            <FieldRow label="Platform" value={credential.platform_type} />
          )}
          {credential.two_fa_enabled && (
            <div className="py-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">2FA</p>
              <Badge variant="default" className="text-xs mt-0.5">Enabled</Badge>
            </div>
          )}
        </div>

        {credential.notes && (
          <div className="mt-3 p-2.5 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">{credential.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground">
            Updated {new Date(credential.updated_at).toLocaleDateString("en-AU")}
          </p>
          {!isClientView && (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => onEdit(credential)}>
                <Pencil className="h-3 w-3" /> Edit
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={() => onArchive(credential.id)}>
                <Archive className="h-3 w-3" /> Archive
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FieldRow({ label, value, onCopy, isLink }: { label: string; value: string; onCopy?: () => void; isLink?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        {isLink ? (
          <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1 truncate">
            {value} <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : (
          <p className="text-sm font-medium truncate">{value}</p>
        )}
      </div>
      {onCopy && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onCopy}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
