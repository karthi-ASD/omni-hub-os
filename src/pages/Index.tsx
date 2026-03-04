import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2, ArrowRight, Shield, Zap, BarChart3, Users, Globe, Brain,
  FileText, Phone, Calendar, Target, TrendingUp, Lock, Layers, Star,
  CheckCircle2, ChevronRight, Briefcase, Receipt, MapPin, Headphones,
  Smartphone, Monitor, Tablet, Award, Sparkles
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import dashboardPreview from "@/assets/dashboard-preview.jpg";
import teamCollab from "@/assets/team-collab.jpg";
import aiAutomation from "@/assets/ai-automation.jpg";
import multiDevice from "@/assets/multi-device.jpg";

const Index = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4a853] border-t-transparent" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-[#d4a853]/20">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#d4a853] to-[#b8902e] flex items-center justify-center shadow-lg shadow-[#d4a853]/20">
              <Building2 className="h-5 w-5 text-[#0a0e1a]" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">
              NextWeb OS
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-gray-400 hover:text-[#d4a853] transition-colors">Features</a>
            <a href="#platform" className="text-gray-400 hover:text-[#d4a853] transition-colors">Platform</a>
            <a href="#ai" className="text-gray-400 hover:text-[#d4a853] transition-colors">AI Engine</a>
            <a href="#modules" className="text-gray-400 hover:text-[#d4a853] transition-colors">Modules</a>
            <a href="#testimonials" className="text-gray-400 hover:text-[#d4a853] transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-[#d4a853] hover:bg-[#d4a853]/10">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold hover:from-[#e0b85e] hover:to-[#c99d3a] shadow-lg shadow-[#d4a853]/25">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 min-h-screen flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a]/60 via-[#0a0e1a]/40 to-[#0a0e1a]" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full px-4 py-2 mb-8">
              <Sparkles className="h-4 w-4 text-[#d4a853]" />
              <span className="text-sm text-[#d4a853] font-medium">Trusted by 500+ Agencies Worldwide</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              The Ultimate{" "}
              <span className="bg-gradient-to-r from-[#d4a853] via-[#f0d48a] to-[#d4a853] bg-clip-text text-transparent">
                Business Operating System
              </span>{" "}
              for Modern Enterprises
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mt-8 max-w-2xl mx-auto leading-relaxed">
              CRM, project management, invoicing, SEO, AI automation, field job tracking, payroll, and 100+ modules — unified in one powerful platform built for digital agencies and enterprises.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-bold text-lg px-8 py-6 hover:from-[#e0b85e] hover:to-[#c99d3a] shadow-2xl shadow-[#d4a853]/30 transition-all hover:scale-105">
                  Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="border-[#d4a853]/40 text-[#d4a853] hover:bg-[#d4a853]/10 px-8 py-6 text-lg">
                  Watch Demo
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-8 mt-12 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="relative py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#d4a853]/20 via-[#2563eb]/20 to-[#d4a853]/20 rounded-2xl blur-xl" />
            <img
              src={dashboardPreview}
              alt="NextWeb OS Dashboard — comprehensive CRM analytics and business intelligence"
              className="relative rounded-xl shadow-2xl shadow-[#d4a853]/10 border border-[#d4a853]/20 w-full"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 border-y border-[#d4a853]/10 bg-[#0d1225]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "Agencies Trust Us" },
              { value: "100+", label: "Built-in Modules" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "50K+", label: "Active Users" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-400 mt-2 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why NextWeb OS */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#2563eb]/10 border border-[#2563eb]/30 rounded-full px-4 py-2 mb-6">
              <Zap className="h-4 w-4 text-[#2563eb]" />
              <span className="text-sm text-[#2563eb] font-medium">Why Choose NextWeb OS</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-[#2563eb] to-[#0ea5e9] bg-clip-text text-transparent">
                Run Your Business
              </span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-lg">
              Stop juggling 20 different tools. NextWeb OS consolidates your entire business operation into one elegant, powerful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Enterprise-Grade Security", desc: "Multi-tenant isolation, row-level security, audit logging, GDPR compliance, and role-based access control keep your data safe.", color: "from-[#d4a853] to-[#b8902e]" },
              { icon: Brain, title: "AI-Powered Intelligence", desc: "Sales forecasting, lead scoring, churn prediction, and automated strategy recommendations driven by cutting-edge AI.", color: "from-[#2563eb] to-[#0ea5e9]" },
              { icon: Globe, title: "Multi-Tenant Architecture", desc: "Manage unlimited businesses from a single dashboard. Perfect for agencies managing multiple client accounts.", color: "from-[#22c55e] to-[#16a34a]" },
              { icon: TrendingUp, title: "Revenue Intelligence", desc: "Real-time revenue tracking, cohort analysis, investor dashboards, and predictive financial modeling.", color: "from-[#f59e0b] to-[#d97706]" },
              { icon: Layers, title: "100+ Integrated Modules", desc: "CRM, projects, invoicing, SEO, payroll, field jobs, contracts, proposals — all in one seamless platform.", color: "from-[#8b5cf6] to-[#7c3aed]" },
              { icon: Smartphone, title: "Mobile-First Design", desc: "Native iOS and Android apps with offline capability. Your team stays productive anywhere, anytime.", color: "from-[#ec4899] to-[#db2777]" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative bg-[#111832] border border-[#1e2a4a] rounded-xl p-6 hover:border-[#d4a853]/40 transition-all duration-300 hover:shadow-xl hover:shadow-[#d4a853]/5"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Overview with Image */}
      <section id="platform" className="py-20 md:py-32 bg-[#0d1225]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full px-4 py-2 mb-6">
                <Monitor className="h-4 w-4 text-[#d4a853]" />
                <span className="text-sm text-[#d4a853] font-medium">Unified Platform</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                One Platform.{" "}
                <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">
                  Infinite Possibilities.
                </span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                NextWeb OS isn't just another SaaS tool — it's a complete business operating system designed for agencies that want to scale. From the first client inquiry to final invoice, every touchpoint is tracked, automated, and optimized.
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
                    <CheckCircle2 className="h-5 w-5 text-[#d4a853] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/signup" className="inline-block mt-8">
                <Button className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold hover:from-[#e0b85e] hover:to-[#c99d3a]">
                  Explore All Features <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#d4a853]/10 to-[#2563eb]/10 rounded-2xl blur-xl" />
              <img
                src={teamCollab}
                alt="Professional team collaborating using NextWeb OS analytics dashboards"
                className="relative rounded-xl shadow-2xl border border-[#d4a853]/20 w-full"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI Engine Section */}
      <section id="ai" className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#2563eb]/10 to-[#d4a853]/10 rounded-2xl blur-xl" />
              <img
                src={aiAutomation}
                alt="AI automation engine powering intelligent business decisions"
                className="relative rounded-xl shadow-2xl border border-[#2563eb]/20 w-full"
                loading="lazy"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-[#2563eb]/10 border border-[#2563eb]/30 rounded-full px-4 py-2 mb-6">
                <Brain className="h-4 w-4 text-[#2563eb]" />
                <span className="text-sm text-[#2563eb] font-medium">AI-Powered Engine</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Intelligent Automation That{" "}
                <span className="bg-gradient-to-r from-[#2563eb] to-[#0ea5e9] bg-clip-text text-transparent">
                  Thinks Ahead
                </span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Our AI engine doesn't just automate tasks — it anticipates your needs. From predicting which leads will convert to identifying clients at risk of churning, NextWeb OS keeps you three steps ahead.
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
                  <div key={item.label} className="flex items-center gap-3 bg-[#111832] rounded-lg p-3 border border-[#1e2a4a]">
                    <item.icon className="h-5 w-5 text-[#2563eb]" />
                    <span className="text-sm text-gray-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules" className="py-20 md:py-32 bg-[#0d1225]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full px-4 py-2 mb-6">
              <Layers className="h-4 w-4 text-[#d4a853]" />
              <span className="text-sm text-[#d4a853] font-medium">Complete Module Suite</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">
                100+ Modules
              </span>{" "}
              Built for Scale
            </h2>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-lg">
              Every module is designed to work seamlessly together, creating an interconnected ecosystem that powers your entire operation.
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
              <div
                key={mod.label}
                className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-4 hover:border-[#d4a853]/30 transition-all group"
              >
                <mod.icon className="h-8 w-8 text-[#d4a853] mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-semibold text-white text-sm">{mod.label}</h4>
                <p className="text-gray-500 text-xs mt-1">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Device Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-4 py-2 mb-6">
            <Smartphone className="h-4 w-4 text-[#22c55e]" />
            <span className="text-sm text-[#22c55e] font-medium">Works Everywhere</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Access Your Business From{" "}
            <span className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] bg-clip-text text-transparent">
              Any Device
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-12">
            Native iOS and Android apps built with Capacitor. Your team can manage everything on the go — check in to jobs, log calls, create invoices, and more.
          </p>
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#22c55e]/10 via-[#d4a853]/10 to-[#2563eb]/10 rounded-2xl blur-xl" />
            <img
              src={multiDevice}
              alt="NextWeb OS running on mobile phone, tablet, and laptop — seamless multi-device experience"
              className="relative rounded-xl shadow-2xl border border-[#22c55e]/20 w-full"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-32 bg-[#0d1225]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full px-4 py-2 mb-6">
              <Star className="h-4 w-4 text-[#d4a853]" />
              <span className="text-sm text-[#d4a853] font-medium">What Our Clients Say</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold">
              Trusted by{" "}
              <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">
                Industry Leaders
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "NextWeb OS transformed how we manage our agency. We consolidated 12 different tools into one platform and saved over $2,000/month.",
                name: "Sarah Mitchell",
                title: "CEO, Digital Edge Agency",
                stars: 5,
              },
              {
                quote: "The AI-powered lead scoring alone has increased our conversion rate by 40%. The ROI on this platform is incredible.",
                name: "James Chen",
                title: "Sales Director, TechScale Solutions",
                stars: 5,
              },
              {
                quote: "Our field technicians love the mobile app. GPS check-ins, photo uploads, and job completion — all from their phones. Game changer.",
                name: "Maria Garcia",
                title: "Operations Manager, ProBuild Corp",
                stars: 5,
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-6 hover:border-[#d4a853]/30 transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#d4a853] text-[#d4a853]" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Simple,{" "}
              <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">
                Transparent Pricing
              </span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-lg">
              Start free, scale as you grow. No hidden fees, no surprises.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                plan: "Starter",
                price: "Free",
                desc: "Perfect for solo entrepreneurs",
                features: ["Up to 3 users", "CRM & Lead Management", "Basic Invoicing", "Mobile App Access"],
                highlight: false,
              },
              {
                plan: "Professional",
                price: "$49/mo",
                desc: "For growing agencies",
                features: ["Unlimited users", "All 100+ Modules", "AI Engine & Automation", "Priority Support", "Custom Branding"],
                highlight: true,
              },
              {
                plan: "Enterprise",
                price: "Custom",
                desc: "For large organizations",
                features: ["Dedicated Infrastructure", "SLA Guarantee", "White-label Solution", "Onboarding & Training", "24/7 Phone Support"],
                highlight: false,
              },
            ].map((tier) => (
              <div
                key={tier.plan}
                className={`relative rounded-xl p-6 border transition-all ${
                  tier.highlight
                    ? "bg-gradient-to-b from-[#1a2244] to-[#111832] border-[#d4a853]/50 shadow-xl shadow-[#d4a853]/10 scale-105"
                    : "bg-[#111832] border-[#1e2a4a] hover:border-[#d4a853]/30"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-lg font-semibold text-white">{tier.plan}</h3>
                <div className="mt-4">
                  <span className="text-3xl font-bold bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">
                    {tier.price}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-2">{tier.desc}</p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="h-4 w-4 text-[#d4a853] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="block mt-6">
                  <Button
                    className={`w-full ${
                      tier.highlight
                        ? "bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold hover:from-[#e0b85e] hover:to-[#c99d3a]"
                        : "bg-[#1e2a4a] text-white hover:bg-[#2a3660]"
                    }`}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#d4a853]/10 via-[#2563eb]/10 to-[#d4a853]/10" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Transform{" "}
            <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">
              Your Business?
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-10">
            Join 500+ agencies already using NextWeb OS to streamline operations, boost revenue, and scale with confidence. Your competitors are already here.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-bold text-lg px-10 py-6 hover:from-[#e0b85e] hover:to-[#c99d3a] shadow-2xl shadow-[#d4a853]/30 transition-all hover:scale-105">
                Start Free Today <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#d4a853]/10 bg-[#080b16] py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#d4a853] to-[#b8902e] flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-[#0a0e1a]" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">
                  NextWeb OS
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                The complete business operating system for modern digital agencies and enterprises.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-[#d4a853] transition-colors">Features</a></li>
                <li><a href="#modules" className="hover:text-[#d4a853] transition-colors">Modules</a></li>
                <li><a href="#ai" className="hover:text-[#d4a853] transition-colors">AI Engine</a></li>
                <li><Link to="/login" className="hover:text-[#d4a853] transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-[#d4a853] transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-[#d4a853] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[#d4a853] transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[#d4a853] transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-[#d4a853] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#d4a853] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#d4a853] transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-[#d4a853] transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#1e2a4a] pt-8 text-center text-sm text-gray-600">
            © {new Date().getFullYear()} NextWeb OS. All rights reserved. Built with ❤️ for agencies that dream big.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
