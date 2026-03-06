import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Globe, Linkedin, Twitter, Facebook, Instagram, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NWLogo } from "@/components/NWLogo";

const footerSections = [
  {
    title: "Services",
    links: [
      { label: "Web Development", to: "/web-development" },
      { label: "Mobile Technology", to: "/mobile-technology" },
      { label: "IT Solutions", to: "/it-solutions" },
      { label: "E-Marketing & SEO", to: "/e-marketing" },
      { label: "Business Automation", to: "/automation" },
      { label: "Get a Quote", to: "/demo" },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "Features", to: "/#features" },
      { label: "100+ Modules", to: "/#modules" },
      { label: "AI Engine", to: "/#ai" },
      { label: "Pricing", to: "/#pricing" },
      { label: "Integrations", to: "/analytics-integrations" },
      { label: "Changelog", to: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Careers", to: "/careers" },
      { label: "Blog", to: "/blog" },
      { label: "Contact Us", to: "/contact" },
      { label: "Partners", to: "/about" },
      { label: "Demo Request", to: "/demo" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", to: "/blog" },
      { label: "Help Center", to: "/contact" },
      { label: "Community", to: "/blog" },
      { label: "Webinars", to: "/blog" },
      { label: "Case Studies", to: "/blog" },
      { label: "API Reference", to: "/blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Security", to: "/security" },
      { label: "GDPR Compliance", to: "/privacy" },
      { label: "Cookie Policy", to: "/privacy" },
      { label: "Acceptable Use", to: "/terms" },
    ],
  },
];

export function PremiumFooter() {
  return (
    <footer className="border-t border-sidebar-border bg-sidebar">
      <div className="border-b border-sidebar-border">
        <div className="container mx-auto px-4 md:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-primary-foreground">Stay Ahead of the Curve</h3>
              <p className="text-sidebar-foreground mt-1">Get product updates, industry insights, and exclusive offers.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input type="email" placeholder="Enter your email" className="h-11 px-4 rounded-lg bg-sidebar-accent border border-sidebar-border text-primary-foreground placeholder:text-sidebar-foreground/50 focus:border-primary focus:outline-none text-sm flex-1 md:w-72" />
              <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shrink-0">
                Subscribe <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="mb-5"><NWLogo /></div>
            <p className="text-sidebar-foreground text-sm leading-relaxed mb-6">
              The complete business operating system powering 500+ digital agencies and enterprises worldwide.
            </p>
            <div className="space-y-3 text-sm text-sidebar-foreground">
              <p className="font-semibold text-sidebar-foreground/80">Nextweb Pty Ltd</p>
              <div className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span>Level 2, Suite 38, Oasis Shopping Centre, 75 Surf Parade, Broadbeach QLD 4218, Australia</span></div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" /><a href="tel:1800365247" className="hover:text-primary transition-colors">1800 365 247</a></div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-primary" /><a href="mailto:info@nextweb.com.au" className="hover:text-primary transition-colors">info@nextweb.com.au</a></div>
              <div className="flex items-center gap-2"><Globe className="h-4 w-4 shrink-0 text-primary" /><a href="https://www.nextweb.com.au" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">www.nextweb.com.au</a></div>
              <div className="text-xs text-sidebar-foreground/60 mt-2"><p>ABN: 94 613 674 445</p><p>ACN: 613 674 445</p></div>
            </div>
            <div className="flex gap-3 mt-6">
              {[Linkedin, Twitter, Facebook, Instagram].map((Icon, i) => (
                <a key={i} href="#" className="h-9 w-9 rounded-lg bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-sidebar-foreground hover:text-primary hover:border-primary/30 transition-all">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-primary-foreground text-sm mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}><Link to={link.to} className="text-sm text-sidebar-foreground hover:text-primary transition-colors">{link.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-sidebar-border">
        <div className="container mx-auto px-4 md:px-8 py-8 text-center">
          <p className="text-xs text-sidebar-foreground/60 font-semibold uppercase tracking-wider mb-4">Government Approved IT Supplier</p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-sidebar-foreground/60">
            {["Queensland Government", "NSW Government", "Victorian Government", "SA Government"].map(g => (
              <span key={g} className="px-3 py-1.5 bg-sidebar-accent border border-sidebar-border rounded-full">🏛️ {g}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-sidebar-border">
        <div className="container mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-sidebar-foreground/60">
            <p>© {new Date().getFullYear()} Nextweb Pty Ltd. All rights reserved. Built with ❤️ for agencies that dream big.</p>
            <div className="flex gap-4">
              {["Privacy", "Terms", "Security", "Cookies"].map(l => (
                <Link key={l} to={`/${l.toLowerCase()}`} className="hover:text-primary transition-colors">{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
