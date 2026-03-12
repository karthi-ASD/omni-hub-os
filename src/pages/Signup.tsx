import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft, Building2, User, Globe, Briefcase, Sparkles } from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";

const SERVICE_OPTIONS = [
  { group: "Website Services", items: ["Business Website", "Ecommerce Website", "Landing Page"] },
  { group: "SEO Services", items: ["Local SEO", "National SEO", "Ecommerce SEO", "Technical SEO"] },
  { group: "Ads Services", items: ["Google Ads", "Facebook Ads", "Instagram Ads"] },
  { group: "Development", items: ["CRM Development", "Mobile App", "Custom Software"] },
  { group: "Marketing", items: ["Social Media Marketing", "Content Marketing", "Email Marketing"] },
  { group: "Other", items: ["Hosting", "Domain Management", "Reputation Management"] },
];

const CMS_OPTIONS = ["WordPress", "Shopify", "Wix", "Squarespace", "Custom", "Other"];
const INDUSTRY_OPTIONS = ["Digital Marketing", "Healthcare", "Real Estate", "Education", "Hospitality", "Retail", "Professional Services", "Construction", "Finance", "Technology", "Other"];

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-destructive" };
  if (score <= 3) return { score, label: "Medium", color: "bg-warning" };
  return { score, label: "Strong", color: "bg-success" };
};

const STEPS = [
  { icon: Building2, label: "Business Details" },
  { icon: Globe, label: "Digital Presence" },
  { icon: Briefcase, label: "Services" },
  { icon: User, label: "Account Setup" },
];

