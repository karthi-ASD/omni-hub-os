import { Link } from "react-router-dom";
import { PremiumFooter } from "@/components/PremiumFooter";
import { NWLogo } from "@/components/NWLogo";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Megaphone, Search, Mail, TrendingUp, ArrowRight, CheckCircle2,
  Globe, Target, BarChart3, MousePointerClick, Share2, PenTool,
  Newspaper, Video, MessageSquare, Users, DollarSign, Eye
} from "lucide-react";

const EMarketingPage = () => {
  usePageTitle("E-Marketing & Digital Marketing", "Full-service digital marketing — SEO, PPC, social media, email marketing, and content strategy by NextWeb Australia.");

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-[#d4a853]/20">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
          <Link to="/"><NWLogo /></Link>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link to="/web-development" className="text-gray-400 hover:text-[#d4a853]">Web Development</Link>
            <Link to="/mobile-technology" className="text-gray-400 hover:text-[#d4a853]">Mobile Technology</Link>
            <Link to="/it-solutions" className="text-gray-400 hover:text-[#d4a853]">IT Solutions</Link>
            <Link to="/e-marketing" className="text-[#d4a853] font-medium">E-Marketing</Link>
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
        <div className="absolute top-32 right-10 h-80 w-80 bg-[#ec4899]/5 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#ec4899]/10 border border-[#ec4899]/30 rounded-full px-4 py-2 mb-6">
              <Megaphone className="h-4 w-4 text-[#ec4899]" />
              <span className="text-sm text-[#ec4899] font-medium">Digital Marketing Services</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Grow Your Business With <span className="bg-gradient-to-r from-[#ec4899] to-[#db2777] bg-clip-text text-transparent">Digital Marketing</span>
            </h1>
            <p className="text-lg text-gray-400 mt-6 max-w-2xl">
              SEO, Google Ads, social media marketing, email campaigns, and content strategy — data-driven marketing that delivers measurable ROI.
            </p>
            <div className="flex gap-4 mt-8">
              <Link to="/demo"><Button size="lg" className="bg-gradient-to-r from-[#ec4899] to-[#db2777] text-white font-bold px-8">Get Free Audit <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0d1225]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">Marketing <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Services</span></h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Search, title: "Search Engine Optimization (SEO)", desc: "On-page, off-page, technical SEO, keyword research, and Google Business Profile optimization to rank #1.", features: ["Keyword Research & Strategy", "On-page Optimization", "Link Building", "Local SEO & GBP", "Monthly Reporting"] },
              { icon: MousePointerClick, title: "Pay-Per-Click (PPC)", desc: "Google Ads, Bing Ads, and social media advertising with conversion tracking and ROI optimization.", features: ["Google Ads Management", "Display & Remarketing", "Shopping Campaigns", "A/B Testing", "Conversion Tracking"] },
              { icon: Share2, title: "Social Media Marketing", desc: "Facebook, Instagram, LinkedIn, TikTok — content creation, community management, and paid social campaigns.", features: ["Content Calendar", "Community Management", "Paid Social Ads", "Influencer Outreach", "Analytics & Reporting"] },
              { icon: Mail, title: "Email Marketing", desc: "Automated email campaigns, drip sequences, newsletter design, and deliverability optimization.", features: ["Campaign Automation", "List Segmentation", "A/B Testing", "Drip Sequences", "Performance Analytics"] },
              { icon: PenTool, title: "Content Marketing", desc: "Blog posts, whitepapers, case studies, infographics, and video content that educates and converts.", features: ["Content Strategy", "Blog Writing", "Case Studies", "Infographic Design", "Video Production"] },
              { icon: BarChart3, title: "Analytics & Reporting", desc: "Google Analytics 4, Search Console, heatmaps, and custom dashboards for data-driven decisions.", features: ["GA4 Setup & Config", "Custom Dashboards", "Conversion Tracking", "Heatmap Analysis", "Monthly Reports"] },
            ].map((service) => (
              <div key={service.title} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-6 hover:border-[#ec4899]/40 transition-all group">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#ec4899] to-[#db2777] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <service.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{service.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{service.desc}</p>
                <ul className="space-y-2">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="h-4 w-4 text-[#ec4899] flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-16 border-y border-[#d4a853]/10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "SEO Campaigns" },
              { value: "300%", label: "Avg ROI Increase" },
              { value: "10K+", label: "Keywords Ranked" },
              { value: "$5M+", label: "Revenue Generated" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold bg-gradient-to-r from-[#ec4899] to-[#db2777] bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-gray-400 mt-2 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Dominate Your <span className="bg-gradient-to-r from-[#ec4899] to-[#db2777] bg-clip-text text-transparent">Digital Market</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-10">Let our marketing experts audit your digital presence and create a winning strategy.</p>
          <Link to="/demo"><Button size="lg" className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-bold text-lg px-10 py-6 hover:scale-105 transition-all">Get Free Marketing Audit <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
        </div>
      </section>

      <PremiumFooter />
    </div>
  );
};

export default EMarketingPage;
