import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Users, Building2, Calendar, Shield, Settings } from "lucide-react";

export function QuickActions() {
  const { isSuperAdmin, isBusinessAdmin } = useAuth();
  const navigate = useNavigate();

  const actions = [
    ...(isSuperAdmin
      ? [{ label: "Manage Businesses", icon: Building2, to: "/businesses" }]
      : []),
    ...(isSuperAdmin || isBusinessAdmin
      ? [
          { label: "Manage Users", icon: Users, to: "/users" },
          { label: "View Audit Logs", icon: Shield, to: "/audit-logs" },
          { label: "Settings", icon: Settings, to: "/settings" },
        ]
      : []),
    { label: "Calendar", icon: Calendar, to: "/calendar" },
  ];

  if (actions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.to}
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate(action.to)}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
