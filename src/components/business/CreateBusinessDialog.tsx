import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Building2, Globe, Briefcase, Loader2 } from "lucide-react";

const CMS_OPTIONS = ["WordPress", "Shopify", "Wix", "Squarespace", "Custom", "Other"];
const INDUSTRY_OPTIONS = ["Digital Marketing", "Healthcare", "Real Estate", "Education", "Hospitality", "Retail", "Professional Services", "Construction", "Finance", "Technology", "Other"];

const SERVICE_OPTIONS = [
  { group: "Website", items: ["Business Website", "Ecommerce Website", "Landing Page"] },
  { group: "SEO", items: ["Local SEO", "National SEO", "Ecommerce SEO"] },
  { group: "Ads", items: ["Google Ads", "Facebook Ads"] },
  { group: "Dev", items: ["CRM Development", "Mobile App", "Custom Software"] },
  { group: "Marketing", items: ["Social Media Marketing", "Content Marketing"] },
];

interface CreateBusinessDialogProps {
  trigger?: React.ReactNode;
  onCreated?: () => void;
}

const CreateBusinessDialog: React.FC<CreateBusinessDialogProps> = ({ trigger, onCreated }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: "", ownerName: "", email: "", phone: "",
    address: "", city: "", state: "", country: "Australia", postcode: "",
    websiteUrl: "", domainName: "", hostingProvider: "", cmsPlatform: "",
    socialFacebook: "", socialInstagram: "", socialLinkedin: "", socialGbp: "", socialYoutube: "",
    industry: "", subIndustry: "",
    targetLocations: "", competitors: "",
    subscribedServices: [] as string[],
  });

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleService = (s: string) => {
    setForm(prev => ({
      ...prev,
      subscribedServices: prev.subscribedServices.includes(s)
        ? prev.subscribedServices.filter(x => x !== s)
        : [...prev.subscribedServices, s],
    }));
  };

  const handleCreate = async () => {
    if (!form.businessName || !form.ownerName || !form.email || !form.phone) {
      toast.error("Business name, owner name, email, and phone are required");
      return;
    }
    setLoading(true);
    try {
      // Create business via edge function (which also creates the auth user and sends credentials)
      const { data, error } = await supabase.functions.invoke("create-business-account", {
        body: {
          ...form,
          registeredByUserId: user?.id,
          targetLocations: form.targetLocations ? form.targetLocations.split(",").map(s => s.trim()) : [],
          competitors: form.competitors ? form.competitors.split(",").map(s => s.trim()) : [],
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Business created! Login credentials sent to " + form.email);
      setOpen(false);
      setForm({
        businessName: "", ownerName: "", email: "", phone: "",
        address: "", city: "", state: "", country: "Australia", postcode: "",
        websiteUrl: "", domainName: "", hostingProvider: "", cmsPlatform: "",
        socialFacebook: "", socialInstagram: "", socialLinkedin: "", socialGbp: "", socialYoutube: "",
        industry: "", subIndustry: "", targetLocations: "", competitors: "",
        subscribedServices: [],
      });
      onCreated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to create business");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button><Plus className="h-4 w-4 mr-2" /> Create Business</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Register New Business
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="details"><Building2 className="h-3.5 w-3.5 mr-1.5" />Details</TabsTrigger>
            <TabsTrigger value="digital"><Globe className="h-3.5 w-3.5 mr-1.5" />Digital</TabsTrigger>
            <TabsTrigger value="services"><Briefcase className="h-3.5 w-3.5 mr-1.5" />Services</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Business Name *</Label>
                <Input value={form.businessName} onChange={e => updateField("businessName", e.target.value)} placeholder="Acme Corp" className="h-10 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Owner Name *</Label>
                <Input value={form.ownerName} onChange={e => updateField("ownerName", e.target.value)} placeholder="John Doe" className="h-10 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Email *</Label>
                <Input type="email" value={form.email} onChange={e => updateField("email", e.target.value)} placeholder="john@acme.com" className="h-10 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Phone *</Label>
                <Input value={form.phone} onChange={e => updateField("phone", e.target.value)} placeholder="+61 400 000 000" className="h-10 rounded-lg" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Address</Label>
              <Input value={form.address} onChange={e => updateField("address", e.target.value)} placeholder="123 Business St" className="h-10 rounded-lg" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">City</Label><Input value={form.city} onChange={e => updateField("city", e.target.value)} className="h-9 rounded-lg text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">State</Label><Input value={form.state} onChange={e => updateField("state", e.target.value)} className="h-9 rounded-lg text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Country</Label><Input value={form.country} onChange={e => updateField("country", e.target.value)} className="h-9 rounded-lg text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Postcode</Label><Input value={form.postcode} onChange={e => updateField("postcode", e.target.value)} className="h-9 rounded-lg text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Industry</Label>
                <Select value={form.industry} onValueChange={v => updateField("industry", v)}>
                  <SelectTrigger className="h-10 rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{INDUSTRY_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Sub Industry</Label>
                <Input value={form.subIndustry} onChange={e => updateField("subIndustry", e.target.value)} placeholder="e.g. Dental" className="h-10 rounded-lg" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="digital" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Website URL</Label>
                <Input value={form.websiteUrl} onChange={e => updateField("websiteUrl", e.target.value)} placeholder="https://acme.com" className="h-10 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Domain Name</Label>
                <Input value={form.domainName} onChange={e => updateField("domainName", e.target.value)} placeholder="acme.com" className="h-10 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Hosting Provider</Label>
                <Input value={form.hostingProvider} onChange={e => updateField("hostingProvider", e.target.value)} placeholder="GoDaddy, AWS" className="h-10 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">CMS Platform</Label>
                <Select value={form.cmsPlatform} onValueChange={v => updateField("cmsPlatform", v)}>
                  <SelectTrigger className="h-10 rounded-lg"><SelectValue placeholder="Select CMS" /></SelectTrigger>
                  <SelectContent>{CMS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <Label className="text-sm font-semibold">Social Media Profiles</Label>
              {[
                { key: "socialFacebook", label: "Facebook" },
                { key: "socialInstagram", label: "Instagram" },
                { key: "socialLinkedin", label: "LinkedIn" },
                { key: "socialGbp", label: "Google Business" },
                { key: "socialYoutube", label: "YouTube" },
              ].map(s => (
                <div key={s.key} className="grid grid-cols-[100px_1fr] items-center gap-3">
                  <Label className="text-xs text-muted-foreground">{s.label}</Label>
                  <Input value={(form as any)[s.key]} onChange={e => updateField(s.key, e.target.value)} className="h-9 rounded-lg text-sm" />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Target Locations</Label>
              <Input value={form.targetLocations} onChange={e => updateField("targetLocations", e.target.value)} placeholder="Sydney, Melbourne (comma separated)" className="h-10 rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Competitors</Label>
              <Input value={form.competitors} onChange={e => updateField("competitors", e.target.value)} placeholder="competitor1.com, competitor2.com" className="h-10 rounded-lg" />
            </div>
            <div className="border-t border-border pt-4">
              <Label className="text-sm font-semibold mb-3 block">Subscribed Services</Label>
              <div className="space-y-3">
                {SERVICE_OPTIONS.map(group => (
                  <div key={group.group}>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">{group.group}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map(s => (
                        <button type="button" key={s} onClick={() => toggleService(s)}
                          className={`px-2.5 py-1 rounded-md text-xs border transition-all ${
                            form.subscribedServices.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Create Business & Send Credentials
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBusinessDialog;
