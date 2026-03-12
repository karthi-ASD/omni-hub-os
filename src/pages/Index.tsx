import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AuthDiagnostics from "@/components/AuthDiagnostics";
import { JsonLdScript, organizationJsonLd, buildBreadcrumbJsonLd } from "@/components/public/JsonLd";
import {
  ArrowRight, Shield, Zap, BarChart3, Users, Globe, Brain,
  CheckCircle2, ChevronRight, Smartphone, Monitor, Search,
  Headphones, Receipt, Mail, ShoppingCart, PieChart, Link2,
  Code2, Briefcase, Star, Target, TrendingUp, Layers, Lock,
  Palette, Server, GraduationCap, Landmark, Home, Factory,
  Plane, DollarSign, Film, Store, Leaf, Award, Sparkles, Phone, MapPin,
} from "lucide-react";

const Index = () => {
  usePageTitle(
    "NextWeb OS | CRM, AI, App Development, Website Design & Digital Growth in Australia",
    "NextWeb OS is an all-in-one platform for CRM, AI, websites, apps, SEO, payroll, and business operations, serving Australia with focus on Brisbane and Gold Coast."
  );
  const { session, loading } = useAuth();

  const homepageJsonLd = [
    organizationJsonLd,
    buildBreadcrumbJsonLd([{ name: "Home", url: "/" }]),
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(222,47%,8%)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(190,80%,55%)] border-t-transparent" />
        <AuthDiagnostics />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  const nw = {
    navy: "hsl(222,47%,8%)",
    navyLight: "hsl(222,35%,12%)",
    navyMid: "hsl(222,30%,16%)",
    aqua: "hsl(190,80%,55%)",
    aquaDark: "hsl(190,80%,45%)",
    white: "#ffffff",
    textMuted: "hsl(210,20%,65%)",
    textDim: "hsl(210,20%,50%)",
  };

  const platformModules = [
    { icon: Users, label: "Customer 360", desc: "Unified view across sales, service & ops", to: "/platform/customer-360" },
    { icon: BarChart3, label: "Sales CRM", desc: "Leads, pipelines, forecasting & analytics", to: "/platform/sales-crm" },
    { icon: Headphones, label: "Service CRM", desc: "Tickets, routing & faster resolution", to: "/platform/service-crm" },
    { icon: Mail, label: "Marketing Automation", desc: "Campaigns, segmentation & nurturing", to: "/platform/marketing-automation" },
    { icon: ShoppingCart, label: "Commerce", desc: "Storefronts, catalogues & payments", to: "/platform/commerce" },
    { icon: PieChart, label: "Analytics & BI", desc: "Dashboards, reports & intelligence", to: "/platform/analytics" },
    { icon: Link2, label: "Integration", desc: "APIs, connectors & data sync", to: "/platform/integration" },
    { icon: Brain, label: "AI Automation", desc: "Intelligent workflows & predictions", to: "/platform/ai-automation" },
    { icon: Shield, label: "Security", desc: "Encryption, RLS & compliance", to: "/platform/security" },
  ];

  const serviceCapabilities = [
    { icon: Palette, label: "Website Design", to: "/services/website-design" },
    { icon: Smartphone, label: "App Development", to: "/services/app-development" },
    { icon: Search, label: "SEO", to: "/services/search-engine-optimization" },
    { icon: Users, label: "CRM", to: "/services/crm" },
    { icon: Brain, label: "AI Solutions", to: "/services/artificial-intelligence" },
    { icon: Server, label: "DevOps", to: "/services/devops" },
    { icon: PieChart, label: "Business Intelligence", to: "/services/business-intelligence" },
    { icon: ShoppingCart, label: "eCommerce", to: "/services/ecommerce-design" },
  ];

  const industries = [
    { icon: Briefcase, label: "Healthcare", to: "/industries/healthcare" },
    { icon: GraduationCap, label: "Education", to: "/industries/education" },
    { icon: DollarSign, label: "Finance", to: "/industries/finance" },
    { icon: Landmark, label: "Government", to: "/industries/government" },
    { icon: Home, label: "Real Estate", to: "/industries/real-estate" },
    { icon: Plane, label: "Travel & Tourism", to: "/industries/travel-tourism" },
    { icon: Factory, label: "Manufacturing", to: "/industries/manufacturing" },
    { icon: Store, label: "Retail", to: "/industries/retail" },
    { icon: Monitor, label: "Software & Tech", to: "/industries/software-technology" },
  ];

  const whyChoose = [
    { icon: Code2, title: "Technical Expertise", desc: "World-class engineers across CRM, AI, cloud, mobile, and enterprise systems." },
    { icon: Zap, title: "Agile Methodology", desc: "Rapid delivery with iterative development, continuous feedback, and fast time to value." },
    { icon: Users, title: "Client-Centric Approach", desc: "Every solution is built around your unique business requirements and growth goals." },
    { icon: Brain, title: "Innovation Culture", desc: "Cutting-edge AI, automation, and emerging tech baked into everything we build." },
    { icon: Award, title: "Long-Term Partnership", desc: "We don't just deliver and disappear — we grow with you as your strategic technology partner." },
  ];

  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,6%)] via-[hsl(222,47%,10%)] to-[hsl(200,40%,10%)]" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 -left-20 w-[500px] h-[500px] bg-[hsl(190,80%,55%)]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-[hsl(252,85%,60%)]/8 rounded-full blur-[140px]" />
        </div>
        <div className="container mx-auto px-4 md:px-8 relative z-10 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[hsl(190,80%,55%)]/10 border border-[hsl(190,80%,55%)]/25 rounded-full px-5 py-2 mb-8">
              <Sparkles className="h-4 w-4 text-[hsl(190,80%,55%)]" />
              <span className="text-sm text-[hsl(190,80%,55%)] font-medium">Australia's All-in-One Business Platform</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Your Complete{" "}
              <span className="bg-gradient-to-r from-[hsl(190,80%,55%)] to-[hsl(252,85%,65%)] bg-clip-text text-transparent">
                Business Operating System
              </span>
            </h1>
            <p className="text-lg md:text-xl text-[hsl(210,20%,65%)] mt-8 max-w-3xl mx-auto leading-relaxed">
              CRM, AI, app development, website design, SEO, marketing, invoicing, payroll, and 100+ integrated modules —
              built for Australian businesses with a focus on Brisbane and Gold Coast.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link to="/demo">
                <Button size="lg" className="bg-[hsl(190,80%,45%)] text-white font-bold text-lg px-8 py-6 hover:bg-[hsl(190,80%,40%)] shadow-2xl shadow-[hsl(190,80%,45%)]/30 transition-all hover:scale-105">
                  Book a Demo <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="border-[hsl(190,80%,55%)]/30 text-[hsl(190,80%,55%)] hover:bg-[hsl(190,80%,55%)]/10 px-8 py-6 text-lg">
                  Request a Quote
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-[hsl(210,20%,55%)]">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[hsl(152,60%,48%)]" /> No credit card required</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[hsl(152,60%,48%)]" /> Brisbane & Gold Coast based</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[hsl(152,60%,48%)]" /> Australian owned & operated</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST RIBBON ─── */}
      <section className="py-12 border-y border-[hsl(222,30%,14%)] bg-[hsl(222,47%,6%)]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-[hsl(210,20%,45%)]">
            {["Government Approved Supplier", "Enterprise Security", "99.9% Uptime SLA", "ISO Compliant", "GDPR Ready", "SOC 2 Certified"].map((badge) => (
              <div key={badge} className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4 text-[hsl(190,80%,55%)]" />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PLATFORM OVERVIEW ─── */}
      <section className="py-20 md:py-28 bg-[hsl(222,47%,8%)]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">NextWeb OS Platform</span>
            <h2 className="text-3xl md:text-5xl font-bold">
              One Platform.{" "}
              <span className="bg-gradient-to-r from-[hsl(190,80%,55%)] to-[hsl(252,85%,65%)] bg-clip-text text-transparent">
                Every Department.
              </span>
            </h2>
            <p className="text-[hsl(210,20%,60%)] mt-4 max-w-2xl mx-auto text-lg">
              A unified record across sales, service, marketing, finance, operations, and reporting — powering your entire business from one dashboard.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {platformModules.map((mod) => (
              <Link
                key={mod.label}
                to={mod.to}
                className="group bg-[hsl(222,35%,11%)] border border-[hsl(222,30%,16%)] rounded-xl p-6 hover:border-[hsl(190,80%,55%)]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[hsl(190,80%,55%)]/5"
              >
                <mod.icon className="h-10 w-10 text-[hsl(190,80%,55%)] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-1">{mod.label}</h3>
                <p className="text-[hsl(210,20%,55%)] text-sm leading-relaxed">{mod.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICE CAPABILITY STRIP ─── */}
      <section className="py-16 bg-[hsl(222,35%,11%)] border-y border-[hsl(222,30%,14%)]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">Our Services</span>
            <h2 className="text-3xl md:text-4xl font-bold">
              Full-Stack Digital Capabilities
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {serviceCapabilities.map((svc) => (
              <Link
                key={svc.label}
                to={svc.to}
                className="group flex flex-col items-center text-center p-6 rounded-xl bg-[hsl(222,47%,8%)] border border-[hsl(222,30%,16%)] hover:border-[hsl(190,80%,55%)]/30 transition-all"
              >
                <svc.icon className="h-8 w-8 text-[hsl(190,80%,55%)] mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-white">{svc.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INDUSTRY SOLUTIONS ─── */}
      <section className="py-20 md:py-28 bg-[hsl(222,47%,8%)]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">Industry Solutions</span>
            <h2 className="text-3xl md:text-5xl font-bold">
              Built for{" "}
              <span className="bg-gradient-to-r from-[hsl(190,80%,55%)] to-[hsl(152,60%,48%)] bg-clip-text text-transparent">
                Your Industry
              </span>
            </h2>
            <p className="text-[hsl(210,20%,60%)] mt-4 max-w-2xl mx-auto text-lg">
              Tailored digital solutions combining CRM, AI, apps, websites, marketing, and automation for every vertical.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
            {industries.map((ind) => (
              <Link
                key={ind.label}
                to={ind.to}
                className="group flex items-center gap-4 bg-[hsl(222,35%,11%)] border border-[hsl(222,30%,16%)] rounded-xl p-5 hover:border-[hsl(190,80%,55%)]/30 transition-all"
              >
                <div className="h-12 w-12 rounded-lg bg-[hsl(190,80%,55%)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(190,80%,55%)]/15 transition-colors">
                  <ind.icon className="h-6 w-6 text-[hsl(190,80%,55%)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{ind.label}</h3>
                  <span className="text-xs text-[hsl(210,20%,50%)]">View solutions →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE NEXTWEB ─── */}
      <section className="py-20 md:py-28 bg-[hsl(222,35%,11%)] border-y border-[hsl(222,30%,14%)]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">Why NextWeb</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Your Strategic Technology Partner in Australia
              </h2>
              <p className="text-[hsl(210,20%,60%)] text-lg mb-8 leading-relaxed">
                With deep expertise in CRM, AI, cloud, mobile, and enterprise systems, we deliver end-to-end digital transformation — from Brisbane and Gold Coast to businesses across Australia.
              </p>
              <div className="space-y-5">
                {whyChoose.map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-[hsl(190,80%,55%)]/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-[hsl(190,80%,55%)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                      <p className="text-sm text-[hsl(210,20%,55%)] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-[hsl(190,80%,55%)]/5 to-[hsl(252,85%,60%)]/5 rounded-2xl p-8 border border-[hsl(222,30%,16%)]">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { value: "500+", label: "Clients Served" },
                    { value: "15+", label: "Years Experience" },
                    { value: "100+", label: "Platform Modules" },
                    { value: "99.9%", label: "Uptime SLA" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-4">
                      <div className="text-3xl font-bold bg-gradient-to-r from-[hsl(190,80%,55%)] to-[hsl(252,85%,65%)] bg-clip-text text-transparent">
                        {stat.value}
                      </div>
                      <div className="text-[hsl(210,20%,55%)] text-sm mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MOBILE TECHNOLOGY ─── */}
      <section className="py-20 md:py-28 bg-[hsl(222,47%,8%)]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">Mobile Technology</span>
            <h2 className="text-3xl md:text-5xl font-bold">
              Your Business,{" "}
              <span className="bg-gradient-to-r from-[hsl(190,80%,55%)] to-[hsl(152,60%,48%)] bg-clip-text text-transparent">
                Everywhere
              </span>
            </h2>
            <p className="text-[hsl(210,20%,60%)] mt-4 max-w-2xl mx-auto text-lg">
              Android, iPhone, iPad, hybrid, native cloud apps, and mobile-optimized websites — built for teams that move fast.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Smartphone, label: "Android" },
              { icon: Smartphone, label: "iPhone" },
              { icon: Monitor, label: "iPad" },
              { icon: Layers, label: "Hybrid" },
              { icon: Globe, label: "Cloud Apps" },
              { icon: Code2, label: "Mobile Web" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center text-center p-5 rounded-xl bg-[hsl(222,35%,11%)] border border-[hsl(222,30%,16%)]">
                <item.icon className="h-8 w-8 text-[hsl(190,80%,55%)] mb-3" />
                <span className="text-sm font-medium text-white">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SEO & GROWTH ─── */}
      <section className="py-20 md:py-28 bg-[hsl(222,35%,11%)] border-y border-[hsl(222,30%,14%)]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">SEO & Digital Growth</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Dominate Search in Brisbane, Gold Coast & Beyond
              </h2>
              <p className="text-[hsl(210,20%,60%)] text-lg mb-8 leading-relaxed">
                Our integrated SEO OS combines technical SEO, on-page optimization, local search, content strategy, and analytics into one powerful growth engine.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {["Technical SEO", "On-Page SEO", "Local SEO", "Content Strategy", "SEM & PPC", "Social Media", "Email Marketing", "Analytics & Reporting"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-[hsl(210,20%,70%)]">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(190,80%,55%)] flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <Link to="/services/search-engine-optimization" className="inline-block mt-8">
                <Button className="bg-[hsl(190,80%,45%)] text-white font-semibold hover:bg-[hsl(190,80%,40%)]">
                  Explore SEO Services <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-[hsl(190,80%,55%)]/5 to-[hsl(152,60%,48%)]/5 rounded-2xl p-8 border border-[hsl(222,30%,16%)]">
              <div className="space-y-4">
                {[
                  { label: "Organic Traffic Growth", value: "+340%" },
                  { label: "First Page Rankings", value: "85+" },
                  { label: "Local Pack Appearances", value: "3x" },
                  { label: "Client Retention Rate", value: "97%" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between p-4 rounded-lg bg-[hsl(222,47%,8%)] border border-[hsl(222,30%,16%)]">
                    <span className="text-sm text-[hsl(210,20%,65%)]">{stat.label}</span>
                    <span className="text-lg font-bold text-[hsl(190,80%,55%)]">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CASE STUDIES / SUCCESS ─── */}
      <section className="py-20 md:py-28 bg-[hsl(222,47%,8%)]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">Success Stories</span>
            <h2 className="text-3xl md:text-5xl font-bold">
              Trusted by{" "}
              <span className="bg-gradient-to-r from-[hsl(190,80%,55%)] to-[hsl(252,85%,65%)] bg-clip-text text-transparent">
                Industry Leaders
              </span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "NextWeb OS transformed how we manage our agency. We consolidated 12 tools into one platform and saved over $2,000/month.", name: "Sarah Mitchell", title: "CEO, Digital Edge Agency", metric: "$24K saved annually" },
              { quote: "The AI-powered CRM alone increased our conversion rate by 40%. The ROI on this platform is incredible for our Brisbane operations.", name: "James Chen", title: "Sales Director, TechScale Solutions", metric: "40% conversion lift" },
              { quote: "From website design to SEO to CRM — having everything integrated under one roof on the Gold Coast has been a game changer.", name: "Maria Garcia", title: "Operations Manager, ProBuild Corp", metric: "3x lead generation" },
            ].map((t) => (
              <div key={t.name} className="bg-[hsl(222,35%,11%)] border border-[hsl(222,30%,16%)] rounded-xl p-6 hover:border-[hsl(190,80%,55%)]/30 transition-all">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[hsl(38,92%,50%)] text-[hsl(38,92%,50%)]" />
                  ))}
                </div>
                <p className="text-[hsl(210,20%,70%)] mb-6 leading-relaxed italic">"{t.quote}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-sm">{t.name}</div>
                    <div className="text-xs text-[hsl(210,20%,50%)]">{t.title}</div>
                  </div>
                  <div className="text-xs font-bold text-[hsl(190,80%,55%)] bg-[hsl(190,80%,55%)]/10 px-3 py-1 rounded-full">{t.metric}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(190,80%,55%)]/10 via-[hsl(252,85%,60%)]/8 to-[hsl(190,80%,55%)]/10" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[hsl(190,80%,55%)]/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[hsl(252,85%,60%)]/6 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-[hsl(210,20%,65%)] max-w-2xl mx-auto text-lg mb-6">
            Contact our team in Brisbane or Gold Coast for a free strategy session. Let's discuss how NextWeb OS can accelerate your digital transformation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link to="/contact">
              <Button size="lg" className="bg-[hsl(190,80%,45%)] text-white font-bold text-lg px-10 py-6 hover:bg-[hsl(190,80%,40%)] shadow-2xl shadow-[hsl(190,80%,45%)]/30 transition-all hover:scale-105">
                Get a Free Quote <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="outline" size="lg" className="border-[hsl(190,80%,55%)]/30 text-[hsl(190,80%,55%)] hover:bg-[hsl(190,80%,55%)]/10 px-10 py-6 text-lg">
                Book a Demo
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-[hsl(210,20%,50%)]">
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[hsl(190,80%,55%)]" /> Brisbane & Gold Coast</span>
            <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-[hsl(190,80%,55%)]" /> 1300 NEXTWEB</span>
            <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-[hsl(190,80%,55%)]" /> hello@nextweb.com.au</span>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;
