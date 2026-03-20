import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Eye } from "lucide-react";

export function ClientPortalMgmtModule() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Client Portal Management</h2>
        <p className="text-xs text-muted-foreground">Manage what your investors see in their portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10"><Shield className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="font-semibold text-foreground text-sm">Access Control</p>
              <p className="text-xs text-muted-foreground mt-1">Define what each investor can view in their portal</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10"><Users className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="font-semibold text-foreground text-sm">Investor Accounts</p>
              <p className="text-xs text-muted-foreground mt-1">Manage portal logins and permissions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10"><Eye className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="font-semibold text-foreground text-sm">Portal Preview</p>
              <p className="text-xs text-muted-foreground mt-1">See what your clients experience</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">Full portal management coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
