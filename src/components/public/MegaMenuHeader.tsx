import React, { useState } from "react";
import { Link } from "react-router-dom";
import { NWLogo } from "@/components/NWLogo";
import { Button } from "@/components/ui/button";
import {
  ChevronDown, Menu, X, Users, BarChart3, Headphones, Mail,
  ShoppingCart, PieChart, Link2, Code2, Smartphone, Brain, Shield,
  Search, Receipt, Briefcase, Globe, Lightbulb, Palette, Wrench,
  Server, Cpu, Blocks, Layers, GraduationCap, Building2, Plane,
  Landmark, MonitorSmartphone, Film, DollarSign, Home, Factory,
  Zap, ShoppingBag, Leaf, PiggyBank, Store, Tablet, GitMerge,
  Cloud, MailCheck, Lock, Figma,
} from "lucide-react";

interface MegaSection {
  label: string;
  to: string;
  icon: React.ElementType;
  desc: string;
}

const platformItems: MegaSection[] = [
  { label: "Customer 360", to: "/platform/customer-360", icon: Users, desc: "Unified customer view" },
  { label: "Sales CRM", to: "/platform/sales-crm", icon: BarChart3, desc: "Leads, pipeline & revenue" },
  { label: "Service CRM", to: "/platform/service-crm", icon: Headphones, desc: "Tickets & support" },
  { label: "Marketing Automation", to: "/platform/marketing-automation", icon: Mail, desc: "Campaigns & nurturing" },
  { label: "Commerce", to: "/platform/commerce", icon: ShoppingCart, desc: "Storefront & orders" },
  { label: "Analytics & BI", to: "/platform/analytics", icon: PieChart, desc: "Dashboards & insights" },
  { label: "Integration", to: "/platform/integration", icon: Link2, desc: "APIs & connectors" },
  { label: "Platform / Low-Code", to: "/platform/low-code", icon: Code2, desc: "Build custom apps" },
  { label: "Mobile Technology", to: "/platform/mobile", icon: Smartphone, desc: "iOS, Android & hybrid" },
  { label: "AI Automation", to: "/platform/ai-automation", icon: Brain, desc: "Intelligent workflows" },
  { label: "Security", to: "/platform/security", icon: Shield, desc: "Enterprise-grade trust" },
  { label: "SEO OS", to: "/platform/seo-os", icon: Search, desc: "Rankings & audits" },
  { label: "Finance & Invoicing", to: "/platform/finance", icon: Receipt, desc: "Quote-to-cash" },
  { label: "HR & Payroll", to: "/platform/hr-payroll", icon: Briefcase, desc: "Employee management" },
];

const serviceItems: MegaSection[] = [
  { label: "Digital Strategy", to: "/services/digital-transformation", icon: Lightbulb, desc: "Consulting & workshops" },
  { label: "Website Design", to: "/services/website-design", icon: Palette, desc: "Premium web design" },
  { label: "App Development", to: "/services/app-development", icon: Smartphone, desc: "Android, iOS & hybrid" },
  { label: "Website Development", to: "/services/website-development", icon: Code2, desc: "Portals & eCommerce" },
  { label: "SEO Services", to: "/services/search-engine-optimization", icon: Search, desc: "Technical & local SEO" },
  { label: "AI Solutions", to: "/services/artificial-intelligence", icon: Brain, desc: "AI-driven automation" },
  { label: "DevOps", to: "/services/devops", icon: Server, desc: "CI/CD & cloud infra" },
  { label: "CRM Implementation", to: "/services/crm", icon: Users, desc: "Setup & migration" },
  { label: "SEM & PPC", to: "/services/sem", icon: Zap, desc: "Paid search & ads" },
  { label: "Social Media", to: "/services/social-media-marketing", icon: Globe, desc: "Strategy & management" },
  { label: "Content Marketing", to: "/services/content-marketing", icon: Layers, desc: "Strategy & creation" },
  { label: "Business Intelligence", to: "/services/business-intelligence", icon: PieChart, desc: "Data & analytics" },
];

