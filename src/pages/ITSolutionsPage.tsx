import { Link } from "react-router-dom";
import { PremiumFooter } from "@/components/PremiumFooter";
import { NWLogo } from "@/components/NWLogo";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Server, Shield, Cloud, Database, Cpu, Network, ArrowRight, CheckCircle2,
  Lock, Monitor, Zap, HardDrive, Wifi, Globe, Settings, Users
} from "lucide-react";

const ITSolutionsPage = () => {
  usePageTitle("IT Solutions", "Enterprise IT solutions — cloud computing, cybersecurity, managed services, and infrastructure by NextWeb Australia.");

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-[#d4a853]/20">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
          <Link to="/"><NWLogo /></Link>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link to="/web-development" className="text-gray-400 hover:text-[#d4a853]">Web Development</Link>
            <Link to="/mobile-technology" className="text-gray-400 hover:text-[#d4a853]">Mobile Technology</Link>
            <Link to="/it-solutions" className="text-[#d4a853] font-medium">IT Solutions</Link>
            <Link to="/e-marketing" className="text-gray-400 hover:text-[#d4a853]">E-Marketing</Link>
            <Link to="/automation" className="text-gray-400 hover:text-[#d4a853]">Automation</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" className="text-gray-300 hover:text-[#d4a853]">Sign In</Button></Link>
            <Link to="/demo"><Button className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold">Get a Quote</Button></Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-16 min-h-[70vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#111832] to-[#0a0e1a]" />
        <div className="absolute top-32 left-20 h-80 w-80 bg-[#22c55e]/5 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-4 py-2 mb-6">
              <Server className="h-4 w-4 text-[#22c55e]" />
              <span className="text-sm text-[#22c55e] font-medium">Enterprise IT Solutions</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Robust <span className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] bg-clip-text text-transparent">IT Infrastructure</span> for Modern Business
            </h1>
            <p className="text-lg text-gray-400 mt-6 max-w-2xl">
              Cloud computing, cybersecurity, managed services, and enterprise infrastructure — designed for scalability, security, and performance.
            </p>
            <div className="flex gap-4 mt-8">
              <Link to="/demo"><Button size="lg" className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-bold px-8">Get Started <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0d1225]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">IT Services <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Suite</span></h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Cloud, title: "Cloud Computing (AWS)", desc: "AWS, Azure, and Google Cloud deployment, migration, and management for scalable infrastructure.", color: "from-[#2563eb] to-[#0ea5e9]" },
              { icon: Shield, title: "Cybersecurity", desc: "Penetration testing, vulnerability assessment, SOC monitoring, and compliance-driven security solutions.", color: "from-[#ef4444] to-[#dc2626]" },
              { icon: Network, title: "Managed IT Services", desc: "24/7 monitoring, helpdesk support, patch management, and proactive maintenance for your IT environment.", color: "from-[#22c55e] to-[#16a34a]" },
              { icon: Database, title: "Database Management", desc: "PostgreSQL, MySQL, MongoDB administration with backup, replication, and performance tuning.", color: "from-[#f59e0b] to-[#d97706]" },
              { icon: HardDrive, title: "Backup & Disaster Recovery", desc: "Automated backup solutions with RPO/RTO guarantees and tested disaster recovery procedures.", color: "from-[#8b5cf6] to-[#7c3aed]" },
              { icon: Wifi, title: "Network Infrastructure", desc: "Enterprise networking, SD-WAN, VPN setup, and wireless infrastructure design and implementation.", color: "from-[#ec4899] to-[#db2777]" },
              { icon: Lock, title: "Identity & Access Management", desc: "SSO, MFA, RBAC, and zero-trust security implementations protecting your digital assets.", color: "from-[#d4a853] to-[#b8902e]" },
              { icon: Monitor, title: "Business Intelligence", desc: "Data warehousing, ETL pipelines, analytics dashboards, and AI-driven business insights.", color: "from-[#06b6d4] to-[#0891b2]" },
              { icon: Cpu, title: "AI & Machine Learning", desc: "Custom AI models, NLP, computer vision, and ML pipeline development for business automation.", color: "from-[#a855f7] to-[#9333ea]" },
            ].map((service) => (
              <div key={service.title} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-6 hover:border-[#d4a853]/40 transition-all group">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <service.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{service.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Elevate Your <span className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] bg-clip-text text-transparent">IT Infrastructure</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-10">Partner with NextWeb for enterprise-grade IT solutions that scale with your business.</p>
          <Link to="/demo"><Button size="lg" className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-bold text-lg px-10 py-6 hover:scale-105 transition-all">Book a Consultation <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
        </div>
      </section>

      <PremiumFooter />
    </div>
  );
};

export default ITSolutionsPage;
