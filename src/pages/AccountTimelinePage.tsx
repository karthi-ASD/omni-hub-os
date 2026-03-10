import { useState } from "react";
import { useAccountTimeline } from "@/hooks/useAccountTimeline";
import { useClients } from "@/hooks/useClients";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Briefcase, FileText, Receipt, DollarSign, Ticket, ListChecks,
  Clock, Globe, Shield, Users, FolderKanban, Scale, MessageSquare, Zap,
} from "lucide-react";

const TYPE_ICONS: Record<string, any> = {
  deal: FolderKanban, proposal: FileText, contract: Scale, invoice: Receipt,
  payment: DollarSign, ticket: Ticket, project: Briefcase, task: ListChecks,
  reminder: Clock, seo_task: Globe, system: Shield, DEFAULT: Zap,
};

const MODULE_COLORS: Record<string, string> = {
  Sales: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  Legal: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  Billing: "bg-green-500/10 text-green-700 dark:text-green-300",
  Support: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  Delivery: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  Operations: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  "Follow-up": "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  SEO: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  System: "bg-muted text-muted-foreground",
};

const AccountTimelinePage = () => {
  const { clients } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const { events, loading } = useAccountTimeline(selectedClientId || undefined);

  const filtered = events.filter(e => {
    if (moduleFilter !== "all" && e.module !== moduleFilter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const modules = [...new Set(events.map(e => e.module))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account Timeline</h1>
        <p className="text-muted-foreground">Unified client history — calls, deals, tasks, tickets, invoices, and more</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Select a client…" />
          </SelectTrigger>
          <SelectContent>
            {clients.map(c => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  {c.company_name || c.contact_name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedClientId && (
          <>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search timeline…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </>
        )}
      </div>

      {/* Timeline */}
      {!selectedClientId ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">Select a client to view their full account timeline</p>
            <p className="text-sm mt-1">Every deal, task, ticket, invoice, and interaction in one place</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No events found for this client.
          </CardContent>
        </Card>
      ) : (
        <div className="relative border-l-2 border-muted ml-4 space-y-4">
          {filtered.map(e => {
            const Icon = TYPE_ICONS[e.type] || TYPE_ICONS.DEFAULT;
            const colorClass = MODULE_COLORS[e.module] || MODULE_COLORS.System;
            return (
              <div key={e.id} className="relative pl-8">
                <div className="absolute -left-[13px] top-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{e.title}</p>
                    {e.description && <p className="text-xs text-muted-foreground mt-0.5">{e.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${colorClass}`}>{e.module}</Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary stats */}
      {selectedClientId && events.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {modules.map(mod => (
            <Card key={mod}>
              <CardContent className="py-3 px-4 text-center">
                <p className="text-2xl font-bold">{events.filter(e => e.module === mod).length}</p>
                <p className="text-xs text-muted-foreground">{mod}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountTimelinePage;
