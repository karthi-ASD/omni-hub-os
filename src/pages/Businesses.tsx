import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Ban, CheckCircle, Pencil, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

type Business = Tables<"businesses">;

const Businesses = () => {
  const { isSuperAdmin, profile } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [editBiz, setEditBiz] = useState<Business | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBusinesses = async () => {
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load businesses");
    } else {
      setBusinesses(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const toggleStatus = async (biz: Business) => {
    const newStatus = biz.status === "active" ? "suspended" : "active";
    const { error } = await supabase
      .from("businesses")
      .update({ status: newStatus })
      .eq("id", biz.id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Business ${newStatus}`);
      // Audit log
      if (profile) {
        await supabase.from("audit_logs").insert({
          business_id: biz.id,
          actor_user_id: profile.user_id,
          action_type: newStatus === "suspended" ? "SUSPEND_BUSINESS" : "REACTIVATE_BUSINESS",
          entity_type: "business",
          entity_id: biz.id,
          new_value_json: { status: newStatus },
        });
      }
      fetchBusinesses();
    }
  };

  const openEdit = (biz: Business) => {
    setEditBiz(biz);
    setEditName(biz.name);
  };

  const saveEdit = async () => {
    if (!editBiz || !editName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update({ name: editName.trim() })
      .eq("id", editBiz.id);
    if (error) {
      toast.error("Failed to update business");
    } else {
      toast.success("Business updated");
      if (profile) {
        await supabase.from("audit_logs").insert({
          business_id: editBiz.id,
          actor_user_id: profile.user_id,
          action_type: "UPDATE_BUSINESS",
          entity_type: "business",
          entity_id: editBiz.id,
          old_value_json: { name: editBiz.name },
          new_value_json: { name: editName.trim() },
        });
      }
      setEditBiz(null);
      fetchBusinesses();
    }
    setSaving(false);
  };

  if (!isSuperAdmin) return <p className="text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Businesses</h1>
          <p className="text-muted-foreground">Manage all tenants</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : businesses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No businesses found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {businesses.map((biz) => (
            <Card key={biz.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{biz.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(biz.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={biz.status === "active" ? "default" : "destructive"}>
                    {biz.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(biz)}
                  >
                    <Pencil className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(biz)}
                  >
                    {biz.status === "active" ? (
                      <><Ban className="mr-1 h-3 w-3" /> Suspend</>
                    ) : (
                      <><CheckCircle className="mr-1 h-3 w-3" /> Reactivate</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editBiz} onOpenChange={(open) => !open && setEditBiz(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Business</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Business name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditBiz(null)}>Cancel</Button>
              <Button onClick={saveEdit} disabled={saving || !editName.trim()}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Businesses;
