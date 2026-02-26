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
import { FileSignature, Send, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600",
  signed: "bg-green-500/10 text-green-600",
  rejected: "bg-destructive/10 text-destructive",
};

const ContractsPage = () => {
  const { contracts, loading, sendContract, markSigned } = useContracts();
  const { createClient } = useClients();
  const { createProject } = useProjects();
  const { deals, markWon } = useDeals();
  const { profile } = useAuth();
  const [detailOpen, setDetailOpen] = useState<Contract | null>(null);
  const [signingId, setSigningId] = useState<string | null>(null);

  const handleSign = async (contract: Contract) => {
    // Mark contract signed
    await markSigned(contract.id, contract.deal_id);

    // Mark deal as won
    await markWon(contract.deal_id);

    // Get deal info for client creation
    const deal = deals.find(d => d.id === contract.deal_id);
    if (deal) {
      // Create client
      const client = await createClient({
        deal_id: deal.id,
        company_name: deal.business_name || undefined,
        contact_name: deal.contact_name,
        email: deal.email,
        phone: deal.phone || undefined,
      });

      // Create project
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileSignature className="h-6 w-6" /> Contracts</h1>
        <p className="text-muted-foreground">Manage contracts and signatures</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : contracts.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No contracts yet. Generate one from an accepted proposal.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {contracts.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailOpen(c)}>
              <CardContent className="flex items-center gap-4 py-3 px-4">
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

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["draft", "sent", "signed", "rejected"] as const).map(s => (
          <Card key={s}>
            <CardHeader className="pb-2"><CardTitle className="text-sm capitalize text-muted-foreground">{s}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{contracts.filter(c => c.status === s).length}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* DETAIL */}
      <Dialog open={!!detailOpen} onOpenChange={() => setDetailOpen(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Contract #{detailOpen?.contract_number}</DialogTitle></DialogHeader>
          {detailOpen && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={statusColors[detailOpen.status]}>{detailOpen.status}</Badge></div>
              {detailOpen.signed_at && <div className="flex justify-between"><span className="text-muted-foreground">Signed</span><span>{format(new Date(detailOpen.signed_at), "MMM d, yyyy HH:mm")}</span></div>}
              {detailOpen.contract_content && (
                <div className="border rounded-md p-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: detailOpen.contract_content }} />
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
