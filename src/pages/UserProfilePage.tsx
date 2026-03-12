import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Shield, Briefcase, Calendar, Clock } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  business_id: string | null;
  avatar_url: string | null;
  created_at: string;
}

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState<string>("");
  const [taskStats, setTaskStats] = useState({ assigned: 0, completed: 0 });
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    fetchAll();
  }, [userId]);

  const fetchAll = async () => {
    setLoading(true);
    // Fetch profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId!)
      .single();
    setProfile(prof as any);

    // Fetch roles
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId!);
    setRoles((roleData?.map(r => r.role) || []) as AppRole[]);

    // Fetch business name
    if (prof?.business_id) {
      const { data: biz } = await supabase
        .from("businesses")
        .select("name")
        .eq("id", prof.business_id)
        .single();
      setBusinessName(biz?.name || "");
    }

    // Fetch employee record if exists
    try {
      const { data: emp } = await supabase.rpc("get_user_business_id" as any, { _user_id: userId }).then(() => ({ data: null }));
      // Attempt to get HR employee data
      const empRes = await fetch(`/api/hr-employee?user_id=${userId}`).catch(() => null);
      setEmployee(null);
    } catch { /* hr_employees may not exist */ }

    // Task stats
    const { count: assigned } = await supabase
      .from("project_tasks")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to_user_id", userId!);
    const { count: completed } = await supabase
      .from("project_tasks")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to_user_id", userId!)
      .eq("status", "done");
    setTaskStats({ assigned: assigned || 0, completed: completed || 0 });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <PageHeader title={profile.full_name} subtitle={profile.email} />
      </div>

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic"><User className="h-3 w-3 mr-1" /> Basic Info</TabsTrigger>
          <TabsTrigger value="system"><Shield className="h-3 w-3 mr-1" /> System Info</TabsTrigger>
          <TabsTrigger value="performance"><Briefcase className="h-3 w-3 mr-1" /> Performance</TabsTrigger>
          <TabsTrigger value="permissions"><Shield className="h-3 w-3 mr-1" /> Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card className="rounded-2xl shadow-elevated">
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Full Name" value={profile.full_name} />
                <InfoRow label="Email" value={profile.email} />
                <InfoRow label="Business" value={businessName || "—"} />
                {employee && (
                  <>
                    <InfoRow label="Employee Code" value={employee.employee_code || "—"} />
                    <InfoRow label="Designation" value={employee.designation || "—"} />
                    <InfoRow label="Department" value={employee.department_name || "—"} />
                    <InfoRow label="Phone" value={employee.phone || "—"} />
                    <InfoRow label="Hire Date" value={employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : "—"} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card className="rounded-2xl shadow-elevated">
            <CardHeader><CardTitle>System Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="User ID" value={profile.user_id} />
                <InfoRow label="Business ID" value={profile.business_id || "—"} />
                <InfoRow label="Roles" value={roles.join(", ") || "None"} />
                <InfoRow label="Account Created" value={new Date(profile.created_at).toLocaleString()} />
                <InfoRow label="Status" value="Active" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Tasks Assigned" value={taskStats.assigned} />
            <StatCard label="Tasks Completed" value={taskStats.completed} />
            <StatCard label="Completion Rate" value={taskStats.assigned > 0 ? `${Math.round((taskStats.completed / taskStats.assigned) * 100)}%` : "—"} />
            <StatCard label="Active Tasks" value={taskStats.assigned - taskStats.completed} />
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card className="rounded-2xl shadow-elevated">
            <CardHeader><CardTitle>Assigned Roles</CardTitle></CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <p className="text-muted-foreground">No roles assigned.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {roles.map(r => (
                    <Badge key={r} variant="secondary" className="text-sm px-3 py-1">
                      {r.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground font-medium">{label}</p>
    <p className="text-sm font-medium break-all">{value}</p>
  </div>
);

const StatCard = ({ label, value }: { label: string; value: number | string }) => (
  <Card className="rounded-xl">
    <CardContent className="pt-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default UserProfilePage;
