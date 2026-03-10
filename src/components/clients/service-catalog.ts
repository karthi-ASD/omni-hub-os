export const SERVICE_CATEGORIES = [
  {
    group: "Website Development",
    services: [
      "Website Development",
      "Website Redesign",
      "WordPress Website",
      "Ecommerce Website",
      "Landing Page Website",
      "Custom Website",
      "Website Maintenance",
    ],
  },
  {
    group: "SEO Services",
    services: [
      "SEO Services",
      "Local SEO",
      "Technical SEO",
      "Ecommerce SEO",
      "SEO Audit",
      "Monthly SEO Package",
    ],
  },
  {
    group: "Advertising & Marketing",
    services: [
      "Google Ads / PPC",
      "Facebook Ads",
      "Social Media Marketing",
    ],
  },
  {
    group: "Mobile App Development",
    services: [
      "Mobile App Development",
      "Android App",
      "iOS App",
      "Hybrid App",
    ],
  },
  {
    group: "Software & CRM",
    services: [
      "CRM Development",
      "Custom Software Development",
    ],
  },
  {
    group: "Hosting & Support",
    services: [
      "Hosting",
      "Domain Management",
      "Website Support",
    ],
  },
] as const;

export const ALL_SERVICES = SERVICE_CATEGORIES.flatMap((c) => c.services);

export const WEBSITE_TYPES = ["WordPress", "Shopify", "Custom Development", "Ecommerce", "Landing Page"] as const;
export const SEO_PACKAGES = ["Local SEO", "National SEO", "Ecommerce SEO"] as const;
export const APP_TYPES = ["Android App", "iOS App", "Hybrid App"] as const;

/** Maps a service type to the department it should be assigned to */
export function getDepartmentForService(serviceType: string): string {
  const s = serviceType.toLowerCase();
  if (s.includes("seo") || s.includes("audit")) return "SEO";
  if (s.includes("website") || s.includes("wordpress") || s.includes("ecommerce") || s.includes("landing") || s.includes("redesign") || s.includes("maintenance")) return "Web Development";
  if (s.includes("app") || s.includes("android") || s.includes("ios") || s.includes("hybrid")) return "Mobile Development";
  if (s.includes("crm") || s.includes("software")) return "Software Development";
  if (s.includes("ads") || s.includes("ppc") || s.includes("social media") || s.includes("facebook")) return "Marketing";
  if (s.includes("hosting") || s.includes("domain") || s.includes("support")) return "Support";
  return "General";
}

export function hasWebsiteService(services: string[]): boolean {
  return services.some((s) => {
    const l = s.toLowerCase();
    return l.includes("website") || l.includes("wordpress") || l.includes("ecommerce") || l.includes("landing") || l.includes("redesign");
  });
}

export function hasSeoService(services: string[]): boolean {
  return services.some((s) => s.toLowerCase().includes("seo") || s.toLowerCase().includes("audit"));
}

export function hasAppService(services: string[]): boolean {
  return services.some((s) => {
    const l = s.toLowerCase();
    return l.includes("app") || l.includes("android") || l.includes("ios") || l.includes("hybrid");
  });
}
