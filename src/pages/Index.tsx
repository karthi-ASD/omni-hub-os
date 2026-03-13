import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AuthDiagnostics from "@/components/AuthDiagnostics";
import { JsonLdScript, organizationJsonLd, buildBreadcrumbJsonLd } from "@/components/public/JsonLd";
import { useRef, useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight, Shield, Zap, BarChart3, Users, Globe, Brain,
  CheckCircle2, ChevronRight, Smartphone, Monitor, Search,
  Headphones, Receipt, Mail, ShoppingCart, PieChart, Link2,
  Code2, Briefcase, Star, Target, TrendingUp, Layers, Lock,
  Palette, Server, GraduationCap, Landmark, Home, Factory,
  Plane, DollarSign, Film, Store, Leaf, Award, Sparkles, Phone, MapPin,
} from "lucide-react";

/* ─── Reusable scroll-reveal wrapper ─── */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Animated counter ─── */
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 50, damping: 20 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, value, motionVal]);

  useEffect(() => {
    return spring.on("change", (v) => setDisplay(Math.round(v).toString()));
  }, [spring]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/* ─── Floating orb background ─── */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-[hsl(190,80%,55%)]/8 blur-[140px]"
        animate={{ x: [0, 80, 0], y: [0, -60, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "10%", left: "-5%" }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-[hsl(252,85%,60%)]/6 blur-[120px]"
        animate={{ x: [0, -60, 0], y: [0, 80, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "40%", right: "-5%" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full bg-[hsl(152,60%,48%)]/5 blur-[100px]"
        animate={{ x: [0, 50, 0], y: [0, 50, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        style={{ bottom: "5%", left: "30%" }}
      />
    </div>
  );
}

const Index = () => {
  usePageTitle(
    "NextWeb OS | CRM, AI, App Development, Website Design & Digital Growth in Australia",
    "NextWeb OS is an all-in-one platform for CRM, AI, websites, apps, SEO, payroll, and business operations, serving Australia with focus on Brisbane and Gold Coast."
  );
  const { session, loading } = useAuth();
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(heroScroll, [0, 1], [1, 1.15]);
  const heroOpacity = useTransform(heroScroll, [0, 0.8], [1, 0]);
  const heroY = useTransform(heroScroll, [0, 1], [0, 100]);

  // Horizontal scroll section
  const hScrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: hScrollProgress } = useScroll({ target: hScrollRef, offset: ["start end", "end start"] });
  const hScrollX = useTransform(hScrollProgress, [0.2, 0.8], ["0%", "-60%"]);

  const homepageJsonLd = [organizationJsonLd, buildBreadcrumbJsonLd([{ name: "Home", url: "/" }])];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(222,47%,8%)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(190,80%,55%)] border-t-transparent" />
        <AuthDiagnostics />
      </div>
    );
  }
  if (session) return <Navigate to="/dashboard" replace />;

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

  const featureStories = [
    { tag: "AI-Powered CRM", title: "Intelligent Customer Management", desc: "Predict churn, automate follow-ups, and score leads with AI that learns from your data. Every interaction is enriched, every opportunity is surfaced.", icon: Brain, color: "hsl(252,85%,65%)" },
    { tag: "Unified Analytics", title: "Real-Time Business Intelligence", desc: "Dashboards that update in real-time. Custom KPIs, department views, revenue forecasting, and AI-generated insights across your entire organization.", icon: PieChart, color: "hsl(190,80%,55%)" },
    { tag: "Enterprise Security", title: "Zero-Trust Architecture", desc: "Row-level security, end-to-end encryption, SOC 2 compliance, and granular role management. Your data is protected at every layer.", icon: Shield, color: "hsl(152,60%,48%)" },
  ];

  return (
    <>
      <JsonLdScript data={homepageJsonLd} />

      {/* ═══════ HERO ═══════ */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center overflow-hidden">
        <FloatingOrbs />
        {/* Gradient background with parallax */}
        <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,6%)] via-[hsl(222,35%,10%)] to-[hsl(210,40%,8%)]" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(hsl(190,80%,55%) 1px, transparent 1px), linear-gradient(90deg, hsl(190,80%,55%) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
        </motion.div>

        <motion.div className="container mx-auto px-4 md:px-8 relative z-10 py-20 md:py-32" style={{ opacity: heroOpacity, y: heroY }}>
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-[hsl(190,80%,55%)]/10 border border-[hsl(190,80%,55%)]/25 rounded-full px-5 py-2.5 mb-8 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-[hsl(190,80%,55%)]" />
              <span className="text-sm text-[hsl(190,80%,55%)] font-medium">Australia's All-in-One Business Platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]"
            >
              Your Complete{" "}
              <span className="bg-gradient-to-r from-[hsl(190,80%,55%)] via-[hsl(220,85%,65%)] to-[hsl(252,85%,65%)] bg-clip-text text-transparent bg-[length:200%_200%] animate-shimmer">
                Business Operating System
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="text-lg md:text-xl text-[hsl(210,20%,65%)] mt-8 max-w-3xl mx-auto leading-relaxed"
            >
              CRM, AI, app development, website design, SEO, marketing, invoicing, payroll, and 100+ integrated modules —
              built for Australian businesses with a focus on Brisbane and Gold Coast.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
            >
              <Link to="/demo">
                <Button size="lg" className="group bg-[hsl(190,80%,45%)] text-white font-bold text-lg px-8 py-6 hover:bg-[hsl(190,80%,40%)] shadow-2xl shadow-[hsl(190,80%,45%)]/30 transition-all hover:scale-105 hover:shadow-[hsl(190,80%,45%)]/40">
                  Book a Demo
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="border-[hsl(190,80%,55%)]/30 text-[hsl(190,80%,55%)] hover:bg-[hsl(190,80%,55%)]/10 px-8 py-6 text-lg backdrop-blur-sm">
                  Request a Quote
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-[hsl(210,20%,55%)]"
            >
              {["No credit card required", "Brisbane & Gold Coast based", "Australian owned & operated"].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(152,60%,48%)]" /> {t}
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[hsl(222,47%,8%)] to-transparent" />
      </section>

      {/* ═══════ TRUST RIBBON ═══════ */}
      <section className="py-10 border-y border-[hsl(222,30%,14%)] bg-[hsl(222,47%,6%)] relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">
          <Reveal>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5 text-[hsl(210,20%,45%)]">
              {["Government Approved Supplier", "Enterprise Security", "99.9% Uptime SLA", "ISO Compliant", "GDPR Ready", "SOC 2 Certified"].map((badge, i) => (
                <motion.div
                  key={badge}
                  className="flex items-center gap-2 text-sm font-medium"
                  whileHover={{ scale: 1.05, color: "hsl(190,80%,55%)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Shield className="h-4 w-4 text-[hsl(190,80%,55%)]" />
                  {badge}
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════ PLATFORM OVERVIEW ═══════ */}
      <section className="py-24 md:py-32 bg-[hsl(222,47%,8%)] relative">
        <div className="container mx-auto px-4 md:px-8">
          <Reveal className="text-center mb-16">
            <span className="inline-block text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">NextWeb OS Platform</span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold">
              One Platform.{" "}
              <span className="bg-gradient-to-r from-[hsl(190,80%,55%)] to-[hsl(252,85%,65%)] bg-clip-text text-transparent">
                Every Department.
              </span>
            </h2>
            <p className="text-[hsl(210,20%,60%)] mt-4 max-w-2xl mx-auto text-lg">
              A unified record across sales, service, marketing, finance, operations, and reporting.
            </p>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {platformModules.map((mod, i) => (
              <Reveal key={mod.label} delay={i * 0.06}>
                <Link
                  to={mod.to}
                  className="group relative bg-[hsl(222,35%,11%)] border border-[hsl(222,30%,16%)] rounded-2xl p-7 hover:border-[hsl(190,80%,55%)]/40 transition-all duration-500 hover:shadow-xl hover:shadow-[hsl(190,80%,55%)]/5 block overflow-hidden"
                >
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[hsl(190,80%,55%)]/0 to-[hsl(252,85%,65%)]/0 group-hover:from-[hsl(190,80%,55%)]/5 group-hover:to-[hsl(252,85%,65%)]/5 transition-all duration-500 rounded-2xl" />
                  <div className="relative z-10">
                    <mod.icon className="h-10 w-10 text-[hsl(190,80%,55%)] mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-lg font-semibold text-white mb-1">{mod.label}</h3>
                    <p className="text-[hsl(210,20%,55%)] text-sm leading-relaxed">{mod.desc}</p>
                  </div>
                  <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-[hsl(190,80%,55%)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ STICKY FEATURE STORYTELLING (Apple-style) ═══════ */}
      <section className="bg-[hsl(222,47%,6%)]">
        {featureStories.map((story, i) => {
          const isEven = i % 2 === 0;
          return (
            <div key={story.tag} className="min-h-screen flex items-center py-20 md:py-32">
              <div className="container mx-auto px-4 md:px-8">
                <div className={`grid lg:grid-cols-2 gap-16 items-center ${isEven ? "" : "lg:direction-rtl"}`}>
                  <Reveal className={isEven ? "" : "lg:order-2"}>
                    <span className="inline-block text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: story.color }}>
                      {story.tag}
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">{story.title}</h2>
                    <p className="text-[hsl(210,20%,60%)] text-lg leading-relaxed mb-8">{story.desc}</p>
                    <Link to="/demo">
                      <Button className="bg-[hsl(190,80%,45%)] text-white font-semibold hover:bg-[hsl(190,80%,40%)] group">
                        Learn More <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </Reveal>
                  <Reveal delay={0.2} className={isEven ? "" : "lg:order-1"}>
                    <div className="relative">
                      <div
                        className="w-full aspect-square max-w-[480px] mx-auto rounded-3xl border border-[hsl(222,30%,16%)] flex items-center justify-center overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${story.color}08, ${story.color}15)` }}
                      >
                        <motion.div
                          whileInView={{ scale: [0.8, 1], opacity: [0, 1] }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <story.icon className="h-32 w-32" style={{ color: story.color, opacity: 0.3 }} />
                        </motion.div>
                      </div>
                      {/* Floating accent shapes */}
                      <motion.div
                        className="absolute -top-6 -right-6 w-24 h-24 rounded-2xl border border-[hsl(222,30%,18%)]"
                        style={{ background: `${story.color}08` }}
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <motion.div
                        className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full border border-[hsl(222,30%,18%)]"
                        style={{ background: `${story.color}06` }}
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  </Reveal>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ═══════ HORIZONTAL SCROLL SERVICE GALLERY ═══════ */}
      <section ref={hScrollRef} className="py-24 md:py-32 bg-[hsl(222,47%,8%)] overflow-hidden relative">
        <div className="container mx-auto px-4 md:px-8 mb-12">
          <Reveal className="text-center">
            <span className="inline-block text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">Our Services</span>
            <h2 className="text-3xl md:text-5xl font-bold">
              Full-Stack Digital <span className="bg-gradient-to-r from-[hsl(190,80%,55%)] to-[hsl(252,85%,65%)] bg-clip-text text-transparent">Capabilities</span>
            </h2>
          </Reveal>
        </div>
        <motion.div
          className="flex gap-5 px-8 md:px-16"
          style={{ x: hScrollX }}
        >
          {serviceCapabilities.map((svc, i) => (
            <Link
              key={svc.label}
              to={svc.to}
              className="group flex-shrink-0 w-[260px] flex flex-col items-center text-center p-8 rounded-2xl bg-[hsl(222,35%,11%)] border border-[hsl(222,30%,16%)] hover:border-[hsl(190,80%,55%)]/40 transition-all duration-500 hover:shadow-xl hover:shadow-[hsl(190,80%,55%)]/5"
            >
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[hsl(190,80%,55%)]/10 to-[hsl(252,85%,65%)]/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svc.icon className="h-8 w-8 text-[hsl(190,80%,55%)]" />
              </div>
              <span className="text-base font-semibold text-white">{svc.label}</span>
            </Link>
          ))}
        </motion.div>
      </section>

      {/* ═══════ INDUSTRY SOLUTIONS ═══════ */}
      <section className="py-24 md:py-32 bg-[hsl(222,47%,6%)]">
        <div className="container mx-auto px-4 md:px-8">
          <Reveal className="text-center mb-16">
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
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {industries.map((ind, i) => (
              <Reveal key={ind.label} delay={i * 0.05}>
                <Link
                  to={ind.to}
                  className="group flex items-center gap-4 bg-[hsl(222,35%,11%)] border border-[hsl(222,30%,16%)] rounded-2xl p-5 hover:border-[hsl(190,80%,55%)]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[hsl(190,80%,55%)]/5"
                >
                  <div className="h-12 w-12 rounded-xl bg-[hsl(190,80%,55%)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(190,80%,55%)]/15 group-hover:scale-110 transition-all duration-300">
                    <ind.icon className="h-6 w-6 text-[hsl(190,80%,55%)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{ind.label}</h3>
                    <span className="text-xs text-[hsl(210,20%,50%)] group-hover:text-[hsl(190,80%,55%)] transition-colors">View solutions →</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ STATS / METRICS ═══════ */}
      <section className="py-20 md:py-28 bg-[hsl(222,47%,8%)] border-y border-[hsl(222,30%,14%)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(190,80%,55%)]/3 via-transparent to-[hsl(252,85%,65%)]/3" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <Reveal className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">Trusted at Scale</h2>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 500, suffix: "+", label: "Clients Served" },
              { value: 15, suffix: "+", label: "Years Experience" },
              { value: 100, suffix: "+", label: "Platform Modules" },
              { value: 99, suffix: ".9%", label: "Uptime SLA" },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.1}>
                <div className="text-center p-6 rounded-2xl bg-[hsl(222,35%,11%)]/50 border border-[hsl(222,30%,16%)] backdrop-blur-sm">
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[hsl(190,80%,55%)] to-[hsl(252,85%,65%)] bg-clip-text text-transparent mb-2">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-[hsl(210,20%,55%)] text-sm">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ WHY CHOOSE NEXTWEB ═══════ */}
      <section className="py-24 md:py-32 bg-[hsl(222,47%,6%)]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <span className="inline-block text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">Why NextWeb</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Your Strategic Technology Partner in Australia</h2>
              <p className="text-[hsl(210,20%,60%)] text-lg mb-8 leading-relaxed">
                With deep expertise in CRM, AI, cloud, mobile, and enterprise systems, we deliver end-to-end digital transformation — from Brisbane and Gold Coast to businesses across Australia.
              </p>
              <div className="space-y-5">
                {whyChoose.map((item, i) => (
                  <motion.div
                    key={item.title}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-[hsl(222,35%,11%)] transition-all duration-300 -mx-4"
                    whileHover={{ x: 4 }}
                  >
                    <div className="h-10 w-10 rounded-xl bg-[hsl(190,80%,55%)]/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-[hsl(190,80%,55%)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                      <p className="text-sm text-[hsl(210,20%,55%)] leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="relative">
                {/* SEO stats card */}
                <div className="bg-[hsl(222,35%,11%)] rounded-3xl p-8 border border-[hsl(222,30%,16%)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[hsl(190,80%,55%)]/3 to-[hsl(252,85%,60%)]/3" />
                  <div className="relative z-10 space-y-4">
                    <h3 className="text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-6">SEO & Digital Growth</h3>
                    {[
                      { label: "Organic Traffic Growth", value: "+340%" },
                      { label: "First Page Rankings", value: "85+" },
                      { label: "Local Pack Appearances", value: "3x" },
                      { label: "Client Retention Rate", value: "97%" },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between p-4 rounded-xl bg-[hsl(222,47%,8%)] border border-[hsl(222,30%,16%)]">
                        <span className="text-sm text-[hsl(210,20%,65%)]">{stat.label}</span>
                        <span className="text-lg font-bold text-[hsl(190,80%,55%)]">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Floating accent */}
                <motion.div
                  className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-[hsl(190,80%,55%)]/5 border border-[hsl(190,80%,55%)]/10"
                  animate={{ rotate: [0, 10, 0], y: [0, -8, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════ MOBILE TECHNOLOGY ═══════ */}
      <section className="py-24 md:py-32 bg-[hsl(222,47%,8%)]">
        <div className="container mx-auto px-4 md:px-8">
          <Reveal className="text-center mb-16">
            <span className="inline-block text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">Mobile Technology</span>
            <h2 className="text-3xl md:text-5xl font-bold">
              Your Business,{" "}
              <span className="bg-gradient-to-r from-[hsl(190,80%,55%)] to-[hsl(152,60%,48%)] bg-clip-text text-transparent">
                Everywhere
              </span>
            </h2>
            <p className="text-[hsl(210,20%,60%)] mt-4 max-w-2xl mx-auto text-lg">
              Android, iPhone, iPad, hybrid, native cloud apps, and mobile-optimized websites.
            </p>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Smartphone, label: "Android" },
              { icon: Smartphone, label: "iPhone" },
              { icon: Monitor, label: "iPad" },
              { icon: Layers, label: "Hybrid" },
              { icon: Globe, label: "Cloud Apps" },
              { icon: Code2, label: "Mobile Web" },
            ].map((item, i) => (
              <Reveal key={item.label} delay={i * 0.05}>
                <motion.div
                  className="flex flex-col items-center text-center p-6 rounded-2xl bg-[hsl(222,35%,11%)] border border-[hsl(222,30%,16%)]"
                  whileHover={{ y: -4, borderColor: "hsl(190,80%,55%,0.3)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <item.icon className="h-8 w-8 text-[hsl(190,80%,55%)] mb-3" />
                  <span className="text-sm font-medium text-white">{item.label}</span>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="py-24 md:py-32 bg-[hsl(222,47%,6%)]">
        <div className="container mx-auto px-4 md:px-8">
          <Reveal className="text-center mb-16">
            <span className="inline-block text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">Success Stories</span>
            <h2 className="text-3xl md:text-5xl font-bold">
              Trusted by{" "}
              <span className="bg-gradient-to-r from-[hsl(190,80%,55%)] to-[hsl(252,85%,65%)] bg-clip-text text-transparent">
                Industry Leaders
              </span>
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "NextWeb OS transformed how we manage our agency. We consolidated 12 tools into one platform and saved over $2,000/month.", name: "Sarah Mitchell", title: "CEO, Digital Edge Agency", metric: "$24K saved annually" },
              { quote: "The AI-powered CRM alone increased our conversion rate by 40%. The ROI on this platform is incredible for our Brisbane operations.", name: "James Chen", title: "Sales Director, TechScale Solutions", metric: "40% conversion lift" },
              { quote: "From website design to SEO to CRM — having everything integrated under one roof on the Gold Coast has been a game changer.", name: "Maria Garcia", title: "Operations Manager, ProBuild Corp", metric: "3x lead generation" },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1}>
                <motion.div
                  className="bg-[hsl(222,35%,11%)] border border-[hsl(222,30%,16%)] rounded-2xl p-7 h-full"
                  whileHover={{ y: -4, borderColor: "hsl(190,80%,55%,0.3)" }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-[hsl(38,92%,50%)] text-[hsl(38,92%,50%)]" />
                    ))}
                  </div>
                  <p className="text-[hsl(210,20%,70%)] mb-6 leading-relaxed italic">"{t.quote}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white text-sm">{t.name}</div>
                      <div className="text-xs text-[hsl(210,20%,50%)]">{t.title}</div>
                    </div>
                    <div className="text-xs font-bold text-[hsl(190,80%,55%)] bg-[hsl(190,80%,55%)]/10 px-3 py-1.5 rounded-full">{t.metric}</div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <FloatingOrbs />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(190,80%,55%)]/8 via-[hsl(222,47%,8%)] to-[hsl(252,85%,60%)]/8" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6">
              Ready to Transform{" "}
              <span className="bg-gradient-to-r from-[hsl(190,80%,55%)] to-[hsl(252,85%,65%)] bg-clip-text text-transparent">
                Your Business?
              </span>
            </h2>
            <p className="text-[hsl(210,20%,65%)] max-w-2xl mx-auto text-lg mb-10">
              Contact our team in Brisbane or Gold Coast for a free strategy session. Let's discuss how NextWeb OS can accelerate your digital transformation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link to="/contact">
                <Button size="lg" className="group bg-[hsl(190,80%,45%)] text-white font-bold text-lg px-10 py-7 hover:bg-[hsl(190,80%,40%)] shadow-2xl shadow-[hsl(190,80%,45%)]/30 transition-all hover:scale-105">
                  Get a Free Quote <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="outline" size="lg" className="border-[hsl(190,80%,55%)]/30 text-[hsl(190,80%,55%)] hover:bg-[hsl(190,80%,55%)]/10 px-10 py-7 text-lg backdrop-blur-sm">
                  Book a Demo
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-[hsl(210,20%,50%)]">
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[hsl(190,80%,55%)]" /> Brisbane & Gold Coast</span>
              <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-[hsl(190,80%,55%)]" /> 1300 NEXTWEB</span>
              <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-[hsl(190,80%,55%)]" /> hello@nextweb.com.au</span>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default Index;
