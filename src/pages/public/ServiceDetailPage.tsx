import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { servicePages } from "@/data/service-pages";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight, HelpCircle, Star, MapPin, CheckCircle2 } from "lucide-react";
import { JsonLdScript, buildServiceJsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/components/public/JsonLd";

const ServiceDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? servicePages[slug] : undefined;

  if (!page) return <Navigate to="/" replace />;

  usePageTitle(page.metaTitle, page.metaDescription);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.title,
    description: page.metaDescription,
    provider: {
      "@type": "Organization",
      name: "NextWeb",
      url: "https://nextweb.com.au",
      areaServed: ["Brisbane", "Gold Coast", "Australia"],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Brisbane",
        addressRegion: "QLD",
        addressCountry: "AU",
      },
    },
    ...(page.faqs.length > 0 && {
      mainEntity: page.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    }),
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,6%)] via-[hsl(222,47%,10%)] to-[hsl(200,40%,10%)]" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-[hsl(252,85%,60%)]/6 rounded-full blur-[140px]" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <span className="inline-block text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">{page.heroAccent}</span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-3xl">{page.heroHeadline}</h1>
          <p className="text-lg md:text-xl text-[hsl(210,20%,65%)] max-w-2xl leading-relaxed mb-8">{page.heroSubheadline}</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/contact"><Button className="bg-[hsl(190,80%,45%)] text-white font-semibold hover:bg-[hsl(190,80%,40%)]">Get a Quote <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link to="/demo"><Button variant="outline" className="border-[hsl(190,80%,55%)]/30 text-[hsl(190,80%,55%)]">Book a Demo</Button></Link>
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

      {/* Offerings */}
      <section className="py-20 md:py-28 bg-[hsl(222,47%,8%)]">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">What We Deliver</h2>
          <p className="text-[hsl(210,20%,55%)] text-center mb-12 max-w-2xl mx-auto">Comprehensive {page.title.toLowerCase()} tailored for Brisbane, Gold Coast, and Australian businesses.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {page.offerings.map((o) => (
              <div key={o.title} className="bg-[hsl(222,35%,11%)] border border-[hsl(222,30%,16%)] rounded-xl p-6 hover:border-[hsl(190,80%,55%)]/30 transition-all group">
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[hsl(190,80%,55%)] transition-colors">{o.title}</h3>
                <p className="text-[hsl(210,20%,55%)] text-sm leading-relaxed">{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      {page.whyChooseUs && page.whyChooseUs.length > 0 && (
        <section className="py-20 md:py-28 bg-[hsl(222,35%,11%)] border-y border-[hsl(222,30%,14%)]">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Why Choose NextWeb</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {page.whyChooseUs.map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-5 rounded-xl bg-[hsl(222,47%,8%)] border border-[hsl(222,30%,16%)]">
                  <CheckCircle2 className="h-5 w-5 text-[hsl(190,80%,55%)] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-[hsl(210,20%,55%)] text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Case Studies */}
      {page.caseStudies && page.caseStudies.length > 0 && (
        <section className="py-20 md:py-28 bg-[hsl(222,47%,8%)]">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Client Success Stories</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {page.caseStudies.map((cs) => (
                <div key={cs.title} className="bg-[hsl(222,35%,11%)] border border-[hsl(222,30%,16%)] rounded-xl p-6 hover:border-[hsl(190,80%,55%)]/30 transition-all">
                  <span className="text-xs font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest">{cs.industry}</span>
                  <h3 className="text-lg font-semibold text-white mt-2 mb-2">{cs.title}</h3>
                  <p className="text-[hsl(210,20%,55%)] text-sm leading-relaxed mb-4">{cs.desc}</p>
                  <div className="text-sm font-bold bg-gradient-to-r from-[hsl(190,80%,55%)] to-[hsl(252,85%,65%)] bg-clip-text text-transparent">{cs.result}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Process */}
      <section className="py-20 md:py-28 bg-[hsl(222,35%,11%)] border-y border-[hsl(222,30%,14%)]">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Our Process</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {page.process.map((p, i) => (
              <div key={p.step} className="flex items-start gap-4 p-5 rounded-xl bg-[hsl(222,47%,8%)] border border-[hsl(222,30%,16%)]">
                <div className="h-10 w-10 rounded-lg bg-[hsl(190,80%,55%)]/10 flex items-center justify-center flex-shrink-0 text-[hsl(190,80%,55%)] font-bold">{i + 1}</div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{p.step}</h3>
                  <p className="text-[hsl(210,20%,55%)] text-sm leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {page.testimonials && page.testimonials.length > 0 && (
        <section className="py-20 md:py-28 bg-[hsl(222,47%,8%)]">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">What Our Clients Say</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {page.testimonials.map((t, i) => (
                <div key={i} className="bg-[hsl(222,35%,11%)] border border-[hsl(222,30%,16%)] rounded-xl p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-[hsl(45,100%,55%)] text-[hsl(45,100%,55%)]" />
                    ))}
                  </div>
                  <p className="text-[hsl(210,20%,70%)] text-sm leading-relaxed italic mb-4">"{t.quote}"</p>
                  <div>
                    <div className="text-white text-sm font-semibold">{t.name}</div>
                    <div className="text-[hsl(210,20%,50%)] text-xs">{t.role}, {t.company}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tech Stack */}
      {page.techStack && page.techStack.length > 0 && (
        <section className="py-16 bg-[hsl(222,35%,11%)] border-y border-[hsl(222,30%,14%)]">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <h2 className="text-2xl font-bold mb-8">Technologies We Use</h2>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {page.techStack.map((tech) => (
                <span key={tech} className="px-4 py-2 bg-[hsl(222,47%,8%)] border border-[hsl(222,30%,18%)] rounded-full text-sm text-[hsl(210,20%,70%)]">{tech}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Local SEO Content */}
      {page.localSEO && (
        <section className="py-20 md:py-28 bg-[hsl(222,47%,8%)]">
          <div className="container mx-auto px-4 md:px-8 max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="h-5 w-5 text-[hsl(190,80%,55%)]" />
              <h2 className="text-2xl md:text-3xl font-bold">{page.localSEO.heading}</h2>
            </div>
            {page.localSEO.paragraphs.map((p, i) => (
              <p key={i} className="text-[hsl(210,20%,60%)] leading-relaxed mb-4">{p}</p>
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      <section className="py-20 md:py-28 bg-[hsl(222,35%,11%)] border-t border-[hsl(222,30%,14%)]">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {page.faqs.map((faq) => (
              <details key={faq.q} className="group bg-[hsl(222,47%,8%)] border border-[hsl(222,30%,16%)] rounded-xl">
                <summary className="flex items-center justify-between p-5 cursor-pointer text-white font-medium text-sm list-none">{faq.q}<HelpCircle className="h-4 w-4 text-[hsl(190,80%,55%)] flex-shrink-0 ml-4" /></summary>
                <div className="px-5 pb-5 text-[hsl(210,20%,60%)] text-sm leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-16 bg-[hsl(222,47%,8%)] border-t border-[hsl(222,30%,14%)]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-sm font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">Related Platform Modules</h3>
              <div className="space-y-2">{page.relatedPlatform.map((l) => (<Link key={l.to} to={l.to} className="flex items-center gap-2 text-[hsl(210,20%,70%)] hover:text-white text-sm transition-colors"><ChevronRight className="h-3 w-3" /> {l.label}</Link>))}</div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[hsl(190,80%,55%)] uppercase tracking-widest mb-4">Industries We Serve</h3>
              <div className="space-y-2">{page.relatedIndustries.map((l) => (<Link key={l.to} to={l.to} className="flex items-center gap-2 text-[hsl(210,20%,70%)] hover:text-white text-sm transition-colors"><ChevronRight className="h-3 w-3" /> {l.label}</Link>))}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-[hsl(190,80%,55%)]/10 to-[hsl(252,85%,60%)]/8">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Discuss {page.title}?</h2>
          <p className="text-[hsl(210,20%,60%)] mb-8 max-w-xl mx-auto">Talk to our Brisbane or Gold Coast team for a free consultation and tailored proposal.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/contact"><Button size="lg" className="bg-[hsl(190,80%,45%)] text-white font-bold hover:bg-[hsl(190,80%,40%)]">Get a Free Quote <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link to="/demo"><Button size="lg" variant="outline" className="border-[hsl(190,80%,55%)]/30 text-[hsl(190,80%,55%)]">Schedule a Demo</Button></Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default ServiceDetailPage;
