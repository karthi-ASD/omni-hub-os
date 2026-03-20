export interface CRMLead {
  id: string;
  business_id: string;
  full_name: string;
  mobile: string | null;
  email: string | null;
  source: string | null;
  campaign_source: string | null;
  stage: string | null;
  lead_score: number | null;
  seriousness_score: number | null;
  lead_temperature: string | null;
  budget_range: string | null;
  property_interest_type: string | null;
  finance_readiness: string | null;
  investment_timeline: string | null;
  location_preference: string | null;
  smsf_interest: boolean | null;
  state: string | null;
  city: string | null;
  preferred_callback_time: string | null;
  assigned_advisor: string | null;
  assigned_employee_id: string | null;
  assigned_at: string | null;
  first_contact_at: string | null;
  last_contact_attempt: string | null;
  next_followup: string | null;
  contact_attempts: number | null;
  sla_breached: boolean | null;
  phone_verified: boolean | null;
  email_verified: boolean | null;
  whatsapp_sent: boolean | null;
  email_sent: boolean | null;
  qualification_status: string | null;
  invalid_reason: string | null;
  objection_type: string | null;
  objection_notes: string | null;
  referral_source_name: string | null;
  meta_lead_id: string | null;
  auto_scored: boolean | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadTab =
  | "all"
  | "new"
  | "hot"
  | "warm"
  | "cold"
  | "uncontacted"
  | "invalid"
  | "re_engagement"
  | "meta"
  | "referral";

export const LEAD_TABS: { key: LeadTab; label: string; color: string }[] = [
  { key: "all", label: "All Leads", color: "hsl(var(--foreground))" },
  { key: "new", label: "New Leads", color: "#3b82f6" },
  { key: "hot", label: "Hot Leads", color: "#ef4444" },
  { key: "warm", label: "Warm Leads", color: "#f97316" },
  { key: "cold", label: "Cold Leads", color: "#6b7280" },
  { key: "uncontacted", label: "Uncontacted", color: "#8b5cf6" },
  { key: "invalid", label: "Invalid", color: "#dc2626" },
  { key: "re_engagement", label: "Re-engagement", color: "#10b981" },
  { key: "meta", label: "Meta Leads", color: "#1877f2" },
  { key: "referral", label: "Referral", color: "#eab308" },
];

export function filterLeadsByTab(leads: CRMLead[], tab: LeadTab): CRMLead[] {
  switch (tab) {
    case "all": return leads;
    case "new": return leads.filter(l => l.stage === "new");
    case "hot": return leads.filter(l => l.lead_temperature === "hot");
    case "warm": return leads.filter(l => l.lead_temperature === "warm");
    case "cold": return leads.filter(l => l.lead_temperature === "cold" || !l.lead_temperature);
    case "uncontacted": return leads.filter(l => !l.first_contact_at && l.contact_attempts === 0);
    case "invalid": return leads.filter(l => l.stage === "invalid" || l.stage === "disqualified");
    case "re_engagement": return leads.filter(l => l.stage === "lost" || l.stage === "stale");
    case "meta": return leads.filter(l => l.source === "meta" || l.source === "facebook" || !!l.meta_lead_id);
    case "referral": return leads.filter(l => l.source === "referral");
    default: return leads;
  }
}

export function calculateLeadScore(lead: Partial<CRMLead>): { score: number; temperature: string } {
  let score = 0;

  // Budget (0-25)
  if (lead.budget_range) {
    const b = lead.budget_range.toLowerCase();
    if (b.includes("1m") || b.includes("1,000") || b.includes("million")) score += 25;
    else if (b.includes("800") || b.includes("900")) score += 20;
    else if (b.includes("500") || b.includes("600") || b.includes("700")) score += 15;
    else score += 10;
  }

  // Finance readiness (0-25)
  if (lead.finance_readiness === "pre-approved") score += 25;
  else if (lead.finance_readiness === "conditional") score += 15;
  else if (lead.finance_readiness === "unknown") score += 5;

  // Investment timeline (0-20)
  if (lead.investment_timeline) {
    const t = lead.investment_timeline.toLowerCase();
    if (t.includes("immediate") || t.includes("asap") || t.includes("1 month")) score += 20;
    else if (t.includes("3 month") || t.includes("quarter")) score += 15;
    else if (t.includes("6 month")) score += 10;
    else score += 5;
  }

  // Property interest (0-15)
  if (lead.property_interest_type === "off_market") score += 15;
  else if (lead.property_interest_type === "development") score += 12;
  else if (lead.property_interest_type === "commercial") score += 10;
  else if (lead.property_interest_type) score += 8;

  // SMSF (0-10)
  if (lead.smsf_interest) score += 10;

  // Contact info quality (0-5)
  if (lead.email) score += 2;
  if (lead.mobile) score += 3;

  const temperature = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";
  return { score, temperature };
}
