import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, MapPin } from "lucide-react";
import type { ClientGmb } from "@/hooks/useClientPackage";

interface Props {
  packageId: string;
  socialLinks: any;
  gmb: ClientGmb | null;
  onSaveSocial: (packageId: string, data: any) => void;
  onSaveGmb: (packageId: string, data: Partial<ClientGmb>) => void;
  isReadOnly?: boolean;
}

export default function PackageSocialLinksTab({ packageId, socialLinks, gmb, onSaveSocial, onSaveGmb, isReadOnly }: Props) {
  const [social, setSocial] = useState({
    facebook_url: socialLinks?.facebook_url ?? "",
    instagram_url: socialLinks?.instagram_url ?? "",
    linkedin_url: socialLinks?.linkedin_url ?? "",
    youtube_url: socialLinks?.youtube_url ?? "",
    website_url: socialLinks?.website_url ?? "",
  });

  const [gmbForm, setGmbForm] = useState({
    gmb_link: gmb?.gmb_link ?? "",
    access_status: gmb?.access_status ?? "pending",
    managed_by: gmb?.managed_by ?? "client",
  });

  useEffect(() => {
    if (socialLinks) setSocial({
      facebook_url: socialLinks.facebook_url ?? "",
      instagram_url: socialLinks.instagram_url ?? "",
      linkedin_url: socialLinks.linkedin_url ?? "",
      youtube_url: socialLinks.youtube_url ?? "",
      website_url: socialLinks.website_url ?? "",
    });
  }, [socialLinks]);

  useEffect(() => {
    if (gmb) setGmbForm({
      gmb_link: gmb.gmb_link ?? "",
      access_status: gmb.access_status ?? "pending",
      managed_by: gmb.managed_by ?? "client",
    });
  }, [gmb]);

  return (
    <div className="space-y-4">
      <Card className="border border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Share2 className="h-4 w-4 text-primary" /> Social Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(["facebook_url", "instagram_url", "linkedin_url", "youtube_url", "website_url"] as const).map(key => (
            <div key={key} className="space-y-1">
              <Label className="text-xs capitalize">{key.replace(/_url/, "").replace(/_/g, " ")}</Label>
              <Input
                placeholder={`https://...`}
                value={social[key]}
                onChange={e => setSocial(p => ({ ...p, [key]: e.target.value }))}
                disabled={isReadOnly}
              />
            </div>
          ))}
          {!isReadOnly && (
            <Button onClick={() => onSaveSocial(packageId, social)} className="w-full mt-2">Save Social Links</Button>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Google Business Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">GMB Link</Label>
            <Input value={gmbForm.gmb_link} onChange={e => setGmbForm(p => ({ ...p, gmb_link: e.target.value }))} disabled={isReadOnly} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Access Status</Label>
              <Select value={gmbForm.access_status} onValueChange={v => setGmbForm(p => ({ ...p, access_status: v }))} disabled={isReadOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Managed By</Label>
              <Select value={gmbForm.managed_by} onValueChange={v => setGmbForm(p => ({ ...p, managed_by: v }))} disabled={isReadOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="nextweb">NextWeb</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {!isReadOnly && (
            <Button onClick={() => onSaveGmb(packageId, gmbForm)} className="w-full mt-2">Save GMB</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
