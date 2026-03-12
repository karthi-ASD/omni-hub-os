import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User, Pencil, Ban, CheckCircle, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProfileWithRole {
  id: string; user_id: string; full_name: string; email: string;
  business_id: string | null; created_at: string; roles: AppRole[];
}

const AVAILABLE_ROLES: AppRole[] = ["super_admin", "business_admin", "manager", "employee", "client"];

const UsersPage = () => {
  const { isSuperAdmin, isBusinessAdmin, profile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<ProfileWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<ProfileWithRole | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<AppRole | "">("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    const { data: profiles, error } = await supabase
      .from("profiles").select("id, user_id, full_name, email, business_id, created_at")
      .order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load users"); setLoading(false); return; }
    const userIds = profiles?.map((p) => p.user_id) || [];
    const { data: roleData } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);
    const usersWithRoles: ProfileWithRole[] = (profiles || []).map((p) => ({
      ...p, roles: (roleData?.filter((r) => r.user_id === p.user_id).map((r) => r.role) || []) as AppRole[],
    }));
    setUsers(usersWithRoles);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openEdit = (u: ProfileWithRole) => { setEditUser(u); setEditName(u.full_name); setEditRole(u.roles[0] || ""); };

  const saveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    if (editName.trim() !== editUser.full_name) {
      const { error } = await supabase.from("profiles").update({ full_name: editName.trim() }).eq("user_id", editUser.user_id);
      if (error) { toast.error("Failed to update name"); setSaving(false); return; }
    }
    if (isSuperAdmin && editRole && !editUser.roles.includes(editRole as AppRole)) {
      await supabase.from("user_roles").delete().eq("user_id", editUser.user_id);
      const { error } = await supabase.from("user_roles").insert({ user_id: editUser.user_id, role: editRole as AppRole });
      if (error) { toast.error("Failed to update role"); setSaving(false); return; }
    }
    if (profile) {
      await supabase.from("audit_logs").insert({
        business_id: editUser.business_id, actor_user_id: profile.user_id,
        action_type: "UPDATE_USER", entity_type: "user", entity_id: editUser.user_id,
        new_value_json: { full_name: editName.trim(), role: editRole },
      });
    }
    toast.success("User updated");
    setEditUser(null); setSaving(false); fetchUsers();
  };

  const suspendUser = async (u: ProfileWithRole) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", u.user_id);
    if (error) { toast.error("Failed to suspend user"); return; }
    toast.success("User suspended"); fetchUsers();
  };

  const reactivateUser = async (u: ProfileWithRole) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: u.user_id, role: "employee" as AppRole });
    if (error) { toast.error("Failed to reactivate user"); return; }
    toast.success("User reactivated"); fetchUsers();
  };

  if (!isSuperAdmin && !isBusinessAdmin) return <p className="text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Users" subtitle="Manage team members and permissions" icon={Users} badge={`${users.length}`} />

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : users.length === 0 ? (
        <Card className="rounded-2xl"><CardContent className="py-12 text-center text-muted-foreground">No users found.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {users.map((u) => (
            <Card key={u.id} className="rounded-2xl border-0 shadow-elevated hover-lift transition-all">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {u.roles.length > 0 ? u.roles.map((r) => (
                    <Badge key={r} variant="secondary" className="capitalize text-xs">{r.replace(/_/g, " ")}</Badge>
                  )) : <Badge variant="destructive" className="text-xs">Suspended</Badge>}
                  {isSuperAdmin && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => openEdit(u)}><Pencil className="mr-1 h-3 w-3" /> Edit</Button>
                      {u.roles.length > 0 ? (
                        <Button variant="outline" size="sm" onClick={() => suspendUser(u)}><Ban className="mr-1 h-3 w-3" /> Suspend</Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => reactivateUser(u)}><CheckCircle className="mr-1 h-3 w-3" /> Reactivate</Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Full Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
            {isSuperAdmin && (
              <div className="space-y-2"><Label>Role</Label>
                <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>{AVAILABLE_ROLES.map((r) => (<SelectItem key={r} value={r} className="capitalize">{r.replace(/_/g, " ")}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
