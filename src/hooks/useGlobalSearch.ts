import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SearchResult {
  type: "user" | "business" | "event" | "inquiry" | "lead" | "deal";
  id: string;
  title: string;
  subtitle: string;
}

export function useGlobalSearch() {
  const { isSuperAdmin } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);

    const allResults: SearchResult[] = [];

    // Search users
    const { data: users } = await supabase
      .from("profiles")
      .select("id, full_name, email")
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
    }

    // Search calendar events
    const { data: events } = await supabase
      .from("calendar_events")
      .select("id, title, start_datetime")
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

    setResults(allResults);
    setLoading(false);
  }, [isSuperAdmin]);

  const clear = () => setResults([]);

  return { results, loading, search, clear };
}
