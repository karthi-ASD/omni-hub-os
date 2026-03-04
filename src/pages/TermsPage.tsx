import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PremiumFooter } from "@/components/PremiumFooter";
import { Building2, FileText, ArrowRight } from "lucide-react";

const sections = [
  { title: "1. Acceptance of Terms", content: "By accessing or using NextWeb OS, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this service." },
  { title: "2. Service Description", content: "NextWeb OS is a comprehensive business operating system providing CRM, project management, invoicing, SEO tools, AI automation, and 100+ integrated business modules. The service is provided on a subscription basis with various tiers." },
  { title: "3. Account Registration", content: "You must provide accurate, complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must notify us immediately of any unauthorized use." },
  { title: "4. Subscription & Payments", content: "Paid subscriptions are billed in advance on a monthly or annual basis. Refunds are available within the first 14 days of a new subscription. Price changes will be communicated 30 days in advance." },
  { title: "5. Data Ownership", content: "You retain all rights to your data. We do not claim ownership of any content you create, upload, or store on our platform. Upon account termination, you may export your data within 30 days." },
  { title: "6. Multi-Tenant Usage", content: "Each business account is isolated. Administrators are responsible for managing user access within their organization. Cross-tenant data sharing is not permitted without explicit consent." },
  { title: "7. Acceptable Use", content: "You agree not to use the service for illegal purposes, to transmit malware, to attempt unauthorized access to other accounts, to reverse engineer the platform, or to violate the intellectual property rights of others." },
  { title: "8. API Usage", content: "API access is subject to rate limits based on your subscription tier. API keys must be kept confidential. We reserve the right to restrict API access if usage patterns indicate abuse." },
  { title: "9. Service Level Agreement", content: "We guarantee 99.9% uptime for all paid plans. Scheduled maintenance windows are communicated 48 hours in advance. In the event of SLA breach, credits will be applied to your account." },
  { title: "10. Limitation of Liability", content: "NextWeb OS shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the service. Our total liability shall not exceed the amount paid by you in the preceding 12 months." },
  { title: "11. Termination", content: "Either party may terminate the agreement with 30 days written notice. Upon termination, your data will be available for export for 30 days, after which it will be permanently deleted." },
  { title: "12. Governing Law", content: "These terms shall be governed by and construed in accordance with the laws of Queensland, Australia. Any disputes shall be resolved in the courts of Queensland." },
];

const TermsPage = () => (
  <div className="min-h-screen bg-[#0a0e1a] text-white">
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-[#d4a853]/20">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#d4a853] to-[#b8902e] flex items-center justify-center"><Building2 className="h-5 w-5 text-[#0a0e1a]" /></div>
          <span className="text-xl font-bold bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">NextWeb OS</span>
        </Link>
        <Link to="/signup"><Button className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold">Get Started</Button></Link>
      </div>
    </nav>

    <section className="pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full px-4 py-2 mb-8">
            <FileText className="h-4 w-4 text-[#d4a853]" />
            <span className="text-sm text-[#d4a853] font-medium">Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-400">Last updated: March 1, 2026 • Nextweb Pty Ltd</p>
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
          <p className="text-gray-500 text-sm mb-4">Questions about our terms?</p>
          <Link to="/contact"><Button variant="outline" className="border-[#d4a853]/40 text-[#d4a853] hover:bg-[#d4a853]/10">Contact Us <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </div>
    </section>
    <PremiumFooter />
  </div>
);

export default TermsPage;
