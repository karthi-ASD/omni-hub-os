import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDepartmentTemplates, useAppModuleSettings, BUSINESS_MODELS, DEFAULT_APP_MODULES } from "@/hooks/useBusinessOnboarding";
import { PageHeader } from "@/components/ui/page-header";
import {
  Building2, Briefcase, Layers, Smartphone, Zap, Headphones,
  CheckCircle2, ArrowRight, ArrowLeft,
} from "lucide-react";

const STEPS = [
  { label: "Business Details", icon: Building2 },
  { label: "Business Model", icon: Briefcase },
  { label: "Departments", icon: Layers },
  { label: "Customer App", icon: Smartphone },
  { label: "Integrations", icon: Zap },
  { label: "Support Preference", icon: Headphones },
  { label: "Complete", icon: CheckCircle2 },
];

const INTEGRATION_OPTIONS = [
  { key: "xero", label: "Xero (Accounting)" },
  { key: "google_analytics", label: "Google Analytics 4" },
  { key: "whatsapp", label: "WhatsApp Business" },
  { key: "gmail", label: "Gmail / Email" },
  { key: "plivo", label: "Voice / Telephony" },
];

const SUPPORT_PREFERENCES = [
  { value: "email", label: "Email Support" },
  { value: "ticket", label: "In-App Ticket System" },
  { value: "phone", label: "Phone Support" },
  { value: "dedicated", label: "Dedicated Account Manager" },
];

export default function BusinessOnboardingWizardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { templates, loading: templatesLoading } = useDepartmentTemplates();
  const { initDefaults } = useAppModuleSettings();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step data
  const [businessDetails, setBusinessDetails] = useState({
    website: "", industry: "", timezone: "Australia/Sydney",
  });
  const [businessModel, setBusinessModel] = useState("");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedAppModules, setSelectedAppModules] = useState<string[]>(
    DEFAULT_APP_MODULES.map((m) => m.name)
  );
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [supportPref, setSupportPref] = useState("ticket");

  const progress = ((step + 1) / STEPS.length) * 100;

  const toggleDept = (id: string) =>
    setSelectedDepts((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );

  const toggleAppModule = (name: string) =>
    setSelectedAppModules((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    );

  const toggleIntegration = (key: string) =>
    setSelectedIntegrations((prev) =>
      prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]
    );

  const handleComplete = async () => {
    if (!profile?.business_id) return;
    setSaving(true);
    try {
      // Update business
      await supabase
        .from("businesses")
        .update({
          business_model: businessModel,
          website_url: businessDetails.website || null,
          industry: businessDetails.industry || null,
          onboarding_completed: true,
        } as any)
        .eq("id", profile.business_id);

      // Save department configs
      const deptInserts = selectedDepts.map((templateId) => ({
        business_id: profile.business_id,
        department_template_id: templateId,
        is_enabled: true,
      }));
      if (deptInserts.length > 0) {
        await supabase
          .from("business_department_config" as any)
          .upsert(deptInserts as any, { onConflict: "business_id,department_template_id" });
      }

      // Save app module settings
      const moduleInserts = DEFAULT_APP_MODULES.map((m) => ({
        business_id: profile.business_id,
        module_name: m.name,
        enabled: selectedAppModules.includes(m.name),
        visible_to_customer: selectedAppModules.includes(m.name),
        display_order: m.order,
      }));
      await supabase
        .from("app_module_settings" as any)
        .upsert(moduleInserts as any, { onConflict: "business_id,module_name" });

      toast.success("Onboarding complete! Your workspace is ready.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <PageHeader title="Business Setup Wizard" description="Configure your workspace in a few simple steps" />

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{STEPS[step].label}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="h-5 w-5 text-primary" />; })()}
            {STEPS[step].label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 0: Business Details */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Website URL</Label>
                <Input placeholder="https://yourcompany.com" value={businessDetails.website} onChange={(e) => setBusinessDetails((p) => ({ ...p, website: e.target.value }))} />
              </div>
              <div>
                <Label>Industry</Label>
                <Input placeholder="e.g. Digital Marketing, Construction, Retail" value={businessDetails.industry} onChange={(e) => setBusinessDetails((p) => ({ ...p, industry: e.target.value }))} />
              </div>
              <div>
                <Label>Timezone</Label>
                <Input value={businessDetails.timezone} onChange={(e) => setBusinessDetails((p) => ({ ...p, timezone: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Step 1: Business Model */}
          {step === 1 && (
            <div className="grid gap-3">
              {BUSINESS_MODELS.map((model) => (
                <Card
                  key={model.value}
                  className={`cursor-pointer transition-all border-2 ${businessModel === model.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                  onClick={() => setBusinessModel(model.value)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{model.label}</p>
                      <p className="text-sm text-muted-foreground">{model.description}</p>
                    </div>
                    {businessModel === model.value && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Step 2: Departments */}
          {step === 2 && (
            <div className="space-y-3">
              <CardDescription>Select the departments your business needs. You can change this later.</CardDescription>
              {templatesLoading ? (
                <p className="text-sm text-muted-foreground">Loading departments…</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {templates.map((t) => (
                    <label key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedDepts.includes(t.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                      <Checkbox checked={selectedDepts.includes(t.id)} onCheckedChange={() => toggleDept(t.id)} />
                      <div>
                        <p className="font-medium text-sm">{t.name}</p>
                        {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Customer App Modules */}
          {step === 3 && (
            <div className="space-y-3">
              <CardDescription>Choose which modules your customers can see in their mobile app.</CardDescription>
              <div className="grid grid-cols-2 gap-3">
                {DEFAULT_APP_MODULES.map((m) => (
                  <label key={m.name} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedAppModules.includes(m.name) ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <Checkbox checked={selectedAppModules.includes(m.name)} onCheckedChange={() => toggleAppModule(m.name)} />
                    <span className="text-sm font-medium">{m.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Integrations */}
          {step === 4 && (
            <div className="space-y-3">
              <CardDescription>Select integrations you plan to use. These can be configured later.</CardDescription>
              <div className="grid gap-3">
                {INTEGRATION_OPTIONS.map((opt) => (
                  <label key={opt.key} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedIntegrations.includes(opt.key) ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <Checkbox checked={selectedIntegrations.includes(opt.key)} onCheckedChange={() => toggleIntegration(opt.key)} />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Support Preference */}
          {step === 5 && (
            <div className="space-y-3">
              <CardDescription>How would you prefer to receive support from NextWeb?</CardDescription>
              <div className="grid gap-3">
                {SUPPORT_PREFERENCES.map((pref) => (
                  <Card
                    key={pref.value}
                    className={`cursor-pointer border-2 transition-all ${supportPref === pref.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    onClick={() => setSupportPref(pref.value)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <span className="font-medium text-sm">{pref.label}</span>
                      {supportPref === pref.value && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Complete */}
          {step === 6 && (
            <div className="text-center space-y-4 py-6">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">You're all set!</h3>
              <p className="text-muted-foreground">Your workspace is configured and ready to go. You can adjust any of these settings later from the Admin panel.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {businessModel && <Badge variant="secondary">{BUSINESS_MODELS.find(m => m.value === businessModel)?.label}</Badge>}
                <Badge variant="outline">{selectedDepts.length} departments</Badge>
                <Badge variant="outline">{selectedAppModules.length} app modules</Badge>
                <Badge variant="outline">{selectedIntegrations.length} integrations</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={saving}>
            {saving ? "Saving…" : "Complete Setup"}
          </Button>
        )}
      </div>
    </div>
  );
}
