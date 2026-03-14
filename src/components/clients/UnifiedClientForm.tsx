import React, { useState } from "react";
import { CustomFieldRenderer } from "@/components/custom-fields/CustomFieldRenderer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, X } from "lucide-react";
import {
  SERVICE_CATEGORIES,
  WEBSITE_TYPES,
  SEO_PACKAGES,
  APP_TYPES,
  hasWebsiteService,
  hasSeoService,
  hasAppService,
} from "./service-catalog";
import type { CreateClientInput } from "@/hooks/useClients";

interface UnifiedClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateClientInput) => Promise<any>;
  defaultValues?: Partial<CreateClientInput>;
}

interface FormState {
  contact_name: string;
  company_name: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  notes: string;
  deal_id?: string;
  payment_method: string;
}

interface ServiceDetails {
  website_type?: string;
  num_pages?: string;
  design_requirement?: string;
  dev_deadline?: string;
  seo_package?: string;
  target_website?: string;
  num_keywords?: string;
  competitor_websites?: string;
  seo_duration?: string;
  app_type?: string;
  app_category?: string;
  app_features?: string;
}

interface ServicePricing {
  [serviceType: string]: {
    price: string;
    billing_cycle: string;
    renewal_date: string;
  };
}

const EMPTY_FORM: FormState = {
  contact_name: "",
  company_name: "",
  email: "",
  phone: "",
  mobile: "",
  website: "",
  address: "",
  city: "",
  state: "",
  country: "",
  notes: "",
  payment_method: "eft",
};

