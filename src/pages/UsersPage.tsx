import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User } from "lucide-react";

interface ProfileWithRole {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  business_id: string | null;
  created_at: string;
  roles: string[];
}

const UsersPage = () => {
  const { isSuperAdmin, isBusinessAdmin } = useAuth();
  const [users, setUsers] = useState<ProfileWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, business_id, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load users");
        setLoading(false);
        return;
      }

      // Fetch roles for all users
      const userIds = profiles?.map((p) => p.user_id) || [];
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const usersWithRoles: ProfileWithRole[] = (profiles || []).map((p) => ({
        ...p,
        roles: roleData?.filter((r) => r.user_id === p.user_id).map((r) => r.role) || [],
      }));

      setUsers(usersWithRoles);
      setLoading(false);
    };

    fetchUsers();
  }, []);

  if (!isSuperAdmin && !isBusinessAdmin) return <p className="text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage team members</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No users found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {users.map((u) => (
            <Card key={u.id}>
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
                  {u.roles.map((r) => (
                    <Badge key={r} variant="secondary" className="capitalize text-xs">
                      {r.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersPage;
