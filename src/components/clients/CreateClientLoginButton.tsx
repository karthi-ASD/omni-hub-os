import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, KeyRound, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CreateClientLoginButtonProps {
  clientId: string;
  clientName: string;
  clientEmail: string;
  businessId: string;
  loginStatus?: string;
  onSuccess?: () => void;
}

export const CreateClientLoginButton: React.FC<CreateClientLoginButtonProps> = ({
  clientId,
  clientName,
  clientEmail,
  businessId,
  loginStatus,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasLogin = loginStatus === "active" || loginStatus === "activated";

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-client-auth", {
        body: {
          client_id: clientId,
          email: clientEmail,
          full_name: clientName,
          business_id: businessId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(
        `Login created for ${clientName}. ${data?.password_info || ""}`
      );
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to create client login");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  if (hasLogin) {
    return (
      <Badge variant="outline" className="gap-1 text-green-600 border-green-200">
        <KeyRound className="h-3 w-3" />
        Login Active
      </Badge>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        className="gap-2"
      >
        <UserPlus className="h-4 w-4" />
        Create Login
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Create Client Login
            </DialogTitle>
            <DialogDescription>
              This will create a portal login account for the client.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border p-4 space-y-2">
            <p className="font-semibold">{clientName}</p>
            <p className="text-sm text-muted-foreground">{clientEmail}</p>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
            <p><strong>Testing Mode:</strong> Login will use the shared password (NextWebTest@123)</p>
            <p><strong>Production Mode:</strong> An activation email will be sent instead</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "Creating..." : "Create Login"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
