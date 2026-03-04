import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PremiumFooter } from "@/components/PremiumFooter";
import { toast } from "sonner";
import {
  Play, CheckCircle2, ArrowRight, Users, TrendingUp,
  Sparkles, Monitor, Shield, Zap, Brain, Globe
} from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";

const DemoPage = () => {
  usePageTitle("Book a Demo", "Request a free personalized demo of NextWeb OS. See CRM, AI automation, and 100+ modules in action.");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", size: "", role: "", interest: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
      toast.success("Demo request received! We'll be in touch shortly.");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-[#d4a853]/20">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <NWLogo />
          </Link>
          <Link to="/signup"><Button className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold">Get Started Free</Button></Link>
        </div>
      </nav>

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left - info */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full px-4 py-2 mb-8">
                <Play className="h-4 w-4 text-[#d4a853]" />
                <span className="text-sm text-[#d4a853] font-medium">Book a Demo</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                See NextWeb OS{" "}
                <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">in Action</span>
              </h1>
              <p className="text-lg text-gray-400 mb-10 leading-relaxed">
                Get a personalized walkthrough of the platform tailored to your business needs. Our team will show you exactly how NextWeb OS can transform your operations.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  "Personalized demo for your industry",
                  "Live Q&A with product specialists",
                  "Custom setup recommendations",
                  "ROI analysis for your business",
                  "No obligation — completely free",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#d4a853] shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Users, value: "500+", label: "Agencies" },
                  { icon: TrendingUp, value: "40%", label: "More Conversions" },
                  { icon: Sparkles, value: "100+", label: "Modules" },
                ].map((s) => (
                  <div key={s.label} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-4 text-center">
                    <s.icon className="h-5 w-5 text-[#d4a853] mx-auto mb-2" />
                    <div className="text-xl font-bold text-white">{s.value}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - form */}
            <div className="bg-[#111832] border border-[#1e2a4a] rounded-2xl p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5 border border-[#22c55e]/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-8 w-8 text-[#22c55e]" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Demo Request Received!</h2>
                  <p className="text-gray-400 mb-6">Our team will reach out within 24 hours to schedule your personalized demo.</p>
                  <Link to="/"><Button variant="outline" className="border-[#d4a853]/40 text-[#d4a853]">Back to Home</Button></Link>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-2">Request Your Free Demo</h2>
                  <p className="text-gray-500 mb-6 text-sm">Fill out the form and we'll get back to you within 24 hours.</p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">Full Name *</Label>
                        <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required placeholder="John Doe" className="h-11 bg-[#0a0e1a] border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853]" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">Work Email *</Label>
                        <Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required placeholder="john@company.com" className="h-11 bg-[#0a0e1a] border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853]" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">Phone</Label>
                        <Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="+61 400 000 000" className="h-11 bg-[#0a0e1a] border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853]" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">Company *</Label>
                        <Input value={form.company} onChange={(e) => setForm({...form, company: e.target.value})} required placeholder="Your Agency" className="h-11 bg-[#0a0e1a] border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853]" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">Team Size</Label>
                        <select value={form.size} onChange={(e) => setForm({...form, size: e.target.value})} className="w-full h-11 px-3 rounded-md bg-[#0a0e1a] border border-[#1e2a4a] text-white text-sm focus:border-[#d4a853] focus:outline-none">
                          <option value="">Select</option>
                          <option value="1-5">1–5 people</option>
                          <option value="6-20">6–20 people</option>
                          <option value="21-50">21–50 people</option>
                          <option value="51-200">51–200 people</option>
                          <option value="200+">200+ people</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">Your Role</Label>
                        <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="w-full h-11 px-3 rounded-md bg-[#0a0e1a] border border-[#1e2a4a] text-white text-sm focus:border-[#d4a853] focus:outline-none">
                          <option value="">Select</option>
                          <option value="ceo">CEO / Founder</option>
                          <option value="director">Director / VP</option>
                          <option value="manager">Manager</option>
                          <option value="operations">Operations</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300 text-sm">What are you most interested in?</Label>
                      <select value={form.interest} onChange={(e) => setForm({...form, interest: e.target.value})} className="w-full h-11 px-3 rounded-md bg-[#0a0e1a] border border-[#1e2a4a] text-white text-sm focus:border-[#d4a853] focus:outline-none">
                        <option value="">Select</option>
                        <option value="crm">CRM & Sales Pipeline</option>
                        <option value="seo">SEO Management</option>
                        <option value="invoicing">Invoicing & Payments</option>
                        <option value="ai">AI Automation</option>
                        <option value="full">Full Platform Demo</option>
                      </select>
                    </div>
                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold text-base" disabled={loading}>
                      {loading ? "Submitting..." : <>Book My Free Demo <ArrowRight className="ml-2 h-4 w-4" /></>}
                    </Button>
                  </form>
                  <p className="text-xs text-gray-600 mt-4 text-center">🔒 We respect your privacy. No spam, ever.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* What you'll see */}
      <section className="py-20 bg-[#0d1225]">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">What You'll See in the Demo</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Monitor, title: "Live Platform Walkthrough", desc: "Full tour of the dashboard, CRM, projects, invoicing, and more" },
              { icon: Brain, title: "AI Engine in Action", desc: "See lead scoring, sales forecasting, and autonomous agents live" },
              { icon: Globe, title: "Multi-Tenant Setup", desc: "How to manage multiple businesses from one login" },
              { icon: Shield, title: "Security & Compliance", desc: "RLS policies, audit logs, and encryption explained" },
              { icon: Zap, title: "Automation Workflows", desc: "Event-driven triggers, auto-replies, and task automation" },
              { icon: Users, title: "Team Collaboration", desc: "Role-based access, workforce management, and communication tools" },
            ].map((item) => (
              <div key={item.title} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-6 hover:border-[#d4a853]/30 transition-all">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#0ea5e9] flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <PremiumFooter />
    </div>
  );
};

export default DemoPage;
