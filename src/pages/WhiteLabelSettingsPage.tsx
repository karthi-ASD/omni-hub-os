import { useState, useEffect } from "react";
import { useWhiteLabelSettings } from "@/hooks/useWhiteLabelSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Palette, Globe, Image, Save } from "lucide-react";

const WhiteLabelSettingsPage = () => {
  const { settings, loading, upsert } = useWhiteLabelSettings();
  const [form, setForm] = useState({
    company_display_name: "",
    custom_logo_url: "",
    custom_favicon_url: "",
    primary_color: "#6366f1",
    secondary_color: "#8b5cf6",
    custom_domain: "",
    hide_platform_branding: false,
    login_page_html: "",
    email_footer_html: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        company_display_name: settings.company_display_name || "",
        custom_logo_url: settings.custom_logo_url || "",
        custom_favicon_url: settings.custom_favicon_url || "",
        primary_color: settings.primary_color || "#6366f1",
        secondary_color: settings.secondary_color || "#8b5cf6",
        custom_domain: settings.custom_domain || "",
        hide_platform_branding: settings.hide_platform_branding,
        login_page_html: settings.login_page_html || "",
        email_footer_html: settings.email_footer_html || "",
      });
    }
  }, [settings]);

  const handleSave = () => upsert(form as any);

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">White-Label Settings</h1>
          <p className="text-muted-foreground">Customize your portal branding for clients</p>
        </div>
        <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Branding</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Company Display Name</Label><Input value={form.company_display_name} onChange={e => setForm({ ...form, company_display_name: e.target.value })} placeholder="Your Agency Name" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Primary Color</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} className="h-9 w-12 rounded border cursor-pointer" />
                  <Input value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Secondary Color</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} className="h-9 w-12 rounded border cursor-pointer" />
                  <Input value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Hide Platform Branding</Label>
              <Switch checked={form.hide_platform_branding} onCheckedChange={v => setForm({ ...form, hide_platform_branding: v })} />
            </div>
          </CardContent>
        </Card>

        {/* Assets */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              <CardTitle>Assets</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Logo URL</Label><Input value={form.custom_logo_url} onChange={e => setForm({ ...form, custom_logo_url: e.target.value })} placeholder="https://..." /></div>
            {form.custom_logo_url && <img src={form.custom_logo_url} alt="Logo preview" className="h-12 object-contain rounded border p-1" />}
            <div><Label>Favicon URL</Label><Input value={form.custom_favicon_url} onChange={e => setForm({ ...form, custom_favicon_url: e.target.value })} placeholder="https://..." /></div>
          </CardContent>
        </Card>

        {/* Custom Domain */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>Custom Domain</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Custom Domain</Label><Input value={form.custom_domain} onChange={e => setForm({ ...form, custom_domain: e.target.value })} placeholder="crm.youragency.com" /></div>
            <div className="flex items-center gap-2">
              <Badge variant={settings?.domain_verified ? "default" : "secondary"}>
                {settings?.domain_verified ? "Verified" : "Not Verified"}
              </Badge>
              {form.custom_domain && !settings?.domain_verified && (
                <p className="text-xs text-muted-foreground">Add a CNAME record pointing to app.nextweb.co.in</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email & Login */}
        <Card>
          <CardHeader><CardTitle>Custom HTML</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Login Page Custom HTML</Label><Textarea value={form.login_page_html} onChange={e => setForm({ ...form, login_page_html: e.target.value })} rows={3} placeholder="<p>Welcome to our portal</p>" /></div>
            <div><Label>Email Footer HTML</Label><Textarea value={form.email_footer_html} onChange={e => setForm({ ...form, email_footer_html: e.target.value })} rows={3} placeholder="<p>© Your Agency 2026</p>" /></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhiteLabelSettingsPage;
