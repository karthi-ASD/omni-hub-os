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
} from "framer-motion";
import {
  ArrowRight, Shield, Zap, BarChart3, Users, Globe, Brain,
  CheckCircle2, ChevronRight, Smartphone, Monitor, Search,
  Headphones, Receipt, Mail, ShoppingCart, PieChart, Link2,
  Code2, Briefcase, Star, Target, TrendingUp, Layers, Lock,
  Palette, Server, GraduationCap, Landmark, Home, Factory,
  Plane, DollarSign, Film, Store, Leaf, Award, Sparkles, Phone, MapPin,
} from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard-mockup.jpg";
import parallaxCity from "@/assets/parallax-cityscape.jpg";
import NextWebExpansionFlow from "@/components/NextWebExpansionFlow";

/* ─── Reusable scroll-reveal wrapper ─── */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 32, filter: "blur(6px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
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

/* ─── Soft gradient orbs for light backgrounds ─── */
function SoftOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{ background: "hsl(252,85%,70%,0.08)", top: "5%", left: "-8%" }}
        animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[100px]"
        style={{ background: "hsl(190,80%,60%,0.07)", top: "30%", right: "-5%" }}
        animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full blur-[90px]"
        style={{ background: "hsl(38,92%,60%,0.06)", bottom: "10%", left: "25%" }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
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
  const heroScale = useTransform(heroScroll, [0, 1], [1, 1.08]);
  const heroOpacity = useTransform(heroScroll, [0, 0.7], [1, 0]);
  const heroY = useTransform(heroScroll, [0, 1], [0, 80]);

  // Parallax image section
  const parallaxRef = useRef(null);
  const { scrollYProgress: parallaxProgress } = useScroll({ target: parallaxRef, offset: ["start end", "end start"] });
  const parallaxY = useTransform(parallaxProgress, [0, 1], ["-15%", "15%"]);

  // Horizontal scroll
  const hScrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: hScrollProgress } = useScroll({ target: hScrollRef, offset: ["start end", "end start"] });
  const hScrollX = useTransform(hScrollProgress, [0.2, 0.8], ["0%", "-60%"]);

  const homepageJsonLd = [organizationJsonLd, buildBreadcrumbJsonLd([{ name: "Home", url: "/" }])];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <AuthDiagnostics />
      </div>
    );
  }
  if (session) return <Navigate to="/dashboard" replace />;

  const platformModules = [
    { icon: Users, label: "Customer 360", desc: "Unified view across sales, service & ops", to: "/platform/customer-360", accent: "hsl(252,85%,62%)" },
    { icon: BarChart3, label: "Sales CRM", desc: "Leads, pipelines, forecasting & analytics", to: "/platform/sales-crm", accent: "hsl(190,80%,50%)" },
    { icon: Headphones, label: "Service CRM", desc: "Tickets, routing & faster resolution", to: "/platform/service-crm", accent: "hsl(330,75%,55%)" },
    { icon: Mail, label: "Marketing Automation", desc: "Campaigns, segmentation & nurturing", to: "/platform/marketing-automation", accent: "hsl(38,92%,50%)" },
    { icon: ShoppingCart, label: "Commerce", desc: "Storefronts, catalogues & payments", to: "/platform/commerce", accent: "hsl(152,60%,42%)" },
    { icon: PieChart, label: "Analytics & BI", desc: "Dashboards, reports & intelligence", to: "/platform/analytics", accent: "hsl(210,85%,55%)" },
    { icon: Link2, label: "Integration", desc: "APIs, connectors & data sync", to: "/platform/integration", accent: "hsl(24,95%,55%)" },
    { icon: Brain, label: "AI Automation", desc: "Intelligent workflows & predictions", to: "/platform/ai-automation", accent: "hsl(270,70%,58%)" },
    { icon: Shield, label: "Security", desc: "Encryption, RLS & compliance", to: "/platform/security", accent: "hsl(175,65%,42%)" },
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
    { tag: "AI-Powered CRM", title: "Intelligent Customer Management", desc: "Predict churn, automate follow-ups, and score leads with AI that learns from your data. Every interaction is enriched, every opportunity is surfaced.", icon: Brain, color: "hsl(252,85%,62%)" },
    { tag: "Unified Analytics", title: "Real-Time Business Intelligence", desc: "Dashboards that update in real-time. Custom KPIs, department views, revenue forecasting, and AI-generated insights across your entire organization.", icon: PieChart, color: "hsl(190,80%,50%)" },
    { tag: "Enterprise Security", title: "Zero-Trust Architecture", desc: "Row-level security, end-to-end encryption, SOC 2 compliance, and granular role management. Your data is protected at every layer.", icon: Shield, color: "hsl(152,60%,42%)" },
  ];

  return (
    <>
      <JsonLdScript data={homepageJsonLd} />

      {/* ═══════ HERO — Light premium ═══════ */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center overflow-hidden bg-gradient-to-b from-[hsl(220,30%,98%)] via-[hsl(225,25%,96%)] to-[hsl(230,20%,94%)]">
        <SoftOrbs />
        <motion.div className="container mx-auto px-4 md:px-8 relative z-10 py-20 md:py-28" style={{ opacity: heroOpacity, y: heroY }}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-[hsl(252,85%,62%)]/8 border border-[hsl(252,85%,62%)]/15 rounded-full px-5 py-2 mb-6"
              >
                <Sparkles className="h-4 w-4 text-[hsl(38,92%,50%)]" />
                <span className="text-sm text-[hsl(224,28%,30%)] font-medium">Australia's All-in-One Business Platform</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-[hsl(224,28%,12%)]"
              >
                Your Complete{" "}
                <span className="bg-gradient-to-r from-[hsl(252,85%,58%)] via-[hsl(190,80%,50%)] to-[hsl(152,60%,45%)] bg-clip-text text-transparent">
                  Business Operating System
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
                className="text-base md:text-lg text-[hsl(220,15%,45%)] mt-6 max-w-xl leading-relaxed"
              >
                CRM, AI, app development, website design, SEO, marketing, invoicing, payroll, and 100+ integrated modules —
                built for Australian businesses in Brisbane and Gold Coast.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.8 }}
                className="flex flex-col sm:flex-row items-start gap-3 mt-8"
              >
                <Link to="/demo">
                  <Button size="lg" className="group bg-gradient-to-r from-[hsl(252,85%,58%)] to-[hsl(190,80%,48%)] text-white font-bold text-base px-7 py-5 shadow-lg shadow-[hsl(252,85%,58%)]/20 hover:shadow-xl hover:shadow-[hsl(252,85%,58%)]/30 transition-all hover:scale-[1.03]">
                    Book a Demo
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="lg" className="border-[hsl(224,28%,82%)] text-[hsl(224,28%,25%)] hover:bg-[hsl(252,85%,62%)]/5 px-7 py-5 text-base">
                    Request a Quote
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 1 }}
                className="flex flex-wrap items-center gap-5 mt-8 text-sm text-[hsl(220,15%,50%)]"
              >
                {["No credit card required", "Brisbane & Gold Coast based", "Australian owned"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(152,60%,42%)]" /> {t}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Right — hero image */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ scale: heroScale }}
            >
              <div className="relative">
                <img
                  src={heroDashboard}
                  alt="NextWeb OS Dashboard"
                  className="rounded-2xl shadow-2xl shadow-[hsl(224,28%,12%)]/10 w-full"
                />
                {/* Gold accent badge */}
                <motion.div
                  className="absolute -top-3 -right-3 bg-gradient-to-br from-[hsl(38,92%,55%)] to-[hsl(28,90%,50%)] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  100+ Modules
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════ TRUST RIBBON ═══════ */}
      <section className="py-8 border-y border-[hsl(220,20%,90%)] bg-white/60 backdrop-blur-sm relative">
        <div className="container mx-auto px-4 md:px-8">
          <Reveal>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-[hsl(220,15%,55%)]">
              {["Government Approved Supplier", "Enterprise Security", "99.9% Uptime SLA", "ISO Compliant", "GDPR Ready", "SOC 2 Certified"].map((badge) => (
                <motion.div
                  key={badge}
                  className="flex items-center gap-2 text-sm font-medium"
                  whileHover={{ scale: 1.05, color: "hsl(252,85%,55%)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Shield className="h-3.5 w-3.5 text-[hsl(38,92%,50%)]" />
                  {badge}
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════ PLATFORM OVERVIEW — Light cards ═══════ */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-[hsl(230,20%,94%)] to-[hsl(220,25%,97%)] relative">
        <SoftOrbs />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <Reveal className="text-center mb-14">
            <span className="inline-block text-xs font-semibold text-[hsl(252,85%,55%)] uppercase tracking-widest mb-3">NextWeb OS Platform</span>
            <h2 className="text-3xl md:text-5xl font-bold text-[hsl(224,28%,12%)]">
              One Platform.{" "}
              <span className="bg-gradient-to-r from-[hsl(252,85%,55%)] to-[hsl(190,80%,48%)] bg-clip-text text-transparent">
                Every Department.
              </span>
            </h2>
            <p className="text-[hsl(220,15%,48%)] mt-4 max-w-2xl mx-auto text-lg">
              A unified record across sales, service, marketing, finance, operations, and reporting.
            </p>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformModules.map((mod, i) => (
              <Reveal key={mod.label} delay={i * 0.05}>
                <Link
                  to={mod.to}
                  className="group relative bg-white/80 backdrop-blur-sm border border-[hsl(220,20%,90%)] rounded-2xl p-6 hover:shadow-xl hover:shadow-[hsl(252,85%,60%)]/8 transition-all duration-400 block overflow-hidden hover:border-[hsl(252,85%,62%)]/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-[hsl(252,85%,62%)]/3 group-hover:to-[hsl(190,80%,55%)]/3 transition-all duration-500 rounded-2xl" />
                  <div className="relative z-10">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${mod.accent}12` }}>
                      <mod.icon className="h-5 w-5" style={{ color: mod.accent }} />
                    </div>
                    <h3 className="text-base font-semibold text-[hsl(224,28%,15%)] mb-1">{mod.label}</h3>
                    <p className="text-[hsl(220,15%,50%)] text-sm leading-relaxed">{mod.desc}</p>
                  </div>
                  <ArrowRight className="absolute bottom-5 right-5 h-4 w-4 text-[hsl(252,85%,60%)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ STICKY FEATURE STORYTELLING ═══════ */}
      <section className="bg-gradient-to-b from-[hsl(220,25%,97%)] to-white">
        {featureStories.map((story, i) => {
          const isEven = i % 2 === 0;
          return (
            <div key={story.tag} className="min-h-[85vh] flex items-center py-16 md:py-24">
              <div className="container mx-auto px-4 md:px-8">
                <div className={`grid lg:grid-cols-2 gap-12 items-center`}>
                  <Reveal className={isEven ? "" : "lg:order-2"}>
                    <span className="inline-block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: story.color }}>
                      {story.tag}
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 leading-tight text-[hsl(224,28%,12%)]">{story.title}</h2>
                    <p className="text-[hsl(220,15%,48%)] text-base md:text-lg leading-relaxed mb-6">{story.desc}</p>
                    <Link to="/demo">
                      <Button className="bg-gradient-to-r from-[hsl(252,85%,58%)] to-[hsl(190,80%,48%)] text-white font-semibold group shadow-md shadow-[hsl(252,85%,58%)]/15 hover:shadow-lg">
                        Learn More <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </Reveal>
                  <Reveal delay={0.15} className={isEven ? "" : "lg:order-1"}>
                    <div className="relative">
                      <div
                        className="w-full aspect-[4/3] max-w-[460px] mx-auto rounded-2xl border border-[hsl(220,20%,90%)] flex items-center justify-center overflow-hidden bg-white/50 backdrop-blur-sm"
                        style={{ background: `linear-gradient(135deg, ${story.color}06, ${story.color}12)` }}
                      >
                        <motion.div
                          whileInView={{ scale: [0.85, 1], opacity: [0, 1] }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          className="flex flex-col items-center gap-3"
                        >
                          <story.icon className="h-14 w-14" style={{ color: story.color, opacity: 0.5 }} />
                          <span className="text-sm font-medium" style={{ color: story.color, opacity: 0.6 }}>{story.tag}</span>
                        </motion.div>
                      </div>
                      {/* Gold accent dot */}
                      <motion.div
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gradient-to-br from-[hsl(38,92%,55%)] to-[hsl(28,90%,50%)]"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  </Reveal>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ═══════ PARALLAX IMAGE SECTION ═══════ */}
      <section ref={parallaxRef} className="relative h-[60vh] md:h-[70vh] overflow-hidden flex items-center justify-center">
        <motion.div className="absolute inset-0" style={{ y: parallaxY }}>
          <img
            src={parallaxCity}
            alt="Australian cityscape"
            className="w-full h-[130%] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(224,28%,10%)]/60 via-[hsl(224,28%,10%)]/40 to-[hsl(224,28%,10%)]/60" />
        </motion.div>
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Proudly Serving Australian Businesses
            </h2>
            <p className="text-white/80 text-lg md:text-xl leading-relaxed">
              From Brisbane and Gold Coast to businesses across Australia — we deliver end-to-end digital transformation with a local touch.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <span className="flex items-center gap-2 text-white/90 text-sm font-medium bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/15">
                <MapPin className="h-4 w-4 text-[hsl(38,92%,55%)]" /> Brisbane
              </span>
              <span className="flex items-center gap-2 text-white/90 text-sm font-medium bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/15">
                <MapPin className="h-4 w-4 text-[hsl(38,92%,55%)]" /> Gold Coast
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════ HORIZONTAL SCROLL SERVICE GALLERY ═══════ */}
      <section ref={hScrollRef} className="py-20 md:py-28 bg-gradient-to-b from-white to-[hsl(225,25%,96%)] overflow-hidden relative">
        <div className="container mx-auto px-4 md:px-8 mb-10">
          <Reveal className="text-center">
            <span className="inline-block text-xs font-semibold text-[hsl(252,85%,55%)] uppercase tracking-widest mb-3">Our Services</span>
            <h2 className="text-3xl md:text-5xl font-bold text-[hsl(224,28%,12%)]">
              Full-Stack Digital <span className="bg-gradient-to-r from-[hsl(252,85%,55%)] to-[hsl(190,80%,48%)] bg-clip-text text-transparent">Capabilities</span>
            </h2>
          </Reveal>
        </div>
        <motion.div className="flex gap-4 px-8 md:px-16" style={{ x: hScrollX }}>
          {serviceCapabilities.map((svc) => (
            <Link
              key={svc.label}
              to={svc.to}
              className="group flex-shrink-0 w-[240px] flex flex-col items-center text-center p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-[hsl(220,20%,90%)] hover:border-[hsl(252,85%,62%)]/30 transition-all duration-400 hover:shadow-xl hover:shadow-[hsl(252,85%,60%)]/8"
            >
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[hsl(252,85%,62%)]/10 to-[hsl(190,80%,55%)]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svc.icon className="h-5 w-5 text-[hsl(252,85%,58%)]" />
              </div>
              <span className="text-sm font-semibold text-[hsl(224,28%,15%)]">{svc.label}</span>
            </Link>
          ))}
        </motion.div>
      </section>

      {/* ═══════ INDUSTRY SOLUTIONS ═══════ */}
      <section className="py-20 md:py-28 bg-[hsl(225,25%,96%)]">
        <div className="container mx-auto px-4 md:px-8">
          <Reveal className="text-center mb-14">
            <span className="inline-block text-xs font-semibold text-[hsl(152,60%,42%)] uppercase tracking-widest mb-3">Industry Solutions</span>
            <h2 className="text-3xl md:text-5xl font-bold text-[hsl(224,28%,12%)]">
              Built for{" "}
              <span className="bg-gradient-to-r from-[hsl(152,60%,42%)] to-[hsl(190,80%,48%)] bg-clip-text text-transparent">
                Your Industry
              </span>
            </h2>
            <p className="text-[hsl(220,15%,48%)] mt-4 max-w-2xl mx-auto text-lg">
              Tailored digital solutions combining CRM, AI, apps, websites, marketing, and automation for every vertical.
            </p>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {industries.map((ind, i) => (
              <Reveal key={ind.label} delay={i * 0.04}>
                <Link
                  to={ind.to}
                  className="group flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-[hsl(220,20%,90%)] rounded-xl p-4 hover:border-[hsl(152,60%,42%)]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[hsl(152,60%,42%)]/8"
                >
                  <div className="h-10 w-10 rounded-lg bg-[hsl(152,60%,42%)]/8 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300">
                    <ind.icon className="h-4.5 w-4.5 text-[hsl(152,60%,42%)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[hsl(224,28%,15%)] text-sm">{ind.label}</h3>
                    <span className="text-xs text-[hsl(220,15%,55%)] group-hover:text-[hsl(152,60%,42%)] transition-colors">View solutions →</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ STATS / METRICS ═══════ */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[hsl(252,85%,58%)] via-[hsl(220,85%,55%)] to-[hsl(190,80%,48%)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-white">Trusted at Scale</h2>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: 500, suffix: "+", label: "Clients Served" },
              { value: 15, suffix: "+", label: "Years Experience" },
              { value: 100, suffix: "+", label: "Platform Modules" },
              { value: 99, suffix: ".9%", label: "Uptime SLA" },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.08}>
                <div className="text-center p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-white/70 text-sm">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ WHY CHOOSE NEXTWEB ═══════ */}
      <section className="py-20 md:py-28 bg-white relative">
        <SoftOrbs />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <Reveal>
              <span className="inline-block text-xs font-semibold text-[hsl(38,92%,50%)] uppercase tracking-widest mb-3">Why NextWeb</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-5 text-[hsl(224,28%,12%)]">Your Strategic Technology Partner in Australia</h2>
              <p className="text-[hsl(220,15%,48%)] text-base md:text-lg mb-6 leading-relaxed">
                With deep expertise in CRM, AI, cloud, mobile, and enterprise systems, we deliver end-to-end digital transformation — from Brisbane and Gold Coast to businesses across Australia.
              </p>
              <div className="space-y-3">
                {whyChoose.map((item) => (
                  <motion.div
                    key={item.title}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-[hsl(225,25%,96%)] transition-all duration-300 -mx-3"
                    whileHover={{ x: 3 }}
                  >
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[hsl(252,85%,62%)]/10 to-[hsl(190,80%,55%)]/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-4 w-4 text-[hsl(252,85%,58%)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[hsl(224,28%,15%)] text-sm mb-0.5">{item.title}</h3>
                      <p className="text-xs text-[hsl(220,15%,50%)] leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="relative">
                <div className="bg-gradient-to-br from-[hsl(225,25%,97%)] to-white rounded-2xl p-7 border border-[hsl(220,20%,90%)] shadow-lg shadow-[hsl(224,28%,12%)]/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[hsl(38,92%,55%)]/10 to-transparent rounded-bl-3xl" />
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="h-2 w-2 rounded-full bg-[hsl(38,92%,55%)]" />
                      <h3 className="text-xs font-semibold text-[hsl(38,92%,50%)] uppercase tracking-widest">SEO & Digital Growth</h3>
                    </div>
                    {[
                      { label: "Organic Traffic Growth", value: "+340%" },
                      { label: "First Page Rankings", value: "85+" },
                      { label: "Local Pack Appearances", value: "3x" },
                      { label: "Client Retention Rate", value: "97%" },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between p-3 rounded-xl bg-[hsl(225,25%,96%)] border border-[hsl(220,20%,92%)]">
                        <span className="text-sm text-[hsl(220,15%,45%)]">{stat.label}</span>
                        <span className="text-sm font-bold bg-gradient-to-r from-[hsl(252,85%,55%)] to-[hsl(190,80%,48%)] bg-clip-text text-transparent">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Gold accent */}
                <motion.div
                  className="absolute -top-3 -right-3 w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(38,92%,55%)] to-[hsl(28,90%,50%)] shadow-lg"
                  animate={{ rotate: [0, 12, 0], y: [0, -4, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════ MOBILE TECHNOLOGY ═══════ */}
      <section className="py-20 md:py-28 bg-[hsl(225,25%,96%)]">
        <div className="container mx-auto px-4 md:px-8">
          <Reveal className="text-center mb-14">
            <span className="inline-block text-xs font-semibold text-[hsl(190,80%,48%)] uppercase tracking-widest mb-3">Mobile Technology</span>
            <h2 className="text-3xl md:text-5xl font-bold text-[hsl(224,28%,12%)]">
              Your Business,{" "}
              <span className="bg-gradient-to-r from-[hsl(190,80%,48%)] to-[hsl(152,60%,42%)] bg-clip-text text-transparent">
                Everywhere
              </span>
            </h2>
            <p className="text-[hsl(220,15%,48%)] mt-3 max-w-2xl mx-auto text-base md:text-lg">
              Android, iPhone, iPad, hybrid, native cloud apps, and mobile-optimized websites.
            </p>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: Smartphone, label: "Android" },
              { icon: Smartphone, label: "iPhone" },
              { icon: Monitor, label: "iPad" },
              { icon: Layers, label: "Hybrid" },
              { icon: Globe, label: "Cloud Apps" },
              { icon: Code2, label: "Mobile Web" },
            ].map((item, i) => (
              <Reveal key={item.label} delay={i * 0.04}>
                <motion.div
                  className="flex flex-col items-center text-center p-5 rounded-xl bg-white/80 backdrop-blur-sm border border-[hsl(220,20%,90%)]"
                  whileHover={{ y: -3, borderColor: "hsl(190,80%,50%,0.3)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <item.icon className="h-5 w-5 text-[hsl(190,80%,48%)] mb-2" />
                  <span className="text-xs font-medium text-[hsl(224,28%,15%)]">{item.label}</span>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="py-20 md:py-28 bg-white relative">
        <SoftOrbs />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <Reveal className="text-center mb-14">
            <span className="inline-block text-xs font-semibold text-[hsl(38,92%,50%)] uppercase tracking-widest mb-3">Success Stories</span>
            <h2 className="text-3xl md:text-5xl font-bold text-[hsl(224,28%,12%)]">
              Trusted by{" "}
              <span className="bg-gradient-to-r from-[hsl(38,92%,50%)] to-[hsl(330,75%,55%)] bg-clip-text text-transparent">
                Industry Leaders
              </span>
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { quote: "NextWeb OS transformed how we manage our agency. We consolidated 12 tools into one platform and saved over $2,000/month.", name: "Sarah Mitchell", title: "CEO, Digital Edge Agency", metric: "$24K saved annually" },
              { quote: "The AI-powered CRM alone increased our conversion rate by 40%. The ROI on this platform is incredible for our Brisbane operations.", name: "James Chen", title: "Sales Director, TechScale Solutions", metric: "40% conversion lift" },
              { quote: "From website design to SEO to CRM — having everything integrated under one roof on the Gold Coast has been a game changer.", name: "Maria Garcia", title: "Operations Manager, ProBuild Corp", metric: "3x lead generation" },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 0.08}>
                <motion.div
                  className="bg-gradient-to-br from-[hsl(225,25%,97%)] to-white border border-[hsl(220,20%,90%)] rounded-2xl p-6 h-full"
                  whileHover={{ y: -3, borderColor: "hsl(38,92%,55%,0.3)" }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-[hsl(38,92%,50%)] text-[hsl(38,92%,50%)]" />
                    ))}
                  </div>
                  <p className="text-[hsl(220,15%,40%)] text-sm mb-5 leading-relaxed italic">"{t.quote}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[hsl(224,28%,15%)] text-sm">{t.name}</div>
                      <div className="text-xs text-[hsl(220,15%,55%)]">{t.title}</div>
                    </div>
                    <div className="text-xs font-bold text-[hsl(252,85%,55%)] bg-[hsl(252,85%,62%)]/8 px-2.5 py-1 rounded-full">{t.metric}</div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-br from-[hsl(224,28%,10%)] via-[hsl(240,30%,14%)] to-[hsl(252,35%,12%)]">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, hsl(38,92%,55%) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-5 text-white">
              Ready to Transform{" "}
              <span className="bg-gradient-to-r from-[hsl(38,92%,55%)] via-[hsl(190,80%,55%)] to-[hsl(252,85%,65%)] bg-clip-text text-transparent">
                Your Business?
              </span>
            </h2>
            <p className="text-white/65 max-w-2xl mx-auto text-base md:text-lg mb-8">
              Contact our team in Brisbane or Gold Coast for a free strategy session. Let's discuss how NextWeb OS can accelerate your digital transformation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <Link to="/contact">
                <Button size="lg" className="group bg-gradient-to-r from-[hsl(38,92%,50%)] to-[hsl(28,90%,48%)] text-white font-bold text-base px-8 py-6 shadow-xl shadow-[hsl(38,92%,50%)]/25 hover:shadow-2xl hover:shadow-[hsl(38,92%,50%)]/35 transition-all hover:scale-[1.03]">
                  Get a Free Quote <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="outline" size="lg" className="border-white/20 text-white/90 hover:bg-white/10 px-8 py-6 text-base backdrop-blur-sm">
                  Book a Demo
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/50">
              <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[hsl(38,92%,55%)]" /> Brisbane & Gold Coast</span>
              <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-[hsl(38,92%,55%)]" /> 1300 NEXTWEB</span>
              <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-[hsl(38,92%,55%)]" /> hello@nextweb.com.au</span>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default Index;
