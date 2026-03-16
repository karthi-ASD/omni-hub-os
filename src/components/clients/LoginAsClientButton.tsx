import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogIn, Shield, AlertTriangle } from "lucide-react";

interface LoginAsClientButtonProps {
  clientId: string;
  clientName: string;
  clientEmail: string;
}

export const LoginAsClientButton: React.FC<LoginAsClientButtonProps> = ({
  clientId,
  clientName,
  clientEmail,
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLoginAsClient = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("login-as-client", {
        body: { client_id: clientId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.magic_link) {
        // Open in new tab so admin doesn't lose their session
        window.open(data.magic_link, "_blank");
        toast.success(`Opened client portal for ${clientName}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to login as client");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        className="gap-2"
      >
        <LogIn className="h-4 w-4" />
        Login As Client
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Login As Client
            </DialogTitle>
            <DialogDescription>
              You are about to impersonate the client portal for:
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border p-4 space-y-2">
            <p className="font-semibold">{clientName}</p>
            <p className="text-sm text-muted-foreground">{clientEmail}</p>
          </div>

          <div className="flex items-start gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>This action will be logged in the audit trail. A new tab will open with the client's portal session.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLoginAsClient} disabled={loading}>
              {loading ? "Opening..." : "Proceed"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
