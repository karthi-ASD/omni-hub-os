import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { platformPages } from "@/data/platform-pages";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight, CheckCircle2, HelpCircle } from "lucide-react";

const PlatformModulePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? platformPages[slug] : undefined;

  if (!page) return <Navigate to="/" replace />;

  usePageTitle(page.metaTitle, page.metaDescription);

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,6%)] via-[hsl(222,47%,10%)] to-[hsl(200,40%,10%)]" />
        <div className="absolute top-20 -left-20 w-[400px] h-[400px] bg-[hsl(190,80%,55%)]/8 rounded-full blur-[120px]" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <span className="inline-block text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">{page.heroAccent}</span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-3xl">{page.heroHeadline}</h1>
          <p className="text-lg md:text-xl text-[hsl(210,20%,65%)] max-w-2xl leading-relaxed mb-8">{page.heroSubheadline}</p>
          <div className="flex gap-4">
            <Link to="/demo"><Button className="bg-[hsl(190,80%,45%)] text-white font-semibold hover:bg-[hsl(190,80%,40%)]">Book a Demo <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link to="/contact"><Button variant="outline" className="border-[hsl(190,80%,55%)]/30 text-[hsl(190,80%,55%)]">Get a Quote</Button></Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-[hsl(222,30%,14%)] bg-[hsl(222,47%,6%)]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {page.stats.map((s) => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[hsl(190,80%,55%)] to-[hsl(252,85%,65%)] bg-clip-text text-transparent">{s.value}</div>
                <div className="text-[hsl(210,20%,55%)] text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 bg-[hsl(222,47%,8%)]">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Key Capabilities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {page.features.map((f) => (
              <div key={f.title} className="bg-[hsl(222,35%,11%)] border border-[hsl(222,30%,16%)] rounded-xl p-6 hover:border-[hsl(190,80%,55%)]/30 transition-all">
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-[hsl(210,20%,55%)] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 md:py-28 bg-[hsl(222,35%,11%)] border-y border-[hsl(222,30%,14%)]">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Why {page.title}?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {page.benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 p-4 rounded-lg bg-[hsl(222,47%,8%)] border border-[hsl(222,30%,16%)]">
                <CheckCircle2 className="h-5 w-5 text-[hsl(190,80%,55%)] mt-0.5 flex-shrink-0" />
                <span className="text-[hsl(210,20%,70%)] text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 md:py-28 bg-[hsl(222,47%,8%)]">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {page.faqs.map((faq) => (
              <details key={faq.q} className="group bg-[hsl(222,35%,11%)] border border-[hsl(222,30%,16%)] rounded-xl">
                <summary className="flex items-center justify-between p-5 cursor-pointer text-white font-medium text-sm list-none">
                  {faq.q}
                  <HelpCircle className="h-4 w-4 text-[hsl(190,80%,55%)] flex-shrink-0 ml-4" />
                </summary>
                <div className="px-5 pb-5 text-[hsl(210,20%,60%)] text-sm leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-16 bg-[hsl(222,35%,11%)] border-t border-[hsl(222,30%,14%)]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-sm font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">Related Services</h3>
              <div className="space-y-2">
                {page.relatedServices.map((l) => (
                  <Link key={l.to} to={l.to} className="flex items-center gap-2 text-[hsl(210,20%,70%)] hover:text-white text-sm transition-colors">
                    <ChevronRight className="h-3 w-3" /> {l.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">Industries We Serve</h3>
              <div className="space-y-2">
                {page.relatedIndustries.map((l) => (
                  <Link key={l.to} to={l.to} className="flex items-center gap-2 text-[hsl(210,20%,70%)] hover:text-white text-sm transition-colors">
                    <ChevronRight className="h-3 w-3" /> {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-[hsl(190,80%,55%)]/10 to-[hsl(252,85%,60%)]/8">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started with {page.title}?</h2>
          <p className="text-[hsl(210,20%,60%)] mb-8 max-w-xl mx-auto">Talk to our Brisbane or Gold Coast team for a free strategy session.</p>
          <Link to="/contact"><Button size="lg" className="bg-[hsl(190,80%,45%)] text-white font-bold hover:bg-[hsl(190,80%,40%)]">Get a Free Quote <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </>
  );
};

export default PlatformModulePage;
