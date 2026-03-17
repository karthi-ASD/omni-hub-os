import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Mail, Phone, Globe, MapPin, Plus, Trash2, ExternalLink,
  Facebook, Instagram, Linkedin, Youtube, Twitter, User, Building2,
} from "lucide-react";

interface ClientContact {
  id: string;
  contact_type: string;
  label: string;
  value: string;
  is_primary: boolean;
}

interface ClientSocialLink {
  id: string;
  platform: string;
  url: string;
}

const PLATFORMS = [
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "twitter", label: "Twitter / X", icon: Twitter },
  { value: "tiktok", label: "TikTok", icon: Globe },
  { value: "pinterest", label: "Pinterest", icon: Globe },
  { value: "other", label: "Other", icon: Globe },
];

interface ClientProfileTabProps {
  clientId: string;
  client: {
    contact_name?: string;
    company_name?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    google_map_link?: string;
  };
  readOnly?: boolean;
}

export const ClientProfileTab = ({ clientId, client, readOnly = false }: ClientProfileTabProps) => {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [socialLinks, setSocialLinks] = useState<ClientSocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [addContactDialog, setAddContactDialog] = useState(false);
  const [addSocialDialog, setAddSocialDialog] = useState(false);
  const [contactForm, setContactForm] = useState({ contact_type: "email", label: "work", value: "" });
  const [socialForm, setSocialForm] = useState({ platform: "facebook", url: "" });

  const fetchData = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const [cRes, sRes] = await Promise.all([
      supabase.from("client_contacts" as any).select("*").eq("client_id", clientId).order("created_at"),
      supabase.from("client_social_links" as any).select("*").eq("client_id", clientId).order("platform"),
    ]);
    setContacts((cRes.data as any[]) ?? []);
    setSocialLinks((sRes.data as any[]) ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addContact = async () => {
    if (!contactForm.value || !profile?.business_id) return;
    const { error } = await supabase.from("client_contacts" as any).insert({
      client_id: clientId,
      business_id: profile.business_id,
      contact_type: contactForm.contact_type,
      label: contactForm.label,
      value: contactForm.value,
    });
    if (error) { toast.error("Failed to add contact"); return; }
    toast.success("Contact added");
    setContactForm({ contact_type: "email", label: "work", value: "" });
    setAddContactDialog(false);
    fetchData();
  };

  const removeContact = async (id: string) => {
    await supabase.from("client_contacts" as any).delete().eq("id", id);
    toast.success("Contact removed");
    fetchData();
  };

  const addSocial = async () => {
    if (!socialForm.url || !profile?.business_id) return;
    const { error } = await supabase.from("client_social_links" as any).insert({
      client_id: clientId,
      business_id: profile.business_id,
      platform: socialForm.platform,
      url: socialForm.url,
    });
    if (error) {
      if (error.message?.includes("duplicate")) {
        toast.error("This platform is already linked");
      } else {
        toast.error("Failed to add social link");
      }
      return;
    }
    toast.success("Social link added");
    setSocialForm({ platform: "facebook", url: "" });
    setAddSocialDialog(false);
    fetchData();
  };

  const removeSocial = async (id: string) => {
    await supabase.from("client_social_links" as any).delete().eq("id", id);
    toast.success("Social link removed");
    fetchData();
  };

  const getPlatformIcon = (platform: string) => {
    const p = PLATFORMS.find((pl) => pl.value === platform);
    return p ? p.icon : Globe;
  };

  return (
    <div className="space-y-4">
      {/* Business Info */}
      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { icon: User, label: "Contact Person", value: client.contact_name },
            { icon: Building2, label: "Company", value: client.company_name },
            { icon: Mail, label: "Primary Email", value: client.email },
            { icon: Phone, label: "Primary Phone", value: client.phone },
            { icon: Globe, label: "Website", value: client.website, isLink: true },
            { icon: MapPin, label: "Address", value: [client.address, client.city, client.state, client.country].filter(Boolean).join(", ") },
            { icon: MapPin, label: "Google Maps", value: client.google_map_link, isLink: true },
          ].filter(({ value }) => value).map(({ icon: Icon, label, value, isLink }) => (
            <div key={label} className="flex items-center gap-3 py-1.5">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground w-32 shrink-0">{label}</span>
              {isLink ? (
                <a href={value!.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noopener noreferrer"
                   className="text-sm text-primary hover:underline flex items-center gap-1 truncate">
                  {value} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                <span className="text-sm font-medium truncate">{value}</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Additional Contacts */}
      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4" /> Contacts
          </CardTitle>
          {!readOnly && (
            <Button size="sm" variant="outline" onClick={() => setAddContactDialog(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No additional contacts added</p>
          ) : (
            <div className="space-y-2">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg bg-muted/30">
                  {c.contact_type === "email" ? <Mail className="h-3.5 w-3.5 text-muted-foreground" /> : <Phone className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-sm flex-1">{c.value}</span>
                  <Badge variant="outline" className="text-[10px]">{c.label}</Badge>
                  {!readOnly && (
                    <button onClick={() => removeContact(c.id)} className="text-destructive/60 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" /> Social Media
          </CardTitle>
          {!readOnly && (
            <Button size="sm" variant="outline" onClick={() => setAddSocialDialog(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {socialLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No social media links added</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {socialLinks.map((s) => {
                const Icon = getPlatformIcon(s.platform);
                return (
                  <div key={s.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-muted/30">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                       className="text-sm text-primary hover:underline flex-1 truncate">
                      {PLATFORMS.find((p) => p.value === s.platform)?.label || s.platform}
                    </a>
                    {!readOnly && (
                      <button onClick={() => removeSocial(s.id)} className="text-destructive/60 hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Contact Dialog */}
      <Dialog open={addContactDialog} onOpenChange={setAddContactDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Type</Label>
              <Select value={contactForm.contact_type} onValueChange={(v) => setContactForm((p) => ({ ...p, contact_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Label</Label>
              <Select value={contactForm.label} onValueChange={(v) => setContactForm((p) => ({ ...p, label: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                value={contactForm.value}
                onChange={(e) => setContactForm((p) => ({ ...p, value: e.target.value }))}
                placeholder={contactForm.contact_type === "email" ? "email@example.com" : "+61 400 000 000"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddContactDialog(false)}>Cancel</Button>
            <Button onClick={addContact} disabled={!contactForm.value}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Social Dialog */}
      <Dialog open={addSocialDialog} onOpenChange={setAddSocialDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Social Link</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Platform</Label>
              <Select value={socialForm.platform} onValueChange={(v) => setSocialForm((p) => ({ ...p, platform: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL</Label>
              <Input
                value={socialForm.url}
                onChange={(e) => setSocialForm((p) => ({ ...p, url: e.target.value }))}
                placeholder="https://facebook.com/business"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSocialDialog(false)}>Cancel</Button>
            <Button onClick={addSocial} disabled={!socialForm.url}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
