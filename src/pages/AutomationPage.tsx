import { Link } from "react-router-dom";
import { PremiumFooter } from "@/components/PremiumFooter";
import { NWLogo } from "@/components/NWLogo";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Zap, MessageSquare, Mail, Phone, ArrowRight, CheckCircle2,
  Bot, Workflow, Clock, Target, Bell, Shield, Globe, Brain,
  Send, Users, BarChart3, Sparkles, MessageCircle, PhoneCall
} from "lucide-react";

const AutomationPage = () => {
  usePageTitle("Business Automation", "WhatsApp, Email, SMS, Telephone, and AI automation — streamline your entire business operation with NextWeb OS.");

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-[#d4a853]/20">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
          <Link to="/"><NWLogo /></Link>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link to="/web-development" className="text-gray-400 hover:text-[#d4a853]">Web Development</Link>
            <Link to="/mobile-technology" className="text-gray-400 hover:text-[#d4a853]">Mobile Technology</Link>
            <Link to="/it-solutions" className="text-gray-400 hover:text-[#d4a853]">IT Solutions</Link>
            <Link to="/e-marketing" className="text-gray-400 hover:text-[#d4a853]">E-Marketing</Link>
            <Link to="/automation" className="text-[#d4a853] font-medium">Automation</Link>
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
        <div className="absolute top-32 right-20 h-96 w-96 bg-[#d4a853]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 h-72 w-72 bg-[#2563eb]/5 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full px-4 py-2 mb-6">
              <Zap className="h-4 w-4 text-[#d4a853]" />
              <span className="text-sm text-[#d4a853] font-medium">Business Automation Suite</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Automate <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Everything</span> — WhatsApp, Email, SMS & More
            </h1>
            <p className="text-lg text-gray-400 mt-6 max-w-2xl">
              End-to-end business automation that handles customer communications, follow-ups, appointment scheduling, invoicing, and marketing — while you focus on growing.
            </p>
            <div className="flex gap-4 mt-8">
              <Link to="/demo"><Button size="lg" className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-bold px-8">Automate Your Business <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Automation Categories */}
      <section className="py-20 bg-[#0d1225]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold"><span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Communication</span> Automation</h2>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">Automate every channel your customers use</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: MessageCircle, title: "WhatsApp Automation", color: "from-[#25D366] to-[#128C7E]",
                desc: "Automated WhatsApp Business API messaging for lead follow-up, appointment reminders, order updates, and customer support.",
                features: ["Auto-reply to new inquiries in < 30 seconds", "Appointment confirmation & reminders", "Order status notifications", "Broadcast messages & campaigns", "AI chatbot for 24/7 support", "Template message management", "Rich media messages (images, docs, videos)", "Customer segmentation & targeting"]
              },
              {
                icon: Mail, title: "Email Automation", color: "from-[#2563eb] to-[#0ea5e9]",
                desc: "Intelligent email automation with drip campaigns, transactional emails, and personalized sequences that nurture leads to conversion.",
                features: ["Welcome email sequences", "Lead nurturing drip campaigns", "Invoice & payment reminders", "Abandoned cart recovery", "Newsletter automation", "A/B testing & optimization", "Dynamic content personalization", "Deliverability monitoring"]
              },
              {
                icon: MessageSquare, title: "SMS Automation", color: "from-[#f59e0b] to-[#d97706]",
                desc: "Automated SMS messaging for time-sensitive notifications, appointment reminders, promotional campaigns, and two-factor authentication.",
                features: ["Appointment reminders (24h & 1h before)", "Payment due notifications", "Promotional campaigns & offers", "Two-factor authentication (2FA)", "Delivery notifications", "Survey & feedback requests", "Bulk SMS campaigns", "Opt-in/opt-out management"]
              },
              {
                icon: PhoneCall, title: "Telephone Automation", color: "from-[#8b5cf6] to-[#7c3aed]",
                desc: "IVR systems, auto-dialer, call routing, voicemail transcription, and AI-powered call analytics for your sales and support teams.",
                features: ["Interactive Voice Response (IVR)", "Auto-dialer for outbound sales", "Intelligent call routing & queuing", "Voicemail-to-email transcription", "Call recording & analytics", "AI-powered call sentiment analysis", "Missed call auto-SMS response", "Business hours & holiday routing"]
              },
            ].map((automation) => (
              <div key={automation.title} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-8 hover:border-[#d4a853]/40 transition-all group">
                <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${automation.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <automation.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{automation.title}</h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">{automation.desc}</p>
                <ul className="grid grid-cols-1 gap-2">
                  {automation.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="h-4 w-4 text-[#d4a853] flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Automation */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold"><span className="bg-gradient-to-r from-[#2563eb] to-[#0ea5e9] bg-clip-text text-transparent">Workflow</span> Automation</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "Lead Capture & Routing", desc: "Auto-capture leads from web forms, social media, and ads. Route to the right salesperson based on rules." },
              { icon: Clock, title: "Follow-up Sequences", desc: "Multi-step follow-up sequences across email, SMS, and WhatsApp with intelligent timing and personalization." },
              { icon: Bell, title: "Smart Notifications", desc: "Real-time alerts for high-priority leads, overdue tasks, payment reminders, and SLA breaches." },
              { icon: Workflow, title: "Task Automation", desc: "Auto-create tasks, assign team members, set deadlines, and trigger notifications based on business events." },
              { icon: BarChart3, title: "Report Generation", desc: "Automated weekly/monthly reports delivered via email with KPIs, charts, and actionable insights." },
              { icon: Bot, title: "AI Agent Automation", desc: "Autonomous AI agents that handle repetitive tasks — data entry, client outreach, and content generation." },
              { icon: Send, title: "Invoice Automation", desc: "Auto-generate invoices on project milestones, send payment reminders, and reconcile payments automatically." },
              { icon: Users, title: "Onboarding Automation", desc: "Automated client onboarding flows — welcome emails, access setup, kickoff scheduling, and document collection." },
              { icon: Shield, title: "Compliance Automation", desc: "Automated compliance checks, document expiry alerts, audit trail generation, and regulatory reporting." },
            ].map((item) => (
              <div key={item.title} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-6 hover:border-[#2563eb]/40 transition-all group">
                <item.icon className="h-8 w-8 text-[#2563eb] mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-[#0d1225]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">How Automation <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Works</span></h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Trigger", desc: "An event occurs — new lead, payment due, appointment scheduled, or custom trigger." },
              { step: "02", title: "Condition", desc: "Rules evaluate the trigger — lead score > 80, invoice overdue > 7 days, VIP client, etc." },
              { step: "03", title: "Action", desc: "Automated actions execute — send WhatsApp, create task, update CRM, notify team." },
              { step: "04", title: "Monitor", desc: "Track automation performance — delivery rates, response times, conversion impact." },
            ].map((phase) => (
              <div key={phase.step} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-6 text-center hover:border-[#d4a853]/40 transition-all">
                <div className="text-5xl font-bold text-[#d4a853]/20 mb-4">{phase.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{phase.title}</h3>
                <p className="text-gray-400 text-sm">{phase.desc}</p>
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
              { value: "10M+", label: "Messages Automated" },
              { value: "85%", label: "Response Time Reduction" },
              { value: "40%", label: "More Conversions" },
              { value: "500+", label: "Businesses Automated" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-gray-400 mt-2 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Stop Doing Manually What <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Automation Can Handle</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-10">Book a demo to see how NextWeb OS can automate your WhatsApp, email, SMS, phone calls, and business workflows.</p>
          <Link to="/demo"><Button size="lg" className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-bold text-lg px-10 py-6 hover:scale-105 transition-all">Book Automation Demo <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
        </div>
      </section>

      <PremiumFooter />
    </div>
  );
};

export default AutomationPage;
