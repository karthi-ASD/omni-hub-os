import React from "react";

const SITE_URL = "https://nextweb.com.au";
const ORG_NAME = "NextWeb";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface FAQ {
  q: string;
  a: string;
}

/* ── Organization (homepage only) ── */
export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: ORG_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/nextweb-logo.png`,
  description:
    "NextWeb OS is an all-in-one platform for CRM, AI, websites, apps, SEO, payroll, and business operations — serving Australia with focus on Brisbane and Gold Coast.",
  foundingDate: "2010",
  sameAs: [
    "https://www.linkedin.com/company/nextweb-australia",
    "https://www.facebook.com/nextwebaustralia",
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Brisbane",
    addressRegion: "QLD",
    addressCountry: "AU",
  },
  areaServed: [
    { "@type": "City", name: "Brisbane" },
    { "@type": "City", name: "Gold Coast" },
    { "@type": "Country", name: "Australia" },
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+61-7-0000-0000",
    contactType: "sales",
    availableLanguage: "English",
  },
};

/* ── BreadcrumbList builder ── */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

/* ── FAQPage builder ── */
export function buildFaqJsonLd(faqs: FAQ[]) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/* ── Service schema builder ── */
export function buildServiceJsonLd(name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    provider: {
      "@type": "Organization",
      name: ORG_NAME,
      url: SITE_URL,
      areaServed: ["Brisbane", "Gold Coast", "Australia"],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Brisbane",
        addressRegion: "QLD",
        addressCountry: "AU",
      },
    },
  };
}

/* ── SoftwareApplication schema builder ── */
export function buildSoftwareAppJsonLd(name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `NextWeb ${name}`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    description,
    provider: {
      "@type": "Organization",
      name: ORG_NAME,
      url: SITE_URL,
      areaServed: ["Brisbane", "Gold Coast", "Australia"],
    },
  };
}

/* ── Renderer component ── */
export const JsonLdScript: React.FC<{ data: object | object[] }> = ({ data }) => {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
};
