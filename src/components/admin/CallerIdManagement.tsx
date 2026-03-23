import { useState } from "react";
import { useAllCallerIds } from "@/hooks/useAgentCallerIds";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function CallerIdManagement() {
  const { profile } = useAuth();
  const { data: callerIds = [], isLoading } = useAllCallerIds();
  const queryClient = useQueryClient();

  const [newEmail, setNewEmail] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!profile?.business_id || !newEmail || !newNumber) {
      toast.error("Email and number are required");
      return;
    }

    // Look up user_id from email
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", newEmail.trim())
      .eq("business_id", profile.business_id)
      .maybeSingle();

    if (!userProfile) {
      toast.error("No user found with that email in this business");
      return;
    }

    setAdding(true);
    const { error } = await supabase.from("agent_caller_ids").insert({
      business_id: profile.business_id,
      agent_user_id: userProfile.user_id,
      agent_email: newEmail.trim(),
      plivo_number: newNumber.trim(),
      label: newLabel.trim() || `${newEmail.split("@")[0]} Line`,
      is_default: true,
      is_active: true,
    } as any);

    setAdding(false);
    if (error) {
      toast.error("Failed to add caller ID: " + error.message);
    } else {
      toast.success("Caller ID added");
      setNewEmail("");
      setNewNumber("");
      setNewLabel("");
      queryClient.invalidateQueries({ queryKey: ["all-agent-caller-ids"] });
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from("agent_caller_ids").update({ is_active: !currentActive } as any).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["all-agent-caller-ids"] });
    toast.success(currentActive ? "Deactivated" : "Activated");
  };

  const toggleDefault = async (id: string, currentDefault: boolean) => {
    await supabase.from("agent_caller_ids").update({ is_default: !currentDefault } as any).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["all-agent-caller-ids"] });
    toast.success("Default updated");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("agent_caller_ids").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["all-agent-caller-ids"] });
    toast.success("Caller ID removed");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Caller ID Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new */}
        <div className="flex items-end gap-2 flex-wrap">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Agent Email</label>
            <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="agent@nextweb.com.au" className="h-8 text-sm w-52" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Phone Number</label>
            <Input value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="+61468280069" className="h-8 text-sm w-40 font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Label</label>
            <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Steve Line" className="h-8 text-sm w-36" />
          </div>
          <Button size="sm" onClick={handleAdd} disabled={adding} className="h-8">
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Agent</TableHead>
              <TableHead className="text-xs">Number</TableHead>
              <TableHead className="text-xs">Label</TableHead>
              <TableHead className="text-xs text-center">Default</TableHead>
              <TableHead className="text-xs text-center">Active</TableHead>
              <TableHead className="text-xs text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">Loading...</TableCell></TableRow>
            ) : callerIds.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">No caller IDs configured</TableCell></TableRow>
            ) : (
              callerIds.map((cid) => (
                <TableRow key={cid.id}>
                  <TableCell className="text-xs">{cid.agent_email}</TableCell>
                  <TableCell className="text-xs font-mono">{cid.plivo_number}</TableCell>
                  <TableCell className="text-xs">{cid.label}</TableCell>
                  <TableCell className="text-center">
                    <Switch checked={cid.is_default} onCheckedChange={() => toggleDefault(cid.id, cid.is_default)} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={cid.is_active} onCheckedChange={() => toggleActive(cid.id, cid.is_active)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(cid.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