const UnifiedClientForm: React.FC<UnifiedClientFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}) => {
  const [form, setForm] = useState<FormState>({
    ...EMPTY_FORM,
    contact_name: defaultValues?.contact_name || "",
    company_name: defaultValues?.company_name || "",
    email: defaultValues?.email || "",
    phone: defaultValues?.phone || "",
    mobile: defaultValues?.mobile || "",
    website: defaultValues?.website || "",
    address: defaultValues?.address || "",
    city: defaultValues?.city || "",
    state: defaultValues?.state || "",
    country: defaultValues?.country || "",
    deal_id: defaultValues?.deal_id,
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails>({});
  const [servicePricing, setServicePricing] = useState<ServicePricing>({});
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState("details");

  const update = (key: keyof FormState, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const updateDetail = (key: keyof ServiceDetails, value: string) =>
    setServiceDetails((p) => ({ ...p, [key]: value }));

  const updatePricing = (service: string, field: string, value: string) => {
    setServicePricing((p) => ({
      ...p,
      [service]: { ...(p[service] || { price: "", billing_cycle: "one_time", renewal_date: "" }), [field]: value },
    }));
  };

  const reset = () => {
    setForm({ ...EMPTY_FORM, deal_id: defaultValues?.deal_id });
    setSelectedServices([]);
    setServiceDetails({});
    setServicePricing({});
    setTab("details");
  };

  const handleSubmit = async () => {
    if (!form.contact_name || !form.email) return;
    setSubmitting(true);

    const services = selectedServices.map((s) => {
      const details: Record<string, any> = {};

      if (hasWebsiteService([s])) {
        if (serviceDetails.website_type) details.website_type = serviceDetails.website_type;
        if (serviceDetails.num_pages) details.num_pages = serviceDetails.num_pages;
        if (serviceDetails.design_requirement) details.design_requirement = serviceDetails.design_requirement;
        if (serviceDetails.dev_deadline) details.dev_deadline = serviceDetails.dev_deadline;
      }
      if (hasSeoService([s])) {
        if (serviceDetails.seo_package) details.seo_package = serviceDetails.seo_package;
        if (serviceDetails.target_website) details.target_website = serviceDetails.target_website;
        if (serviceDetails.num_keywords) details.num_keywords = serviceDetails.num_keywords;
        if (serviceDetails.competitor_websites) details.competitor_websites = serviceDetails.competitor_websites;
        if (serviceDetails.seo_duration) details.seo_duration = serviceDetails.seo_duration;
      }
      if (hasAppService([s])) {
        if (serviceDetails.app_type) details.app_type = serviceDetails.app_type;
        if (serviceDetails.app_category) details.app_category = serviceDetails.app_category;
        if (serviceDetails.app_features) details.app_features = serviceDetails.app_features;
      }

      const pricing = servicePricing[s] || { price: "", billing_cycle: "one_time", renewal_date: "" };
      return {
        service_type: s,
        service_details_json: details,
        price_amount: parseFloat(pricing.price) || 0,
        billing_cycle: pricing.billing_cycle || "one_time",
        renewal_date: pricing.renewal_date || undefined,
      };
    });

    await onSubmit({
      contact_name: form.contact_name,
      email: form.email,
      company_name: form.company_name || undefined,
      phone: form.phone || undefined,
      mobile: form.mobile || undefined,
      website: form.website || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      country: form.country || undefined,
      deal_id: form.deal_id,
      payment_method: form.payment_method,
      services,
      notes: form.notes || undefined,
    });

    reset();
    setSubmitting(false);
    onOpenChange(false);
  };

  const showWebFields = hasWebsiteService(selectedServices);
  const showSeoFields = hasSeoService(selectedServices);
  const showAppFields = hasAppService(selectedServices);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            New Client
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 grid grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="project">Project Info</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6 py-4">
            {/* ── Tab 1: Client Details ── */}
            <TabsContent value="details" className="mt-0 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Contact Name *</Label>
                  <Input value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} placeholder="John Smith" />
                </div>
                <div>
                  <Label>Company Name</Label>
                  <Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} placeholder="ABC Plumbing Pty Ltd" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="john@example.com" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+61 400 000 000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mobile</Label>
                  <Input value={form.mobile} onChange={(e) => update("mobile", e.target.value)} placeholder="+61 412 345 678" />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://example.com" />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="123 King Street" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>City</Label>
                  <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Melbourne" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="VIC" />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input value={form.country} onChange={(e) => update("country", e.target.value)} placeholder="Australia" />
                </div>
              </div>

              {/* Payment Method */}
              <div className="pt-2">
                <Label>Default Payment Method</Label>
                <Select value={form.payment_method} onValueChange={(v) => update("payment_method", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eft">EFT (Bank Transfer)</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* ── Tab 2: Services Subscribed ── */}
            <TabsContent value="services" className="mt-0 space-y-4">
              {selectedServices.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-2 border-b border-border">
                  {selectedServices.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleService(s)}>
                      {s} <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}

              {SERVICE_CATEGORIES.map((cat) => (
                <div key={cat.group}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat.group}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.services.map((svc) => (
                      <label key={svc} className="flex items-center gap-2 text-sm cursor-pointer rounded-lg border border-border p-2 hover:bg-accent/50 transition-colors has-[data-state=checked]:border-primary has-[data-state=checked]:bg-primary/5">
                        <Checkbox checked={selectedServices.includes(svc)} onCheckedChange={() => toggleService(svc)} />
                        {svc}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Per-service pricing inputs */}
              {selectedServices.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Service Pricing</p>
                  {selectedServices.map((svc) => {
                    const p = servicePricing[svc] || { price: "", billing_cycle: "one_time", renewal_date: "" };
                    return (
                      <div key={svc} className="rounded-lg border border-border p-3 space-y-2">
                        <p className="text-sm font-medium">{svc}</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Price ($)</Label>
                            <Input type="number" placeholder="0.00" value={p.price} onChange={(e) => updatePricing(svc, "price", e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-xs">Billing Cycle</Label>
                            <Select value={p.billing_cycle} onValueChange={(v) => updatePricing(svc, "billing_cycle", v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="one_time">One-time</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Renewal Date</Label>
                            <Input type="date" value={p.renewal_date} onChange={(e) => updatePricing(svc, "renewal_date", e.target.value)} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ── Tab 3: Conditional Project Info ── */}
            <TabsContent value="project" className="mt-0 space-y-4">
              {!showWebFields && !showSeoFields && !showAppFields && (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Select services in the "Services" tab to see project-specific fields.
                </p>
              )}

              {showWebFields && (
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold">Website Development Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Website Type</Label>
                      <Select value={serviceDetails.website_type || ""} onValueChange={(v) => updateDetail("website_type", v)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {WEBSITE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Number of Pages</Label>
                      <Input value={serviceDetails.num_pages || ""} onChange={(e) => updateDetail("num_pages", e.target.value)} placeholder="e.g. 10" />
                    </div>
                  </div>
                  <div>
                    <Label>Design Requirement</Label>
                    <Input value={serviceDetails.design_requirement || ""} onChange={(e) => updateDetail("design_requirement", e.target.value)} placeholder="Brief design notes" />
                  </div>
                  <div>
                    <Label>Development Deadline</Label>
                    <Input type="date" value={serviceDetails.dev_deadline || ""} onChange={(e) => updateDetail("dev_deadline", e.target.value)} />
                  </div>
                </div>
              )}

              {showSeoFields && (
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold">SEO Service Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>SEO Package</Label>
                      <Select value={serviceDetails.seo_package || ""} onValueChange={(v) => updateDetail("seo_package", v)}>
                        <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                        <SelectContent>
                          {SEO_PACKAGES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Number of Keywords</Label>
                      <Input value={serviceDetails.num_keywords || ""} onChange={(e) => updateDetail("num_keywords", e.target.value)} placeholder="e.g. 20" />
                    </div>
                  </div>
                  <div>
                    <Label>Target Website</Label>
                    <Input value={serviceDetails.target_website || ""} onChange={(e) => updateDetail("target_website", e.target.value)} placeholder="https://clientsite.com" />
                  </div>
                  <div>
                    <Label>Competitor Websites</Label>
                    <Input value={serviceDetails.competitor_websites || ""} onChange={(e) => updateDetail("competitor_websites", e.target.value)} placeholder="Comma-separated URLs" />
                  </div>
                  <div>
                    <Label>SEO Contract Duration</Label>
                    <Input value={serviceDetails.seo_duration || ""} onChange={(e) => updateDetail("seo_duration", e.target.value)} placeholder="e.g. 12 months" />
                  </div>
                </div>
              )}

              {showAppFields && (
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold">Mobile App Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>App Type</Label>
                      <Select value={serviceDetails.app_type || ""} onValueChange={(v) => updateDetail("app_type", v)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {APP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>App Category</Label>
                      <Input value={serviceDetails.app_category || ""} onChange={(e) => updateDetail("app_category", e.target.value)} placeholder="e.g. Business" />
                    </div>
                  </div>
                  <div>
                    <Label>App Features Required</Label>
                    <Textarea value={serviceDetails.app_features || ""} onChange={(e) => updateDetail("app_features", e.target.value)} placeholder="Describe features..." rows={3} />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Tab 4: Notes ── */}
            <TabsContent value="notes" className="mt-0">
              <Label>Internal Notes</Label>
              <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Additional notes about this client..." rows={6} />
              <CustomFieldRenderer moduleName="clients" />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 pb-6 pt-2 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!form.contact_name || !form.email || submitting}>
            {submitting ? "Creating…" : "Create Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedClientForm;
