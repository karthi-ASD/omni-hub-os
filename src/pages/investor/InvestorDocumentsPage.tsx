import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Upload, FileText, Download, FolderOpen } from "lucide-react";

export default function InvestorDocumentsPage() {
  usePageTitle("Documents", "View and manage your investment documents");
  const { profile } = useAuth();
  const bid = profile?.business_id;

  const { data: clientLink } = useQuery({
    queryKey: ["investor-client-link", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("client_users")
        .select("client_id").eq("user_id", profile!.user_id).eq("is_primary", true).maybeSingle();
      return data;
    },
    enabled: !!profile?.user_id,
  });

  const clientId = clientLink?.client_id;

  // Get deals with property documents
  const { data: deals = [] } = useQuery({
    queryKey: ["investor-docs-deals", bid, clientId],
    queryFn: async () => {
      const { data } = await supabase.from("crm_deals").select("id, deal_name, deal_stage, documents_json, property_id")
        .eq("business_id", bid!).eq("client_id", clientId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!bid && !!clientId,
  });

  // Get properties with documents
  const propIds = deals.filter(d => d.property_id).map(d => d.property_id);
  const { data: properties = [] } = useQuery({
    queryKey: ["investor-docs-props", propIds],
    queryFn: async () => {
      if (propIds.length === 0) return [];
      const { data } = await supabase.from("crm_properties").select("id, property_name, documents_json").in("id", propIds);
      return data || [];
    },
    enabled: propIds.length > 0,
  });

  // Flatten all documents
  const allDocs: { name: string; url?: string; source: string; dealName?: string }[] = [];

  deals.forEach((d: any) => {
    if (d.documents_json && Array.isArray(d.documents_json)) {
      (d.documents_json as any[]).forEach(doc => {
        allDocs.push({ name: doc.name || "Document", url: doc.url, source: "Deal", dealName: d.deal_name });
      });
    }
  });

  properties.forEach((p: any) => {
    if (p.documents_json && Array.isArray(p.documents_json)) {
      (p.documents_json as any[]).forEach(doc => {
        allDocs.push({ name: doc.name || "Document", url: doc.url, source: "Property", dealName: p.property_name });
      });
    }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Documents</h1>
            <p className="text-xs text-muted-foreground">Your investment documents and files</p>
          </div>
        </div>
      </div>

      {allDocs.length > 0 ? (
        <div className="space-y-3">
          {allDocs.map((doc, i) => (
            <Card key={i} className="rounded-xl border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground">{doc.source}: {doc.dealName}</p>
                </div>
                {doc.url && (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="text-xs gap-1">
                      <Download className="h-3.5 w-3.5" /> Open
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm font-medium">No documents yet</p>
          <p className="text-xs mt-1">Documents from your deals and properties will appear here</p>
        </div>
      )}
    </div>
  );
}
