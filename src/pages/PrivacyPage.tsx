import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PremiumFooter } from "@/components/PremiumFooter";
import { Shield, Lock, Eye, Database, Globe, CheckCircle2, ArrowRight } from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";

const sections = [
  { title: "1. Information We Collect", content: "We collect information you provide directly (name, email, phone, business details) when you create an account, make a purchase, or contact us. We also automatically collect usage data including IP addresses, browser type, device information, and interaction patterns with our platform." },
  { title: "2. How We Use Your Information", content: "We use collected information to provide and improve our services, process transactions, send communications, ensure security, and comply with legal obligations. We never sell your personal data to third parties." },
  { title: "3. Data Storage & Security", content: "All data is encrypted at rest and in transit using industry-standard AES-256 encryption. We use enterprise-grade infrastructure with SOC 2 Type II compliance, regular security audits, and multi-factor authentication." },
  { title: "4. Multi-Tenant Data Isolation", content: "NextWeb OS employs strict row-level security policies ensuring complete data isolation between tenants. Each business's data is logically separated and cannot be accessed by other tenants under any circumstances." },
  { title: "5. Third-Party Services", content: "We integrate with trusted third-party services (payment gateways, email providers, analytics) that comply with our data protection standards. Each integration is vetted for security compliance." },
  { title: "6. Your Rights", content: "You have the right to access, correct, delete, or export your data at any time. You may also opt out of marketing communications and request a copy of all data we hold about you." },
  { title: "7. GDPR Compliance", content: "For EU/EEA residents, we comply with all GDPR requirements including lawful basis for processing, data minimization, purpose limitation, and the right to be forgotten." },
  { title: "8. Data Retention", content: "We retain your data for as long as your account is active or as needed to provide services. Upon account deletion, all personal data is permanently removed within 30 days." },
  { title: "9. Cookies", content: "We use essential cookies for authentication and security, and optional analytics cookies to improve our services. You can manage cookie preferences through your browser settings." },
  { title: "10. Changes to This Policy", content: "We may update this privacy policy from time to time. We will notify you of any material changes via email or through our platform." },
];

const PrivacyPage = () => {
  usePageTitle("Privacy Policy", "NextWeb OS Privacy Policy — how we collect, use, and protect your data. GDPR compliant.");
  return (
  <div className="min-h-screen bg-[#0a0e1a] text-white">
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-[#d4a853]/20">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
        <Link to="/"><NWLogo /></Link>
        <Link to="/signup"><Button className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold">Get Started</Button></Link>
      </div>
    </nav>

    <section className="pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full px-4 py-2 mb-8">
            <Shield className="h-4 w-4 text-[#d4a853]" />
            <span className="text-sm text-[#d4a853] font-medium">Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: March 1, 2026 • Nextweb Pty Ltd (ABN: 94 613 674 445)</p>
        </div>

        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-3">{s.title}</h2>
              <p className="text-gray-400 leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-4">Questions about our privacy practices?</p>
          <Link to="/contact"><Button variant="outline" className="border-[#d4a853]/40 text-[#d4a853] hover:bg-[#d4a853]/10">Contact Us <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </div>
    </section>
    <PremiumFooter />
  </div>
);

export default PrivacyPage;
