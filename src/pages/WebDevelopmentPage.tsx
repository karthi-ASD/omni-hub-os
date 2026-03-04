import { Link } from "react-router-dom";
import { PremiumFooter } from "@/components/PremiumFooter";
import { NWLogo } from "@/components/NWLogo";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Code2, Globe, Palette, Zap, CheckCircle2, ArrowRight, Monitor,
  Smartphone, ShoppingCart, Database, Search, Layers, Server, Shield,
  Star, ChevronRight, Workflow, FileCode2, Gauge, Users
} from "lucide-react";

const WebDevelopmentPage = () => {
  usePageTitle("Web Development", "Custom web development solutions by NextWeb — WordPress, E-Commerce, CRM, ERP, and bespoke applications for Australian businesses.");

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-[#d4a853]/20">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
          <Link to="/"><NWLogo /></Link>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link to="/web-development" className="text-[#d4a853] font-medium">Web Development</Link>
            <Link to="/mobile-technology" className="text-gray-400 hover:text-[#d4a853]">Mobile Technology</Link>
            <Link to="/it-solutions" className="text-gray-400 hover:text-[#d4a853]">IT Solutions</Link>
            <Link to="/e-marketing" className="text-gray-400 hover:text-[#d4a853]">E-Marketing</Link>
            <Link to="/automation" className="text-gray-400 hover:text-[#d4a853]">Automation</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" className="text-gray-300 hover:text-[#d4a853]">Sign In</Button></Link>
            <Link to="/demo"><Button className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold">Get a Quote</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 min-h-[70vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#111832] to-[#0a0e1a]" />
        <div className="absolute top-20 right-10 h-72 w-72 bg-[#d4a853]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 h-96 w-96 bg-[#2563eb]/5 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full px-4 py-2 mb-6">
              <Code2 className="h-4 w-4 text-[#d4a853]" />
              <span className="text-sm text-[#d4a853] font-medium">Web Development Services</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Custom{" "}
              <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Web Solutions</span>{" "}
              That Drive Results
            </h1>
            <p className="text-lg text-gray-400 mt-6 leading-relaxed max-w-2xl">
              From stunning WordPress sites to complex enterprise applications, our team delivers SEO-optimized, mobile-responsive web solutions that convert visitors into customers.
            </p>
            <div className="flex gap-4 mt-8">
              <Link to="/demo">
                <Button size="lg" className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-bold px-8">
                  Request a Quote <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="border-[#d4a853]/40 text-[#d4a853]">View Portfolio</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-[#0d1225]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              Our <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Web Development</span> Services
            </h2>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">Comprehensive solutions for every digital need</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: "WordPress Development", desc: "Custom themes, plugins, WooCommerce stores, and enterprise WordPress solutions with SEO-first architecture.", features: ["Custom Theme Development", "Plugin Development", "WooCommerce Integration", "Speed Optimization"] },
              { icon: ShoppingCart, title: "E-Commerce Development", desc: "Full-featured online stores with payment gateways, inventory management, and conversion-optimized checkout flows.", features: ["Shopify & WooCommerce", "Payment Gateway Integration", "Inventory Management", "Order Tracking Systems"] },
              { icon: Database, title: "ERP Software", desc: "Enterprise resource planning solutions that automate business processes, streamline workflows, and boost productivity.", features: ["Custom ERP Modules", "Workflow Automation", "Real-time Reporting", "Multi-department Integration"] },
              { icon: Monitor, title: "Custom Application Development", desc: "Bespoke web applications tailored to your unique business requirements with scalable cloud-native architecture.", features: ["React & TypeScript", "Cloud-Native Architecture", "API Development", "Database Design"] },
              { icon: Palette, title: "UI/UX Design", desc: "User-centered design that creates intuitive, beautiful interfaces driving engagement and conversion.", features: ["User Research & Personas", "Wireframing & Prototyping", "Visual Design Systems", "Usability Testing"] },
              { icon: Database, title: "CRM Implementation", desc: "Custom CRM solutions that centralize customer data, automate sales processes, and improve client relationships.", features: ["Custom CRM Development", "Data Migration", "Sales Automation", "Reporting Dashboards"] },
            ].map((service) => (
              <div key={service.title} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-6 hover:border-[#d4a853]/40 transition-all group">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#d4a853] to-[#b8902e] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <service.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{service.title}</h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{service.desc}</p>
                <ul className="space-y-2">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="h-4 w-4 text-[#d4a853] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Our <span className="bg-gradient-to-r from-[#2563eb] to-[#0ea5e9] bg-clip-text text-transparent">Technology Stack</span></h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {["React", "TypeScript", "Node.js", "Python", "WordPress", "PHP", "Java", "PostgreSQL", "AWS", "Docker", "Kubernetes", "GraphQL"].map((tech) => (
              <div key={tech} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-4 text-center hover:border-[#d4a853]/30 transition-all">
                <FileCode2 className="h-8 w-8 text-[#d4a853] mx-auto mb-2" />
                <span className="text-sm text-gray-300 font-medium">{tech}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-[#0d1225]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Our <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Development Process</span></h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Discovery & Planning", desc: "We analyze your requirements, target audience, and business objectives to create a comprehensive project roadmap.", icon: Search },
              { step: "02", title: "Design & Prototype", desc: "Our designers create wireframes and interactive prototypes that bring your vision to life before development begins.", icon: Palette },
              { step: "03", title: "Development & Testing", desc: "Agile development with continuous testing ensures a robust, bug-free application delivered on time.", icon: Code2 },
              { step: "04", title: "Launch & Optimize", desc: "We deploy your application and provide ongoing support, monitoring, and performance optimization.", icon: Gauge },
            ].map((phase) => (
              <div key={phase.step} className="relative bg-[#111832] border border-[#1e2a4a] rounded-xl p-6 hover:border-[#d4a853]/40 transition-all">
                <div className="text-4xl font-bold text-[#d4a853]/20 mb-4">{phase.step}</div>
                <phase.icon className="h-8 w-8 text-[#d4a853] mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">{phase.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{phase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-[#d4a853]/10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10,000+", label: "Websites Built" },
              { value: "17+", label: "Years Experience" },
              { value: "200+", label: "Apps Developed" },
              { value: "99%", label: "Client Satisfaction" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-gray-400 mt-2 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Build Something <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Amazing?</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-10">Let's discuss your project and bring your vision to life with our expert development team.</p>
          <Link to="/demo">
            <Button size="lg" className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-bold text-lg px-10 py-6 hover:scale-105 transition-all">
              Get a Free Quote <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <PremiumFooter />
    </div>
  );
};

export default WebDevelopmentPage;
