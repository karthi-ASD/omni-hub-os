import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  module: string;
  created_at: string;
}

export function useAccountTimeline(clientId?: string) {
  const { profile } = useAuth();
  const bizId = profile?.business_id;
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!bizId || !clientId) { setEvents([]); setLoading(false); return; }
    setLoading(true);

    const timeline: TimelineEvent[] = [];

    // Batch 1
    const q = (table: string, cols: string, extraFilter?: { col: string; val: string }) => {
      let query = (supabase.from(table as any) as any).select(cols).eq("business_id", bizId);
      if (extraFilter) query = query.eq(extraFilter.col, extraFilter.val);
      return query;
    };

    const cf = { col: "client_id", val: clientId };
    const ef = { col: "entity_id", val: clientId };

    const [dealsR, proposalsR, contractsR, invoicesR] = await Promise.all([
      q("deals", "id, title, status, created_at", cf),
      q("proposals", "id, title, status, created_at", cf),
      q("contracts", "id, title, status, created_at", cf),
      q("invoices", "id, invoice_number, status, total_amount, created_at", cf),
    ]);

    const [paymentsR, ticketsR, projectsR, remindersR] = await Promise.all([
      q("payments", "id, amount, status, created_at", cf),
      q("support_tickets", "id, subject, status, priority, created_at"),
      q("projects", "id, project_name, status, created_at", cf),
      q("reminders", "id, title, status, created_at", ef),
    ]);

    const [seoTasksR, sysR] = await Promise.all([
      q("seo_tasks", "id, task_title, status, created_at", cf),
      (supabase.from("system_events") as any).select("id, event_type, payload_json, created_at").eq("business_id", bizId).order("created_at", { ascending: false }).limit(200),
    ]);

    (dealsR.data ?? []).forEach((d: any) => timeline.push({
      id: `deal-${d.id}`, type: "deal", title: `Deal: ${d.title}`,
      description: `Status: ${d.status}`, module: "Sales", created_at: d.created_at,
    }));

    (proposalsR.data ?? []).forEach((p: any) => timeline.push({
      id: `prop-${p.id}`, type: "proposal", title: `Proposal: ${p.title}`,
      description: `Status: ${p.status}`, module: "Sales", created_at: p.created_at,
    }));

    (contractsR.data ?? []).forEach((c: any) => timeline.push({
      id: `contract-${c.id}`, type: "contract", title: `Contract: ${c.title}`,
      description: `Status: ${c.status}`, module: "Legal", created_at: c.created_at,
    }));

    (invoicesR.data ?? []).forEach((i: any) => timeline.push({
      id: `inv-${i.id}`, type: "invoice", title: `Invoice #${i.invoice_number}`,
      description: `$${i.total_amount} — ${i.status}`, module: "Billing", created_at: i.created_at,
    }));

    (paymentsR.data ?? []).forEach((p: any) => timeline.push({
      id: `pay-${p.id}`, type: "payment", title: `Payment: $${p.amount}`,
      description: `Status: ${p.status}`, module: "Billing", created_at: p.created_at,
    }));

    (ticketsR.data ?? []).forEach((t: any) => timeline.push({
      id: `ticket-${t.id}`, type: "ticket", title: `Ticket: ${t.subject}`,
      description: `${t.priority} — ${t.status}`, module: "Support", created_at: t.created_at,
    }));

    (projectsR.data ?? []).forEach((p: any) => timeline.push({
      id: `proj-${p.id}`, type: "project", title: `Project: ${p.project_name}`,
      description: `Status: ${p.status}`, module: "Delivery", created_at: p.created_at,
    }));

    (remindersR.data ?? []).forEach((r: any) => timeline.push({
      id: `rem-${r.id}`, type: "reminder", title: `Reminder: ${r.title}`,
      description: `Status: ${r.status}`, module: "Follow-up", created_at: r.created_at,
    }));

    (seoTasksR.data ?? []).forEach((s: any) => timeline.push({
      id: `seo-${s.id}`, type: "seo_task", title: `SEO: ${s.task_title}`,
      description: `Status: ${s.status}`, module: "SEO", created_at: s.created_at,
    }));

    (sysR.data ?? []).filter((s: any) =>
      (s.payload_json as any)?.entity_id === clientId
    ).forEach((s: any) => timeline.push({
      id: `sys-${s.id}`, type: "system", title: s.event_type.replace(/_/g, " "),
      description: (s.payload_json as any)?.short_message || "",
      module: "System", created_at: s.created_at,
    }));

    timeline.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setEvents(timeline);
    setLoading(false);
  }, [bizId, clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { events, loading, refresh: fetch };
}
