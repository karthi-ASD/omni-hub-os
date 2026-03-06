import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User, Building2, Mail, Phone, Globe, Calendar, Receipt,
  MessageSquare, Star, Clock, Tag, FileText,
} from "lucide-react";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string | null;
  companyAccountId?: string | null;
}

export function CustomerProfile360Sheet({ open, onOpenChange, clientId, companyAccountId }: Props) {
  const { profile } = useAuth();
  const [client, setClient] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !profile?.business_id) return;
    const fetch = async () => {
      setLoading(true);
      if (clientId) {
        const { data } = await supabase.from("clients").select("*").eq("id", clientId).single();
        setClient(data);
        // Tickets by client email
        if (data?.email) {
          const { data: t } = await supabase.from("support_tickets")
            .select("*").eq("business_id", profile.business_id)
            .order("created_at", { ascending: false }).limit(20);
          setTickets(t || []);
        }
        // Invoices
        const { data: inv } = await supabase.from("invoices")
          .select("*").eq("client_id", clientId)
          .order("created_at", { ascending: false }).limit(10);
        setInvoices(inv || []);
      }
      if (companyAccountId) {
        const { data } = await supabase.from("company_accounts")
          .select("*").eq("id", companyAccountId).single();
        setClient(data);
      }
      // Conversations
      const { data: conv } = await supabase.from("conversation_threads")
        .select("*").eq("business_id", profile.business_id)
        .order("last_message_at", { ascending: false }).limit(10);
      setConversations(conv || []);
      setLoading(false);
    };
    fetch();
  }, [open, clientId, companyAccountId, profile?.business_id]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Customer 360°
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          {loading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !client ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No customer data</div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Profile Header */}
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{client.name || client.company_name || "—"}</p>
                    {client.industry && <p className="text-xs text-muted-foreground">{client.industry}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {client.email && (
                    <div className="flex items-center gap-2"><Mail className="h-3 w-3 text-muted-foreground" /><span className="text-foreground">{client.email}</span></div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2"><Phone className="h-3 w-3 text-muted-foreground" /><span className="text-foreground">{client.phone}</span></div>
                  )}
                  {client.website && (
                    <div className="flex items-center gap-2"><Globe className="h-3 w-3 text-muted-foreground" /><span className="text-foreground">{client.website}</span></div>
                  )}
                  {client.plan && (
                    <div className="flex items-center gap-2"><Tag className="h-3 w-3 text-muted-foreground" /><span className="text-foreground">Plan: {client.plan}</span></div>
                  )}
                  {client.health_status && (
                    <Badge variant="outline" className="w-fit text-[10px] capitalize">{client.health_status?.replace("_", " ")}</Badge>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="tickets" className="w-full">
                <TabsList className="w-full grid grid-cols-4 h-8">
                  <TabsTrigger value="tickets" className="text-[10px]">Tickets</TabsTrigger>
                  <TabsTrigger value="invoices" className="text-[10px]">Invoices</TabsTrigger>
                  <TabsTrigger value="comms" className="text-[10px]">Comms</TabsTrigger>
                  <TabsTrigger value="history" className="text-[10px]">History</TabsTrigger>
                </TabsList>

                <TabsContent value="tickets" className="mt-3 space-y-2">
                  {tickets.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No tickets</p>
                  ) : tickets.map(t => (
                    <div key={t.id} className="border border-border rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground">{t.ticket_number}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{t.status}</Badge>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{t.priority}</Badge>
                      </div>
                      <p className="text-xs font-medium text-foreground truncate">{t.subject}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(t.created_at), "MMM d, yyyy")}</p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="invoices" className="mt-3 space-y-2">
                  {invoices.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No invoices</p>
                  ) : invoices.map(inv => (
                    <div key={inv.id} className="border border-border rounded-lg p-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-foreground">{inv.invoice_number}</p>
                        <p className="text-[10px] text-muted-foreground">{format(new Date(inv.created_at), "MMM d, yyyy")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-foreground">${inv.total_amount?.toLocaleString()}</p>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{inv.status}</Badge>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="comms" className="mt-3 space-y-2">
                  {conversations.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No conversations</p>
                  ) : conversations.slice(0, 5).map(c => (
                    <div key={c.id} className="border border-border rounded-lg p-2.5">
                      <p className="text-xs font-medium text-foreground truncate">{c.subject || "No subject"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{c.thread_type}</Badge>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{c.status}</Badge>
                        {c.last_message_at && <span className="text-[10px] text-muted-foreground">{format(new Date(c.last_message_at), "MMM d")}</span>}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="history" className="mt-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs border-l-2 border-primary pl-3 py-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Created:</span>
                      <span className="text-foreground">{client.created_at ? format(new Date(client.created_at), "MMM d, yyyy") : "—"}</span>
                    </div>
                    {client.renewal_date && (
                      <div className="flex items-center gap-2 text-xs border-l-2 border-warning pl-3 py-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Renewal:</span>
                        <span className="text-foreground">{format(new Date(client.renewal_date), "MMM d, yyyy")}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs border-l-2 border-success pl-3 py-1">
                      <Star className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Satisfaction:</span>
                      <span className="text-foreground">{client.satisfaction_rating || client.health_score || "—"}</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
