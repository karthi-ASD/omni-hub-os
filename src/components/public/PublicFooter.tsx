import React from "react";
import { Link } from "react-router-dom";
import { NWLogo } from "@/components/NWLogo";
import { MapPin, Phone, Mail } from "lucide-react";

const footerSections = [
  {
    title: "Platform",
    links: [
      { label: "Customer 360", to: "/platform/customer-360" },
      { label: "Sales CRM", to: "/platform/sales-crm" },
      { label: "Service CRM", to: "/platform/service-crm" },
      { label: "Marketing Automation", to: "/platform/marketing-automation" },
      { label: "Analytics & BI", to: "/platform/analytics" },
      { label: "AI Automation", to: "/platform/ai-automation" },
      { label: "SEO OS", to: "/platform/seo-os" },
      { label: "Finance & Invoicing", to: "/platform/finance" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Website Design", to: "/services/website-design" },
      { label: "App Development", to: "/services/app-development" },
      { label: "SEO Services", to: "/services/search-engine-optimization" },
      { label: "Digital Strategy", to: "/services/digital-transformation" },
      { label: "AI Solutions", to: "/services/artificial-intelligence" },
      { label: "CRM Implementation", to: "/services/crm" },
      { label: "DevOps", to: "/services/devops" },
      { label: "Content Marketing", to: "/services/content-marketing" },
    ],
  },
  {
    title: "Industries",
    links: [
      { label: "Healthcare", to: "/industries/healthcare" },
      { label: "Education", to: "/industries/education" },
      { label: "Finance", to: "/industries/finance" },
      { label: "Government", to: "/industries/government" },
      { label: "Real Estate", to: "/industries/real-estate" },
      { label: "Software & Tech", to: "/industries/software-technology" },
      { label: "Retail", to: "/industries/retail" },
      { label: "Manufacturing", to: "/industries/manufacturing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Careers", to: "/careers" },
      { label: "Blog", to: "/blog" },
      { label: "Contact", to: "/contact" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Security", to: "/security" },
      { label: "Request Demo", to: "/demo" },
    ],
  },
];

const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-[hsl(222,47%,5%)] border-t border-[hsl(222,30%,14%)]">
      <div className="container mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <NWLogo />
            <p className="text-[hsl(210,20%,55%)] text-sm mt-4 leading-relaxed max-w-xs">
              Australia's all-in-one business operating system for CRM, AI, apps, websites, SEO, and enterprise growth.
            </p>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-[hsl(210,20%,60%)]">
                <MapPin className="h-4 w-4 text-[hsl(190,80%,55%)]" />
                Brisbane & Gold Coast, Australia
              </div>
              <div className="flex items-center gap-2 text-[hsl(210,20%,60%)]">
                <Phone className="h-4 w-4 text-[hsl(190,80%,55%)]" />
                1300 NEXTWEB
              </div>
              <div className="flex items-center gap-2 text-[hsl(210,20%,60%)]">
                <Mail className="h-4 w-4 text-[hsl(190,80%,55%)]" />
                hello@nextweb.com.au
              </div>
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-[hsl(210,20%,55%)] hover:text-[hsl(190,80%,55%)] text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[hsl(222,30%,14%)]">
        <div className="container mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[hsl(210,20%,45%)] text-xs">
            © {new Date().getFullYear()} Nextweb Pty Ltd. All rights reserved. ABN XX XXX XXX XXX.
          </p>
          <div className="flex items-center gap-6 text-xs text-[hsl(210,20%,45%)]">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/security" className="hover:text-white transition-colors">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
