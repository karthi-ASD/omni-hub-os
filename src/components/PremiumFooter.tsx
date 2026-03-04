import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Globe, Linkedin, Twitter, Facebook, Instagram, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NWLogo } from "@/components/NWLogo";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Features", to: "/#features" },
      { label: "Modules", to: "/#modules" },
      { label: "AI Engine", to: "/#ai" },
      { label: "Pricing", to: "/#pricing" },
      { label: "Integrations", to: "/integrations" },
      { label: "Changelog", to: "/changelog" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Digital Agencies", to: "/solutions/agencies" },
      { label: "SEO Companies", to: "/solutions/seo" },
      { label: "Web Development", to: "/solutions/webdev" },
      { label: "Field Services", to: "/solutions/field-services" },
      { label: "Enterprise", to: "/solutions/enterprise" },
      { label: "Startups", to: "/solutions/startups" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Careers", to: "/careers" },
      { label: "Blog", to: "/blog" },
      { label: "Contact Us", to: "/contact" },
      { label: "Partners", to: "/partner-program" },
      { label: "Press Kit", to: "/press" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", to: "/docs" },
      { label: "API Reference", to: "/api-docs" },
      { label: "Help Center", to: "/help" },
      { label: "Status Page", to: "/status" },
      { label: "Community", to: "/community" },
      { label: "Webinars", to: "/webinars" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Security", to: "/security" },
      { label: "GDPR Compliance", to: "/gdpr" },
      { label: "Cookie Policy", to: "/cookies" },
      { label: "Acceptable Use", to: "/acceptable-use" },
    ],
  },
];

export function PremiumFooter() {
  return (
    <footer className="border-t border-[#d4a853]/10 bg-[#060914]">
      <div className="border-b border-[#1e2a4a]">
        <div className="container mx-auto px-4 md:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">Stay Ahead of the Curve</h3>
              <p className="text-gray-500 mt-1">Get product updates, industry insights, and exclusive offers.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input type="email" placeholder="Enter your email" className="h-11 px-4 rounded-lg bg-[#111832] border border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853] focus:outline-none text-sm flex-1 md:w-72" />
              <Button className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold hover:from-[#e0b85e] hover:to-[#c99d3a] shrink-0">
                Subscribe <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="mb-5">
              <NWLogo />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              The complete business operating system powering 500+ digital agencies and enterprises worldwide.
            </p>
            
            <div className="space-y-3 text-sm text-gray-500">
              <p className="font-semibold text-gray-400">Nextweb Pty Ltd</p>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[#d4a853]" />
                <span>Level 2, Suite 38, Oasis Shopping Centre, 75 Surf Parade, Broadbeach QLD 4218, Australia</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-[#d4a853]" />
                <a href="tel:1800365247" className="hover:text-[#d4a853] transition-colors">1800 365 247</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-[#d4a853]" />
                <a href="mailto:info@nextweb.com.au" className="hover:text-[#d4a853] transition-colors">info@nextweb.com.au</a>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 shrink-0 text-[#d4a853]" />
                <a href="https://www.nextweb.com.au" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4a853] transition-colors">www.nextweb.com.au</a>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                <p>ABN: 94 613 674 445</p>
                <p>ACN: 613 674 445</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {[Linkedin, Twitter, Facebook, Instagram].map((Icon, i) => (
                <a key={i} href="#" className="h-9 w-9 rounded-lg bg-[#111832] border border-[#1e2a4a] flex items-center justify-center text-gray-500 hover:text-[#d4a853] hover:border-[#d4a853]/30 transition-all">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-white text-sm mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-gray-500 hover:text-[#d4a853] transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#1e2a4a]">
        <div className="container mx-auto px-4 md:px-8 py-8 text-center">
          <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-4">Government Approved IT Supplier</p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-600">
            <span className="px-3 py-1.5 bg-[#111832] border border-[#1e2a4a] rounded-full">🏛️ Queensland Government</span>
            <span className="px-3 py-1.5 bg-[#111832] border border-[#1e2a4a] rounded-full">🏛️ NSW Government</span>
            <span className="px-3 py-1.5 bg-[#111832] border border-[#1e2a4a] rounded-full">🏛️ Victorian Government</span>
            <span className="px-3 py-1.5 bg-[#111832] border border-[#1e2a4a] rounded-full">🏛️ SA Government</span>
          </div>
        </div>
      </div>

      <div className="border-t border-[#1e2a4a]">
        <div className="container mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <p>© {new Date().getFullYear()} Nextweb Pty Ltd. All rights reserved. Built with ❤️ for agencies that dream big.</p>
            <div className="flex gap-4">
              <Link to="/privacy" className="hover:text-[#d4a853] transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-[#d4a853] transition-colors">Terms</Link>
              <Link to="/security" className="hover:text-[#d4a853] transition-colors">Security</Link>
              <Link to="/cookies" className="hover:text-[#d4a853] transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
