import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface AuditLog {
  id: string;
  action_type: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  actor_user_id: string | null;
}

const AuditLogs = () => {
  const { isSuperAdmin, isBusinessAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action_type, entity_type, entity_id, created_at, actor_user_id")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error) setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  if (!isSuperAdmin && !isBusinessAdmin) return <p className="text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Track all system actions</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No audit logs yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{log.action_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.entity_type && `${log.entity_type}`}
                      {log.entity_id && ` · ${log.entity_id.slice(0, 8)}...`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
