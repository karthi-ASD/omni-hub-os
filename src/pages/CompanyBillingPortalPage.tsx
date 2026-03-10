import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useSaasPlans } from "@/hooks/useSaasPlans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Users, FolderOpen, HardDrive, AlertTriangle, Check, Crown } from "lucide-react";
import { toast } from "sonner";

const CompanyBillingPortalPage = () => {
  const limits = usePlanLimits();
  const { plans } = useSaasPlans();

  if (limits.loading) {
    return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  const usagePercent = (current: number, max: number) => max <= 0 ? 0 : Math.min(100, (current / max) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Billing & Plan</h1>
        <p className="text-muted-foreground">Manage your subscription and usage</p>
      </div>

      {/* Trial banner */}
      {limits.subscriptionStatus === "trial" && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium">Free Trial Active</p>
              <p className="text-sm text-muted-foreground">
                {limits.isTrialExpired
                  ? "Your trial has expired. Please upgrade to continue."
                  : `Trial ends ${limits.trialEndsAt ? new Date(limits.trialEndsAt).toLocaleDateString() : "soon"}`}
              </p>
            </div>
            <Button className="ml-auto" onClick={() => toast.info("Stripe payments will be enabled soon")}>Upgrade Now</Button>
          </CardContent>
        </Card>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <CardTitle>Current Plan: {limits.planName}</CardTitle>
            <Badge variant="secondary" className={
              limits.subscriptionStatus === "active" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
              limits.subscriptionStatus === "trial" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
              ""
            }>{limits.subscriptionStatus}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Usage meters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Users</span>
                <span>{limits.isUnlimited ? `${limits.currentUsers} / ∞` : `${limits.currentUsers} / ${limits.userLimit}`}</span>
              </div>
              <Progress value={limits.isUnlimited ? 10 : usagePercent(limits.currentUsers, limits.userLimit)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1"><FolderOpen className="h-4 w-4" /> Projects</span>
                <span>{limits.isUnlimited ? `${limits.currentProjects} / ∞` : `${limits.currentProjects} / ${limits.projectLimit}`}</span>
              </div>
              <Progress value={limits.isUnlimited ? 10 : usagePercent(limits.currentProjects, limits.projectLimit)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1"><HardDrive className="h-4 w-4" /> Storage</span>
                <span>{limits.storageLimitGb} GB</span>
              </div>
              <Progress value={5} />
            </div>
          </div>

          {/* Features */}
          {limits.features.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Included Features</p>
              <div className="grid grid-cols-2 gap-1">
                {limits.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-3 w-3 text-green-600" /> {f}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Card key={plan.id} className={`hover:shadow-md transition-shadow ${plan.name === limits.planName ? "border-primary border-2" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.name === limits.planName && <Badge>Current</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">${plan.monthly_price}</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <div className="space-y-1 text-sm">
                  <div>{plan.user_limit === -1 ? "Unlimited" : plan.user_limit} users</div>
                  <div>{plan.project_limit === -1 ? "Unlimited" : plan.project_limit} projects</div>
                  <div>{plan.storage_limit_gb} GB storage</div>
                </div>
                {plan.name !== limits.planName && (
                  <Button className="w-full" variant="outline" onClick={() => toast.info("Stripe payments will be enabled soon")}>
                    Upgrade to {plan.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanyBillingPortalPage;