const Signup = () => {
  usePageTitle("Create Account", "Sign up for NextWeb OS — the all-in-one business operating system.");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    // Step 1: Business Details
    businessName: "", ownerName: "", email: "", phone: "",
    address: "", city: "", state: "", country: "Australia", postcode: "",
    // Step 2: Digital Presence
    websiteUrl: "", domainName: "", hostingProvider: "", cmsPlatform: "",
    socialFacebook: "", socialInstagram: "", socialLinkedin: "", socialGbp: "", socialYoutube: "",
    // Step 3: Services
    industry: "", subIndustry: "", targetLocations: "",
    competitors: "", subscribedServices: [] as string[],
    // Step 4: Account
    password: "",
  });

  const strength = getPasswordStrength(form.password);
  const updateField = (field: string, value: string | string[]) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleService = (service: string) => {
    setForm(prev => ({
      ...prev,
      subscribedServices: prev.subscribedServices.includes(service)
        ? prev.subscribedServices.filter(s => s !== service)
        : [...prev.subscribedServices, service],
    }));
  };

  const canProceed = () => {
    if (step === 0) return form.businessName && form.ownerName && form.email && form.phone;
    if (step === 3) return form.password.length >= 8 && /[0-9]/.test(form.password) && /[a-zA-Z]/.test(form.password);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) { setStep(step + 1); return; }
    if (!canProceed()) { toast.error("Please fill all required fields"); return; }
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { full_name: form.ownerName.trim() }, emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      const { error: rpcError } = await supabase.rpc("handle_full_signup" as any, {
        _user_id: authData.user.id,
        _business_name: form.businessName.trim(),
        _email: form.email.trim(),
        _owner_name: form.ownerName.trim(),
        _phone: form.phone.trim(),
        _address: form.address.trim() || null,
        _city: form.city.trim() || null,
        _state: form.state.trim() || null,
        _country: form.country.trim() || null,
        _postcode: form.postcode.trim() || null,
        _website_url: form.websiteUrl.trim() || null,
        _domain_name: form.domainName.trim() || null,
        _hosting_provider: form.hostingProvider.trim() || null,
        _cms_platform: form.cmsPlatform || null,
        _social_facebook: form.socialFacebook.trim() || null,
        _social_instagram: form.socialInstagram.trim() || null,
        _social_linkedin: form.socialLinkedin.trim() || null,
        _social_gbp: form.socialGbp.trim() || null,
        _social_youtube: form.socialYoutube.trim() || null,
        _industry: form.industry || null,
        _sub_industry: form.subIndustry.trim() || null,
        _services_offered: null,
        _target_locations: form.targetLocations ? form.targetLocations.split(",").map(s => s.trim()) : null,
        _competitors: form.competitors ? form.competitors.split(",").map(s => s.trim()) : null,
        _subscribed_services: form.subscribedServices.length > 0 ? form.subscribedServices : null,
      });
      if (rpcError) throw rpcError;

      toast.success("Account created! Please check your email to verify.");
      navigate("/login");
    } catch (err: any) { toast.error(err.message || "Signup failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[420px] relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar-background via-card to-sidebar-background" />
        <div className="absolute inset-0 gradient-mesh opacity-20" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <NWLogo size="lg" />
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground leading-tight">
              Register Your <span className="text-gradient">Business</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">Complete your business profile to get started with NextWeb OS.</p>
            {/* Step indicators */}
            <div className="space-y-3">
              {STEPS.map((s, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${i === step ? "bg-primary/10 border border-primary/20" : i < step ? "opacity-70" : "opacity-40"}`}>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                    {i < step ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-sm font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground/60">
            <span>© {new Date().getFullYear()} Nextweb Pty Ltd</span>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background overflow-y-auto">
        <div className="w-full max-w-lg space-y-6 animate-fade-in">
          <div className="lg:hidden"><NWLogo /></div>
          {/* Mobile step indicator */}
          <div className="lg:hidden flex gap-2 mb-4">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{STEPS[step].label}</h2>
            <p className="text-muted-foreground mt-1 text-sm">Step {step + 1} of {STEPS.length}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Business Details */}
            {step === 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Business Name *</Label>
                    <Input value={form.businessName} onChange={e => updateField("businessName", e.target.value)} placeholder="Acme Corp" required className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Owner Name *</Label>
                    <Input value={form.ownerName} onChange={e => updateField("ownerName", e.target.value)} placeholder="John Doe" required className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Business Email *</Label>
                    <Input type="email" value={form.email} onChange={e => updateField("email", e.target.value)} placeholder="john@acme.com" required className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Mobile Phone *</Label>
                    <Input value={form.phone} onChange={e => updateField("phone", e.target.value)} placeholder="+61 400 000 000" required className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Business Address</Label>
                  <Input value={form.address} onChange={e => updateField("address", e.target.value)} placeholder="123 Business St" className="h-11 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">City</Label>
                    <Input value={form.city} onChange={e => updateField("city", e.target.value)} placeholder="Sydney" className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">State</Label>
                    <Input value={form.state} onChange={e => updateField("state", e.target.value)} placeholder="NSW" className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Country</Label>
                    <Input value={form.country} onChange={e => updateField("country", e.target.value)} placeholder="Australia" className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Postcode</Label>
                    <Input value={form.postcode} onChange={e => updateField("postcode", e.target.value)} placeholder="2000" className="h-11 rounded-xl" />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Digital Presence */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Website URL</Label>
                    <Input value={form.websiteUrl} onChange={e => updateField("websiteUrl", e.target.value)} placeholder="https://acme.com" className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Domain Name</Label>
                    <Input value={form.domainName} onChange={e => updateField("domainName", e.target.value)} placeholder="acme.com" className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Hosting Provider</Label>
                    <Input value={form.hostingProvider} onChange={e => updateField("hostingProvider", e.target.value)} placeholder="e.g. GoDaddy, AWS" className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">CMS Platform</Label>
                    <Select value={form.cmsPlatform} onValueChange={v => updateField("cmsPlatform", v)}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select CMS" /></SelectTrigger>
                      <SelectContent>
                        {CMS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <Label className="text-sm font-semibold text-foreground mb-3 block">Social Media Profiles</Label>
                  <div className="space-y-3">
                    {[
                      { key: "socialFacebook", label: "Facebook", placeholder: "https://facebook.com/acme" },
                      { key: "socialInstagram", label: "Instagram", placeholder: "https://instagram.com/acme" },
                      { key: "socialLinkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/acme" },
                      { key: "socialGbp", label: "Google Business Profile", placeholder: "https://g.co/..." },
                      { key: "socialYoutube", label: "YouTube", placeholder: "https://youtube.com/@acme" },
                    ].map(s => (
                      <div key={s.key} className="grid grid-cols-[100px_1fr] items-center gap-3">
                        <Label className="text-xs text-muted-foreground">{s.label}</Label>
                        <Input value={(form as any)[s.key]} onChange={e => updateField(s.key, e.target.value)} placeholder={s.placeholder} className="h-9 rounded-lg text-sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Services & Industry */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Industry</Label>
                    <Select value={form.industry} onValueChange={v => updateField("industry", v)}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Sub Industry</Label>
                    <Input value={form.subIndustry} onChange={e => updateField("subIndustry", e.target.value)} placeholder="e.g. Dental, Legal" className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Target Locations</Label>
                  <Input value={form.targetLocations} onChange={e => updateField("targetLocations", e.target.value)} placeholder="Sydney, Melbourne, Brisbane (comma separated)" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Competitors (optional)</Label>
                  <Input value={form.competitors} onChange={e => updateField("competitors", e.target.value)} placeholder="competitor1.com, competitor2.com" className="h-11 rounded-xl" />
                </div>
                <div className="border-t border-border pt-4">
                  <Label className="text-sm font-semibold text-foreground mb-3 block">Services to Subscribe</Label>
                  <div className="space-y-4">
                    {SERVICE_OPTIONS.map(group => (
                      <div key={group.group}>
                        <p className="text-xs font-medium text-muted-foreground mb-2">{group.group}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map(service => (
                            <button
                              type="button"
                              key={service}
                              onClick={() => toggleService(service)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                form.subscribedServices.includes(service)
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                              }`}
                            >
                              {service}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Account Setup */}
            {step === 3 && (
              <>
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                  <p className="text-sm font-medium">Account Summary</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Business: <span className="text-foreground font-medium">{form.businessName}</span></span>
                    <span>Owner: <span className="text-foreground font-medium">{form.ownerName}</span></span>
                    <span>Email: <span className="text-foreground font-medium">{form.email}</span></span>
                    <span>Phone: <span className="text-foreground font-medium">{form.phone}</span></span>
                    {form.industry && <span>Industry: <span className="text-foreground font-medium">{form.industry}</span></span>}
                    {form.subscribedServices.length > 0 && <span className="col-span-2">Services: <span className="text-foreground font-medium">{form.subscribedServices.length} selected</span></span>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Create Password *</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={e => updateField("password", e.target.value)}
                      placeholder="Min 8 chars, include letters & numbers"
                      required minLength={8} maxLength={128}
                      className="h-11 rounded-xl pr-12"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.password.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex gap-1">{[1,2,3,4,5].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : "bg-muted"}`} />)}</div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{strength.label}</p>
                        <div className="flex gap-2 text-xs">
                          <span className={/[a-zA-Z]/.test(form.password) ? "text-success" : "text-muted-foreground"}>Letters ✓</span>
                          <span className={/[0-9]/.test(form.password) ? "text-success" : "text-muted-foreground"}>Numbers ✓</span>
                          <span className={form.password.length >= 8 ? "text-success" : "text-muted-foreground"}>8+ chars ✓</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or continue with</span></div>
                </div>
                <Button type="button" variant="outline" className="w-full h-11 rounded-xl" disabled={loading} onClick={async () => { const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin }); if (error) toast.error(error.message || "Google sign-up failed"); }}>
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Sign up with Google
                </Button>
              </>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="h-12 rounded-xl flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              )}
              <Button
                type="submit"
                className="h-12 font-semibold text-base rounded-xl shadow-glow flex-1"
                disabled={loading || !canProceed()}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating account...
                  </div>
                ) : step < 3 ? (
                  <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>
                ) : (
                  <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
          </form>

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" /> No credit card</div>
            <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" /> 14-day trial</div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
