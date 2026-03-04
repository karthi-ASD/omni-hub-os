import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PremiumFooter } from "@/components/PremiumFooter";
import { Shield, Lock, Eye, Database, Server, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";

const features = [
  { icon: Lock, title: "End-to-End Encryption", desc: "All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Your sensitive business data is protected at every layer." },
  { icon: Database, title: "Row-Level Security", desc: "PostgreSQL row-level security policies ensure complete multi-tenant data isolation. No tenant can ever access another's data." },
  { icon: Eye, title: "Audit Logging", desc: "Every action is logged with actor, timestamp, IP address, and before/after states. Full compliance trail for regulatory audits." },
  { icon: Server, title: "SOC 2 Type II", desc: "Our infrastructure meets SOC 2 Type II compliance standards for security, availability, processing integrity, and confidentiality." },
  { icon: Shield, title: "GDPR Compliant", desc: "Full GDPR compliance including data minimization, right to erasure, data portability, and explicit consent management." },
  { icon: CheckCircle2, title: "Regular Penetration Testing", desc: "We conduct quarterly penetration tests by independent security firms and remediate all findings within 48 hours." },
];

const SecurityPage = () => {
  usePageTitle("Security", "Enterprise-grade security at every layer. AES-256 encryption, row-level security, SOC 2 Type II, and GDPR compliance.");
  return (
  <div className="min-h-screen bg-[#0a0e1a] text-white">
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-[#d4a853]/20">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
        <Link to="/"><NWLogo /></Link>
        <Link to="/signup"><Button className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold">Get Started</Button></Link>
      </div>
    </nav>

    <section className="pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full px-4 py-2 mb-8">
            <Shield className="h-4 w-4 text-[#d4a853]" />
            <span className="text-sm text-[#d4a853] font-medium">Enterprise Security</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Security at <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Every Layer</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">Your data is our most important asset to protect. Here's how we keep your business safe.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((f) => (
            <div key={f.title} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-6 hover:border-[#d4a853]/30 transition-all">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#0ea5e9] flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#111832] border border-[#1e2a4a] rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Report a Vulnerability</h2>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">We take security seriously. If you've discovered a vulnerability, please report it responsibly.</p>
          <Link to="/contact"><Button className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold">Contact Security Team <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </div>
    </section>
    <PremiumFooter />
  </div>
  );
};

export default SecurityPage;
