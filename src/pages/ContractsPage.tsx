import { useState } from "react";
import { useContracts, Contract } from "@/hooks/useContracts";
import { useClients } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";
import { useDeals } from "@/hooks/useDeals";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { FileSignature, Send, CheckCircle, FileText, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  signed: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  rejected: "bg-destructive/10 text-destructive",
};

const ContractsPage = () => {
  const { contracts, loading, sendContract, markSigned } = useContracts();
  const { createClient } = useClients();
  const { createProject } = useProjects();
  const { deals, markWon } = useDeals();
  const { profile } = useAuth();
  const [detailOpen, setDetailOpen] = useState<Contract | null>(null);

  const handleSign = async (contract: Contract) => {
    await markSigned(contract.id, contract.deal_id);
    await markWon(contract.deal_id);
    const deal = deals.find(d => d.id === contract.deal_id);
    if (deal) {
      const client = await createClient({
        deal_id: deal.id,
        company_name: deal.business_name || undefined,
        contact_name: deal.contact_name,
        email: deal.email,
        phone: deal.phone || undefined,
      });
      if (client) {
        await createProject({
          client_id: client.id,
          deal_id: deal.id,
          project_name: deal.deal_name,
          description: deal.service_interest || undefined,
          createOnboardingTasks: true,
        });
      }
    }
    setDetailOpen(null);
  };

  const stats = {
    draft: contracts.filter(c => c.status === "draft").length,
    sent: contracts.filter(c => c.status === "sent").length,
    signed: contracts.filter(c => c.status === "signed").length,
    rejected: contracts.filter(c => c.status === "rejected").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader icon={FileSignature} title="Contracts" subtitle="Manage contracts and signatures" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Draft" value={stats.draft} icon={FileText} gradient="from-muted to-muted" />
        <StatCard title="Sent" value={stats.sent} icon={Send} gradient="from-primary/80 to-accent/80" />
        <StatCard title="Signed" value={stats.signed} icon={CheckCircle} gradient="from-[hsl(var(--success))] to-[hsl(var(--neon-green))]" />
        <StatCard title="Rejected" value={stats.rejected} icon={XCircle} gradient="from-destructive to-destructive/70" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : contracts.length === 0 ? (
        <Card className="rounded-2xl"><CardContent className="py-12 text-center text-muted-foreground">No contracts yet. Generate one from an accepted proposal.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {contracts.map(c => (
            <Card key={c.id} className="rounded-2xl hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailOpen(c)}>
              <CardContent className="flex items-center gap-4 py-3 px-4">
                <div className="p-2 rounded-xl bg-primary/10">
                  <FileSignature className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Contract #{c.contract_number}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(c.created_at), "MMM d, yyyy")}</p>
                </div>
                <Badge className={statusColors[c.status]}>{c.status}</Badge>
                <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  {c.status === "draft" && <Button variant="ghost" size="sm" onClick={() => sendContract(c.id)}><Send className="h-4 w-4" /></Button>}
                  {c.status === "sent" && <Button variant="ghost" size="sm" onClick={() => handleSign(c)}><CheckCircle className="h-4 w-4 text-primary" /></Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!detailOpen} onOpenChange={() => setDetailOpen(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Contract #{detailOpen?.contract_number}</DialogTitle></DialogHeader>
          {detailOpen && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={statusColors[detailOpen.status]}>{detailOpen.status}</Badge></div>
              {detailOpen.signed_at && <div className="flex justify-between"><span className="text-muted-foreground">Signed</span><span>{format(new Date(detailOpen.signed_at), "MMM d, yyyy HH:mm")}</span></div>}
              {detailOpen.contract_content && (
                <div className="border rounded-xl p-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: detailOpen.contract_content }} />
              )}
            </div>
          )}
          <DialogFooter>
            {detailOpen?.status === "draft" && <Button onClick={() => { sendContract(detailOpen.id); setDetailOpen(null); }}>Send for Signing</Button>}
            {detailOpen?.status === "sent" && <Button onClick={() => handleSign(detailOpen)}>Mark as Signed</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractsPage;
