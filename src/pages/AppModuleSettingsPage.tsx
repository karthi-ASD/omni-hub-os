import { useEffect } from "react";
import { useAppModuleSettings, DEFAULT_APP_MODULES } from "@/hooks/useBusinessOnboarding";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Receipt, CreditCard, CalendarCheck, Headphones, History, FileText, User, Bell } from "lucide-react";

const MODULE_ICONS: Record<string, React.ElementType> = {
  "Invoices": Receipt,
  "Payments": CreditCard,
  "Bookings": CalendarCheck,
  "Support Tickets": Headphones,
  "Service History": History,
  "Documents": FileText,
  "Profile": User,
  "Notifications": Bell,
};

export default function AppModuleSettingsPage() {
  const { modules, loading, initDefaults, toggleModule } = useAppModuleSettings();

  useEffect(() => {
    if (!loading && modules.length === 0) {
      initDefaults();
    }
  }, [loading, modules.length]);

  const allModules = modules.length > 0
    ? modules
    : DEFAULT_APP_MODULES.map((m) => ({
        id: m.name,
        business_id: "",
        module_name: m.name,
        enabled: true,
        visible_to_customer: true,
        display_order: m.order,
      }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mobile App Settings"
        description="Control which modules your customers can see and access in the mobile app"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Customer App Modules
          </CardTitle>
          <CardDescription>Toggle modules on/off to control what your customers see</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {allModules.map((mod) => {
              const Icon = MODULE_ICONS[mod.module_name] || Smartphone;
              return (
                <div key={mod.module_name} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{mod.module_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {mod.enabled ? "Visible to customers" : "Hidden from customers"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={mod.enabled ? "default" : "secondary"}>
                      {mod.enabled ? "Active" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={mod.enabled}
                      onCheckedChange={(checked) => toggleModule(mod.module_name, checked)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
