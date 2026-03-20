import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SearchResult {
  type: "user" | "business" | "event" | "inquiry" | "lead" | "deal" | "invoice" | "request";
  id: string;
  title: string;
  subtitle: string;
}

export function useGlobalSearch() {
  const { isSuperAdmin, profile } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2 || !profile?.business_id) {
      setResults([]);
      return;
    }
    setLoading(true);
    const bid = profile.business_id;

    const allResults: SearchResult[] = [];

    // Search users (within same business)
    const { data: users } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("business_id", bid)
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(5);

    users?.forEach((u) =>
      allResults.push({
        type: "user",
        id: u.id,
        title: u.full_name,
        subtitle: u.email,
      })
    );

    // Search businesses (super admin only)
    if (isSuperAdmin) {
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id, name, status")
        .ilike("name", `%${query}%`)
        .limit(5);

      businesses?.forEach((b) =>
        allResults.push({
          type: "business",
          id: b.id,
          title: b.name,
          subtitle: b.status,
        })
      );

      // Search service requests (super admin)
      const { data: requests } = await supabase
        .from("nextweb_service_requests" as any)
        .select("id, title, status, business_id")
        .ilike("title", `%${query}%`)
        .limit(5);

      requests?.forEach((r: any) =>
        allResults.push({
          type: "request",
          id: r.id,
          title: r.title,
          subtitle: `Request · ${r.status}`,
        })
      );
    }

    // Search calendar events
    const { data: events } = await supabase
      .from("calendar_events")
      .select("id, title, start_datetime")
      .eq("business_id", bid)
      .ilike("title", `%${query}%`)
      .limit(5);

    events?.forEach((e) =>
      allResults.push({
        type: "event",
        id: e.id,
        title: e.title,
        subtitle: new Date(e.start_datetime).toLocaleDateString(),
      })
    );

    // Search inquiries
    const { data: inquiries } = await supabase
      .from("inquiries")
      .select("id, name, email, status")
      .eq("business_id", bid)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(5);

    inquiries?.forEach((i) =>
      allResults.push({
        type: "inquiry",
        id: i.id,
        title: i.name,
        subtitle: `${i.status} · ${i.email}`,
      })
    );

    // Search leads
    const { data: leads } = await supabase
      .from("leads")
      .select("id, name, email, stage")
      .eq("business_id", bid)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,business_name.ilike.%${query}%`)
      .limit(5);

    leads?.forEach((l) =>
      allResults.push({
        type: "lead",
        id: l.id,
        title: l.name,
        subtitle: `${l.stage} · ${l.email}`,
      })
    );

    // Search deals
    const { data: deals2 } = await supabase
      .from("deals")
      .select("id, deal_name, contact_name, stage")
      .eq("business_id", bid)
      .or(`deal_name.ilike.%${query}%,contact_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(5);

    deals2?.forEach((d: any) =>
      allResults.push({
        type: "deal",
        id: d.id,
        title: d.deal_name,
        subtitle: `${d.stage} · ${d.contact_name}`,
      })
    );

    // Search proposals
    const { data: proposals2 } = await supabase
      .from("proposals")
      .select("id, title, status")
      .eq("business_id", bid)
      .ilike("title", `%${query}%`)
      .limit(5);

    proposals2?.forEach((p: any) =>
      allResults.push({
        type: "deal" as any,
        id: p.id,
        title: p.title,
        subtitle: `Proposal · ${p.status}`,
      })
    );

    // Search clients
    const { data: clients2 } = await supabase
      .from("clients")
      .select("id, contact_name, email, company_name")
      .eq("business_id", bid)
      .or(`contact_name.ilike.%${query}%,email.ilike.%${query}%,company_name.ilike.%${query}%`)
      .limit(5);

    clients2?.forEach((c: any) =>
      allResults.push({
        type: "user" as any,
        id: c.id,
        title: c.contact_name,
        subtitle: `Client · ${c.email}`,
      })
    );

    // Search projects
    const { data: projects2 } = await supabase
      .from("projects")
      .select("id, project_name, status")
      .eq("business_id", bid)
      .ilike("project_name", `%${query}%`)
      .limit(5);

    projects2?.forEach((p: any) =>
      allResults.push({
        type: "event" as any,
        id: p.id,
        title: p.project_name,
        subtitle: `Project · ${p.status}`,
      })
    );

    // Search invoices
    const { data: invoices2 } = await supabase
      .from("invoices")
      .select("id, invoice_number, status, total, currency")
      .eq("business_id", bid)
      .limit(5);

    invoices2?.forEach((inv: any) =>
      allResults.push({
        type: "invoice",
        id: inv.id,
        title: `INV-${inv.invoice_number}`,
        subtitle: `${inv.status} · $${Number(inv.total).toFixed(2)} ${inv.currency}`,
      })
    );

    setResults(allResults);
    setLoading(false);
  }, [isSuperAdmin, profile?.business_id]);

  const clear = () => setResults([]);

  return { results, loading, search, clear };
}
