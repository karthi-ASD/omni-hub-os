import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PremiumFooter } from "@/components/PremiumFooter";
import {
  Users, Globe, Award, Sparkles, Target, Heart,
  Lightbulb, Shield, Zap, ArrowRight, MapPin, Phone, Mail
} from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";

const values = [
  { icon: Lightbulb, title: "Innovation First", desc: "We push boundaries with cutting-edge AI, automation, and multi-tenant architecture to keep our clients ahead." },
  { icon: Heart, title: "Customer Obsession", desc: "Every feature is designed with our users in mind. Your success is our success, and we never stop improving." },
  { icon: Shield, title: "Trust & Security", desc: "Enterprise-grade security, GDPR compliance, and transparent operations. Your data is always protected." },
  { icon: Zap, title: "Relentless Execution", desc: "We ship fast, iterate constantly, and deliver real value. No bloat, no fluff — just results." },
];

const team = [
  { name: "Rajeev Kumar", role: "Founder & CEO", bio: "20+ years in enterprise software. Former Director at leading Australian IT firms." },
  { name: "Priya Sharma", role: "CTO", bio: "Full-stack architect with expertise in scalable SaaS platforms and AI/ML systems." },
  { name: "Daniel Young", role: "Head of Sales", bio: "15 years of B2B sales leadership. Passionate about helping agencies grow." },
  { name: "Sarah Mitchell", role: "Head of Product", bio: "Ex-Atlassian product lead. Focuses on user experience and product-market fit." },
  { name: "James Chen", role: "Lead Engineer", bio: "Cloud infrastructure specialist. Ensures 99.9% uptime and blazing fast performance." },
  { name: "Maria Garcia", role: "Customer Success", bio: "Dedicated to onboarding and supporting our 500+ agency partners worldwide." },
];

const milestones = [
  { year: "2018", event: "Nextweb Pty Ltd founded on the Gold Coast, Australia" },
  { year: "2019", event: "Launched first SaaS product — CRM for digital agencies" },
  { year: "2020", event: "Expanded to multi-tenant architecture, onboarded 100+ agencies" },
  { year: "2021", event: "Introduced AI-powered lead scoring and sales forecasting" },
  { year: "2022", event: "Government-approved IT supplier across 4 Australian states" },
  { year: "2023", event: "Launched NextWeb OS with 100+ integrated modules" },
  { year: "2024", event: "50,000+ active users, expanded to international markets" },
  { year: "2025", event: "Introduced autonomous AI agents and mobile-first platform" },
];

const AboutPage = () => {
  usePageTitle("About Us", "Learn about Nextweb Pty Ltd — pioneers in digital transformation, powering 500+ agencies worldwide with NextWeb OS.");
  return (
  <div className="min-h-screen bg-[#0a0e1a] text-white">
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-[#d4a853]/20">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
        <Link to="/"><NWLogo /></Link>
        <div className="flex items-center gap-3">
          <Link to="/login"><Button variant="ghost" className="text-gray-300 hover:text-[#d4a853]">Sign In</Button></Link>
          <Link to="/signup"><Button className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold">Get Started</Button></Link>
        </div>
      </div>
    </nav>

    {/* Hero */}
    <section className="pt-32 pb-20 relative">
      <div className="absolute top-20 left-1/4 h-96 w-96 bg-[#d4a853]/5 rounded-full blur-3xl" />
      <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full px-4 py-2 mb-8">
          <Building2 className="h-4 w-4 text-[#d4a853]" />
          <span className="text-sm text-[#d4a853] font-medium">About NextWeb OS</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Building the Future of{" "}
          <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Business Operations</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Born on the Gold Coast of Australia, NextWeb OS is a product of Nextweb Pty Ltd — a government-approved IT supplier dedicated to digital transformation for agencies, enterprises, and growing businesses worldwide.
        </p>
      </div>
    </section>

    {/* Stats */}
    <section className="py-16 border-y border-[#d4a853]/10 bg-[#0d1225]">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "500+", label: "Agencies Worldwide" },
            { value: "50K+", label: "Active Users" },
            { value: "100+", label: "Business Modules" },
            { value: "7+", label: "Years of Innovation" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">{s.value}</div>
              <div className="text-gray-500 mt-1 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Mission */}
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
        <p className="text-xl text-gray-400 leading-relaxed">
          To empower every business with an intelligent, unified platform that eliminates operational chaos, automates repetitive work, and unlocks growth — so teams can focus on what they do best: serving their customers and building something extraordinary.
        </p>
      </div>
    </section>

    {/* Values */}
    <section className="py-20 bg-[#0d1225]">
      <div className="container mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Core Values</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v) => (
            <div key={v.title} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-6 hover:border-[#d4a853]/30 transition-all">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#d4a853] to-[#b8902e] flex items-center justify-center mb-4">
                <v.icon className="h-6 w-6 text-[#0a0e1a]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Team */}
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Meet the Team</h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">The people behind the platform — passionate about technology, obsessed with quality.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((t) => (
            <div key={t.name} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-6 hover:border-[#d4a853]/30 transition-all">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#d4a853]/20 to-[#d4a853]/5 border border-[#d4a853]/20 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-[#d4a853]">{t.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <h3 className="text-lg font-semibold text-white">{t.name}</h3>
              <p className="text-[#d4a853] text-sm font-medium mb-2">{t.role}</p>
              <p className="text-gray-400 text-sm">{t.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Timeline */}
    <section className="py-20 bg-[#0d1225]">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Journey</h2>
        <div className="space-y-6">
          {milestones.map((m, i) => (
            <div key={m.year} className="flex gap-6 items-start">
              <div className="shrink-0 w-16 text-right">
                <span className="text-lg font-bold text-[#d4a853]">{m.year}</span>
              </div>
              <div className="relative">
                <div className="h-3 w-3 rounded-full bg-[#d4a853] mt-2" />
                {i < milestones.length - 1 && <div className="absolute left-1.5 top-5 bottom-0 w-px bg-[#1e2a4a] h-8" />}
              </div>
              <p className="text-gray-300 pt-0.5">{m.event}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Join <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">500+ Agencies?</span>
        </h2>
        <Link to="/signup">
          <Button size="lg" className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-bold text-lg px-8 py-6">
            Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>

    <PremiumFooter />
  </div>
  );
};

export default AboutPage;
