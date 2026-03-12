import React from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Generic placeholder for public pages that haven't been fully built yet.
 * Extracts a human-readable title from the URL path.
 */
const PublicPlaceholderPage: React.FC = () => {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const title = segments
    .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" — ");

  usePageTitle(title || "Page", `Learn about ${title} at NextWeb — Australia's all-in-one business operating system.`);

  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-8 text-center">
        <span className="inline-block text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">
          {segments[0]?.replace(/-/g, " ") || "Page"}
        </span>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">{title}</h1>
        <p className="text-[hsl(210,20%,60%)] max-w-2xl mx-auto text-lg mb-10">
          This page is being crafted by the NextWeb team. Full content coming soon — including SEO-optimized copy,
          FAQs, case studies, and CTAs tailored for Brisbane and Gold Coast businesses.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/">
            <Button variant="outline" className="border-[hsl(190,80%,55%)]/30 text-[hsl(190,80%,55%)]">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back Home
            </Button>
          </Link>
          <Link to="/contact">
            <Button className="bg-[hsl(190,80%,45%)] text-white font-semibold hover:bg-[hsl(190,80%,40%)]">
              Get a Quote <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PublicPlaceholderPage;