const industryItems: MegaSection[] = [
  { label: "Healthcare", to: "/industries/healthcare", icon: Wrench, desc: "Digital health solutions" },
  { label: "Education", to: "/industries/education", icon: GraduationCap, desc: "EdTech & e-learning" },
  { label: "Finance", to: "/industries/finance", icon: DollarSign, desc: "FinTech & banking" },
  { label: "Government", to: "/industries/government", icon: Landmark, desc: "GovTech solutions" },
  { label: "Real Estate", to: "/industries/real-estate", icon: Home, desc: "PropTech platforms" },
  { label: "Travel & Tourism", to: "/industries/travel-tourism", icon: Plane, desc: "Booking & management" },
  { label: "Software & Technology", to: "/industries/software-technology", icon: MonitorSmartphone, desc: "SaaS & IT" },
  { label: "Retail", to: "/industries/retail", icon: Store, desc: "Omnichannel commerce" },
  { label: "Manufacturing", to: "/industries/manufacturing", icon: Factory, desc: "Operations & supply" },
  { label: "Media & Entertainment", to: "/industries/media-entertainment", icon: Film, desc: "Content & streaming" },
  { label: "Energy", to: "/industries/energy", icon: Leaf, desc: "Clean energy tech" },
  { label: "Small Business", to: "/industries/small-business", icon: ShoppingBag, desc: "Growth solutions" },
];

const megaMenus = {
  platform: { title: "Platform", items: platformItems, cols: "lg:grid-cols-3" },
  services: { title: "Services", items: serviceItems, cols: "lg:grid-cols-3" },
  industries: { title: "Industries", items: industryItems, cols: "lg:grid-cols-3" },
};

type MenuKey = keyof typeof megaMenus;

const MegaMenuHeader: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsl(222,47%,8%)]/95 backdrop-blur-xl border-b border-[hsl(222,30%,18%)]">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
        <Link to="/" className="flex-shrink-0">
          <NWLogo />
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {(["platform", "services", "industries"] as MenuKey[]).map((key) => (
            <div
              key={key}
              className="relative"
              onMouseEnter={() => setOpenMenu(key)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-[hsl(210,20%,70%)] hover:text-white transition-colors rounded-lg hover:bg-white/5">
                {megaMenus[key].title}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openMenu === key ? "rotate-180" : ""}`} />
              </button>
              {openMenu === key && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[700px]">
                  <div className="bg-[hsl(222,47%,8%)] border border-[hsl(222,30%,18%)] rounded-xl p-6 shadow-2xl shadow-black/40 animate-fade-in">
                    <h3 className="text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">{megaMenus[key].title}</h3>
                    <div className={`grid grid-cols-2 ${megaMenus[key].cols} gap-2`}>
                      {megaMenus[key].items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setOpenMenu(null)}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                        >
                          <item.icon className="h-5 w-5 text-[hsl(190,80%,55%)] mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="text-sm font-medium text-white">{item.label}</div>
                            <div className="text-xs text-[hsl(210,20%,55%)]">{item.desc}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <Link to="/solutions" className="px-4 py-2 text-sm font-medium text-[hsl(210,20%,70%)] hover:text-white transition-colors rounded-lg hover:bg-white/5">Solutions</Link>
          <Link to="/resources" className="px-4 py-2 text-sm font-medium text-[hsl(210,20%,70%)] hover:text-white transition-colors rounded-lg hover:bg-white/5">Resources</Link>
          <Link to="/about" className="px-4 py-2 text-sm font-medium text-[hsl(210,20%,70%)] hover:text-white transition-colors rounded-lg hover:bg-white/5">Company</Link>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" className="text-[hsl(210,20%,70%)] hover:text-white hover:bg-white/5">Sign In</Button>
          </Link>
          <Link to="/contact">
            <Button className="bg-[hsl(190,80%,45%)] text-white font-semibold hover:bg-[hsl(190,80%,40%)] shadow-lg shadow-[hsl(190,80%,45%)]/20">
              Get a Quote
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="lg:hidden text-white p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[hsl(222,47%,8%)] border-t border-[hsl(222,30%,18%)] max-h-[80vh] overflow-y-auto animate-fade-in">
          <div className="p-4 space-y-4">
            {(["platform", "services", "industries"] as MenuKey[]).map((key) => (
              <div key={key}>
                <h4 className="text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-2">{megaMenus[key].title}</h4>
                <div className="grid grid-cols-2 gap-1">
                  {megaMenus[key].items.slice(0, 6).map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-white/5 text-sm text-[hsl(210,20%,80%)]"
                    >
                      <item.icon className="h-4 w-4 text-[hsl(190,80%,55%)]" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-[hsl(222,30%,18%)]">
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full border-[hsl(222,30%,18%)] text-white">Sign In</Button>
              </Link>
              <Link to="/contact" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-[hsl(190,80%,45%)] text-white font-semibold">Get a Quote</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default MegaMenuHeader;
