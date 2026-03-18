import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Target, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface Props {
  clientId: string;
}

interface CapturedLead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  source: string;
  page_url: string | null;
  status: string | null;
  created_at: string | null;
}

const PAGE_SIZE = 20;

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600",
  contacted: "bg-amber-500/10 text-amber-600",
  converted: "bg-green-500/10 text-green-600",
  lost: "bg-red-500/10 text-red-600",
};

export const ClientLeadsTab = ({ clientId }: Props) => {
  const [leads, setLeads] = useState<CapturedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("seo_captured_leads")
      .select("*", { count: "exact" })
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, count } = await query;
    setLeads((data as any) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [clientId, page, statusFilter, search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateStatus = async (leadId: string, newStatus: string) => {
    await supabase.from("seo_captured_leads").update({ status: newStatus } as any).eq("id", leadId);
    fetchLeads();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Leads", value: total },
          { label: "New", value: leads.filter(l => l.status === "new").length },
          { label: "Contacted", value: leads.filter(l => l.status === "contacted").length },
          { label: "Converted", value: leads.filter(l => l.status === "converted").length },
        ].map(s => (
          <Card key={s.label} className="rounded-xl">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Input
          placeholder="Search name, email, phone..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          className="max-w-xs h-9"
        />
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" /> Website Leads ({total})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : leads.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No leads captured yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium text-sm">{lead.name || "—"}</TableCell>
                      <TableCell className="text-sm">{lead.phone || "—"}</TableCell>
                      <TableCell className="text-sm">{lead.email || "—"}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{lead.message || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{lead.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.status || "new"}
                          onValueChange={v => updateStatus(lead.id, v)}
                        >
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {lead.created_at ? format(new Date(lead.created_at), "dd MMM yyyy") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
