import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PremiumFooter } from "@/components/PremiumFooter";
import {
  ArrowRight, Shield, Zap, BarChart3, Users, Globe, Brain,
  FileText, Phone, Calendar, Target, TrendingUp, Lock, Layers, Star,
  CheckCircle2, ChevronRight, Briefcase, Receipt, MapPin, Headphones,
  Smartphone, Monitor, Tablet, Award, Sparkles
} from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";
import AuthDiagnostics from "@/components/AuthDiagnostics";
import heroBg from "@/assets/hero-bg.jpg";
import dashboardPreview from "@/assets/dashboard-preview.jpg";
import teamCollab from "@/assets/team-collab.jpg";
import aiAutomation from "@/assets/ai-automation.jpg";
import multiDevice from "@/assets/multi-device.jpg";
import heroBg from "@/assets/hero-bg.jpg";
import dashboardPreview from "@/assets/dashboard-preview.jpg";
import teamCollab from "@/assets/team-collab.jpg";
import aiAutomation from "@/assets/ai-automation.jpg";
import multiDevice from "@/assets/multi-device.jpg";

const Index = () => {
  usePageTitle("", "NextWeb OS — the all-in-one business operating system. CRM, AI, invoicing, SEO, payroll, and 100+ modules for modern enterprises.");
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-sidebar text-primary-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-xl border-b border-sidebar-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
          <NWLogo />
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-sidebar-foreground hover:text-primary-foreground transition-colors">Features</a>
            <a href="#platform" className="text-sidebar-foreground hover:text-primary-foreground transition-colors">Platform</a>
            <a href="#pricing" className="text-sidebar-foreground hover:text-primary-foreground transition-colors">Pricing</a>
            <Link to="/web-development" className="text-sidebar-foreground hover:text-primary-foreground transition-colors">Services</Link>
            <Link to="/automation" className="text-sidebar-foreground hover:text-primary-foreground transition-colors">Automation</Link>
            <Link to="/about" className="text-sidebar-foreground hover:text-primary-foreground transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-sidebar-foreground hover:text-primary-foreground hover:bg-sidebar-accent">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-lg">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 min-h-screen flex items-center">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-sidebar/60 via-sidebar/40 to-sidebar" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-2 mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Trusted by 500+ Agencies Worldwide</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              The Ultimate{" "}
              <span className="text-gradient">Business Operating System</span>{" "}
              for Modern Enterprises
            </h1>
            <p className="text-lg md:text-xl text-sidebar-foreground mt-8 max-w-2xl mx-auto leading-relaxed">
              CRM, project management, invoicing, SEO, AI automation, field job tracking, payroll, and 100+ modules — unified in one powerful platform built for digital agencies and enterprises.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link to="/signup">
                <Button size="lg" className="bg-primary text-primary-foreground font-bold text-lg px-8 py-6 hover:bg-primary/90 shadow-2xl shadow-primary/30 transition-all hover:scale-105">
                  Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="border-primary/40 text-primary hover:bg-primary/10 px-8 py-6 text-lg">
                  Watch Demo
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-8 mt-12 text-sm text-sidebar-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> No credit card required</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> 14-day free trial</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Cancel anytime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="relative py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-info/20 to-primary/20 rounded-2xl blur-xl" />
            <img src={dashboardPreview} alt="NextWeb OS Dashboard — comprehensive CRM analytics and business intelligence" className="relative rounded-xl shadow-2xl shadow-primary/10 border border-primary/20 w-full" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 border-y border-sidebar-border bg-sidebar-accent">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "Agencies Trust Us" },
              { value: "100+", label: "Built-in Modules" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "50K+", label: "Active Users" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold text-gradient">{stat.value}</div>
                <div className="text-sidebar-foreground mt-2 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why NextWeb OS */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-2 mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Why Choose NextWeb OS</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold">
              Everything You Need to <span className="text-gradient">Run Your Business</span>
            </h2>
            <p className="text-sidebar-foreground mt-4 max-w-2xl mx-auto text-lg">
              Stop juggling 20 different tools. NextWeb OS consolidates your entire business operation into one elegant, powerful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Enterprise-Grade Security", desc: "Multi-tenant isolation, row-level security, audit logging, GDPR compliance, and role-based access control keep your data safe.", color: "bg-primary" },
              { icon: Brain, title: "AI-Powered Intelligence", desc: "Sales forecasting, lead scoring, churn prediction, and automated strategy recommendations driven by cutting-edge AI.", color: "bg-info" },
              { icon: Globe, title: "Multi-Tenant Architecture", desc: "Manage unlimited businesses from a single dashboard. Perfect for agencies managing multiple client accounts.", color: "bg-success" },
              { icon: TrendingUp, title: "Revenue Intelligence", desc: "Real-time revenue tracking, cohort analysis, investor dashboards, and predictive financial modeling.", color: "bg-warning" },
              { icon: Layers, title: "100+ Integrated Modules", desc: "CRM, projects, invoicing, SEO, payroll, field jobs, contracts, proposals — all in one seamless platform.", color: "bg-primary" },
              { icon: Smartphone, title: "Mobile-First Design", desc: "Native iOS and Android apps with offline capability. Your team stays productive anywhere, anytime.", color: "bg-info" },
            ].map((feature) => (
              <div key={feature.title} className="group relative bg-sidebar-accent border border-sidebar-border rounded-lg p-6 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                <div className={`h-12 w-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-primary-foreground mb-2">{feature.title}</h3>
                <p className="text-sidebar-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Overview with Image */}
      <section id="platform" className="py-20 md:py-32 bg-sidebar-accent">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-2 mb-6">
                <Monitor className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">Unified Platform</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                One Platform. <span className="text-gradient">Infinite Possibilities.</span>
              </h2>
              <p className="text-sidebar-foreground text-lg mb-8 leading-relaxed">
                NextWeb OS isn't just another SaaS tool — it's a complete business operating system designed for agencies that want to scale.
              </p>
              <div className="space-y-4">
                {[
                  "Complete CRM with deal pipeline and lead scoring",
                  "Project management with task tracking and timelines",
                  "Automated invoicing with payment gateway integration",
                  "SEO campaign management with ranking dashboards",
                  "Employee management with attendance and payroll",
                  "AI-driven insights and sales forecasting",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sidebar-foreground/90">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/signup" className="inline-block mt-8">
                <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
                  Explore All Features <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-info/10 rounded-2xl blur-xl" />
              <img src={teamCollab} alt="Professional team collaborating using NextWeb OS" className="relative rounded-xl shadow-2xl border border-primary/20 w-full" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* AI Engine Section */}
      <section id="ai" className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-info/10 to-primary/10 rounded-2xl blur-xl" />
              <img src={aiAutomation} alt="AI automation engine powering intelligent business decisions" className="relative rounded-xl shadow-2xl border border-info/20 w-full" loading="lazy" />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-info/15 border border-info/30 rounded-full px-4 py-2 mb-6">
                <Brain className="h-4 w-4 text-info" />
                <span className="text-sm text-info font-medium">AI-Powered Engine</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Intelligent Automation That <span className="text-gradient">Thinks Ahead</span>
              </h2>
              <p className="text-sidebar-foreground text-lg mb-8 leading-relaxed">
                Our AI engine doesn't just automate tasks — it anticipates your needs.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Target, label: "Lead Scoring" },
                  { icon: TrendingUp, label: "Sales Forecasting" },
                  { icon: Users, label: "Churn Prediction" },
                  { icon: Sparkles, label: "Strategy Engine" },
                  { icon: BarChart3, label: "Revenue Analytics" },
                  { icon: Zap, label: "Auto-Responses" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 bg-sidebar-accent rounded-lg p-3 border border-sidebar-border">
                    <item.icon className="h-5 w-5 text-primary" />
                    <span className="text-sm text-sidebar-foreground/90">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules" className="py-20 md:py-32 bg-sidebar-accent">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-2 mb-6">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Complete Module Suite</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold">
              <span className="text-gradient">100+ Modules</span> Built for Scale
            </h2>
            <p className="text-sidebar-foreground mt-4 max-w-2xl mx-auto text-lg">
              Every module is designed to work seamlessly together, creating an interconnected ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "CRM & Clients", desc: "360° client view" },
              { icon: Target, label: "Lead Management", desc: "Capture to conversion" },
              { icon: Briefcase, label: "Deal Pipeline", desc: "Visual sales funnel" },
              { icon: FileText, label: "Proposals", desc: "Generate & send" },
              { icon: Receipt, label: "Invoicing", desc: "Automated billing" },
              { icon: Calendar, label: "Scheduling", desc: "Team calendars" },
              { icon: MapPin, label: "Field Jobs", desc: "GPS & photo tracking" },
              { icon: BarChart3, label: "Analytics", desc: "Real-time insights" },
              { icon: Globe, label: "SEO Manager", desc: "Rankings & audits" },
              { icon: Phone, label: "Communications", desc: "Email, SMS, WhatsApp" },
              { icon: Lock, label: "Compliance", desc: "GDPR & data privacy" },
              { icon: Headphones, label: "Support Tickets", desc: "SLA management" },
              { icon: Award, label: "Payroll", desc: "Salary & attendance" },
              { icon: Shield, label: "Governance", desc: "Risk & controls" },
              { icon: Brain, label: "AI Agents", desc: "Autonomous tasks" },
              { icon: TrendingUp, label: "Investor Portal", desc: "Metrics & reports" },
            ].map((mod) => (
              <div key={mod.label} className="bg-sidebar border border-sidebar-border rounded-lg p-4 hover:border-primary/30 transition-all group">
                <mod.icon className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-semibold text-primary-foreground text-sm">{mod.label}</h4>
                <p className="text-sidebar-foreground text-xs mt-1">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Device Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-success/15 border border-success/30 rounded-full px-4 py-2 mb-6">
            <Smartphone className="h-4 w-4 text-success" />
            <span className="text-sm text-success font-medium">Works Everywhere</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Access Your Business From <span className="text-success">Any Device</span>
          </h2>
          <p className="text-sidebar-foreground max-w-2xl mx-auto text-lg mb-12">
            Native iOS and Android apps built with Capacitor. Your team can manage everything on the go.
          </p>
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-success/10 via-primary/10 to-info/10 rounded-2xl blur-xl" />
            <img src={multiDevice} alt="NextWeb OS running on mobile phone, tablet, and laptop" className="relative rounded-xl shadow-2xl border border-success/20 w-full" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-32 bg-sidebar-accent">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-warning/15 border border-warning/30 rounded-full px-4 py-2 mb-6">
              <Star className="h-4 w-4 text-warning" />
              <span className="text-sm text-warning font-medium">What Our Clients Say</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold">
              Trusted by <span className="text-gradient">Industry Leaders</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "NextWeb OS transformed how we manage our agency. We consolidated 12 different tools into one platform and saved over $2,000/month.", name: "Sarah Mitchell", title: "CEO, Digital Edge Agency", stars: 5 },
              { quote: "The AI-powered lead scoring alone has increased our conversion rate by 40%. The ROI on this platform is incredible.", name: "James Chen", title: "Sales Director, TechScale Solutions", stars: 5 },
              { quote: "Our field technicians love the mobile app. GPS check-ins, photo uploads, and job completion — all from their phones. Game changer.", name: "Maria Garcia", title: "Operations Manager, ProBuild Corp", stars: 5 },
            ].map((testimonial) => (
              <div key={testimonial.name} className="bg-sidebar border border-sidebar-border rounded-lg p-6 hover:border-primary/30 transition-all">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sidebar-foreground/90 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-primary-foreground">{testimonial.name}</div>
                  <div className="text-sm text-sidebar-foreground">{testimonial.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-2 mb-6">
              <Receipt className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Transparent Pricing in AUD</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Plans That <span className="text-gradient">Scale With You</span>
            </h2>
            <p className="text-sidebar-foreground max-w-2xl mx-auto text-lg">
              All prices in Australian Dollars (AUD). Paid month-on-month — no lock-in contracts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { plan: "Starter", price: "$499", period: "/mo AUD", desc: "For solo operators & small teams", features: ["Up to 5 users", "CRM & Lead Management", "Basic Invoicing", "Mobile App Access", "Email Support", "5 GB Storage"], highlight: false },
              { plan: "Professional", price: "$1,500", period: "/mo AUD", desc: "Our flagship plan for growing agencies", features: ["Unlimited users", "All 100+ Modules", "AI Engine & Automation", "WhatsApp & SMS Automation", "Priority Support", "Custom Branding", "API Access", "50 GB Storage", "Dedicated Account Manager"], highlight: true },
              { plan: "Business", price: "$3,500", period: "/mo AUD", desc: "Multi-location enterprises", features: ["Everything in Professional", "White-label Solution", "Multi-tenant Management", "Advanced AI Agents", "SLA Guarantee (99.9%)", "SSO & SAML Auth", "Unlimited Storage", "Custom Integrations", "24/7 Phone Support"], highlight: false },
              { plan: "Enterprise", price: "Custom", period: "", desc: "Tailored for large organizations", features: ["Everything in Business", "Dedicated Infrastructure", "On-premise Option", "Custom Development", "Onboarding & Training", "Compliance & Audit Support", "Executive Dashboard", "Franchise Blueprint", "Strategic Advisory"], highlight: false },
            ].map((tier) => (
              <div key={tier.plan} className={`relative rounded-lg p-6 border transition-all flex flex-col ${tier.highlight ? "bg-gradient-to-b from-sidebar-accent to-sidebar border-primary/50 shadow-xl shadow-primary/10 lg:scale-105 z-10" : "bg-sidebar border-sidebar-border hover:border-primary/30"}`}>
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-lg font-semibold text-primary-foreground">{tier.plan}</h3>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gradient">{tier.price}</span>
                  <span className="text-sidebar-foreground text-sm">{tier.period}</span>
                </div>
                <p className="text-sidebar-foreground text-sm mt-2">{tier.desc}</p>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-sidebar-foreground/90">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to={tier.plan === "Enterprise" ? "/demo" : "/signup"} className="block mt-6">
                  <Button className={`w-full ${tier.highlight ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90" : "bg-sidebar-accent text-primary-foreground hover:bg-sidebar-border"}`}>
                    {tier.plan === "Enterprise" ? "Contact Sales" : "Start Free Trial"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Payment Options */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-sidebar-accent border border-sidebar-border rounded-lg p-8">
              <h3 className="text-xl font-bold text-primary-foreground text-center mb-6">Flexible Payment Options</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { emoji: "💳", title: "Credit / Debit Card", desc: "Visa, Mastercard, Amex — auto-charged monthly" },
                  { emoji: "🏦", title: "Bank Transfer / Direct Debit", desc: "AU direct debit via eWAY or manual bank transfer" },
                  { emoji: "📄", title: "Invoice / Purchase Order", desc: "Net-30 invoicing for Enterprise & Government clients" },
                ].map((opt) => (
                  <div key={opt.title} className="text-center p-4 rounded-lg bg-sidebar border border-sidebar-border">
                    <div className="text-2xl mb-2">{opt.emoji}</div>
                    <h4 className="font-semibold text-primary-foreground text-sm">{opt.title}</h4>
                    <p className="text-sidebar-foreground text-xs mt-1">{opt.desc}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-6 mt-6 text-xs text-sidebar-foreground">
                {["No lock-in contracts", "Month-on-month billing", "14-day free trial", "Cancel anytime", "All prices in AUD"].map(t => (
                  <span key={t} className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> {t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-info/10 to-primary/10" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Transform <span className="text-gradient">Your Business?</span>
          </h2>
          <p className="text-sidebar-foreground max-w-2xl mx-auto text-lg mb-10">
            Join 500+ agencies already using NextWeb OS to streamline operations, boost revenue, and scale with confidence.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-primary text-primary-foreground font-bold text-lg px-10 py-6 hover:bg-primary/90 shadow-2xl shadow-primary/30 transition-all hover:scale-105">
              Start Free Today <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <PremiumFooter />
    </div>
  );
};

export default Index;
