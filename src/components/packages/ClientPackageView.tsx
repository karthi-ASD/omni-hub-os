import { CheckCircle2, Circle, Loader2, Globe, MapPin, ExternalLink, Sparkles, Target, Share2, Shield, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ClientPackage, PackageService, SeoPackageData, PackageAsset, ClientGmb } from "@/hooks/useClientPackage";
import type { OnboardingStep } from "@/hooks/usePackageOnboarding";
import type { PackageSeoTask } from "@/hooks/usePackageSeoTasks";
import { TASK_CATEGORIES } from "@/hooks/usePackageSeoTasks";
import { format, parseISO } from "date-fns";
import { useState } from "react";

interface Props {
  pkg: ClientPackage;
  services: PackageService[];
  seoData: SeoPackageData | null;
  assets: PackageAsset | null;
  socialLinks: Record<string, string> | null;
  gmb: ClientGmb | null;
  onboardingSteps: OnboardingStep[];
  onboardingProgress: number;
  onboardingCompleted: number;
  onboardingComplete: boolean;
  seoTasks: PackageSeoTask[];
}

const friendlyStatus = (s: string) => {
  switch (s) {
    case "completed": case "COMPLETED": return { label: "Completed", icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" };
    case "in_progress": case "IN_PROGRESS": return { label: "In Progress", icon: <Loader2 className="h-4 w-4 text-primary animate-spin" />, color: "bg-primary/10 text-primary border-primary/20" };
    case "BLOCKED": return { label: "Blocked", icon: <Circle className="h-4 w-4 text-red-500" />, color: "bg-red-500/10 text-red-700 border-red-200" };
    default: return { label: "Pending", icon: <Circle className="h-4 w-4 text-muted-foreground/40" />, color: "bg-muted text-muted-foreground" };
  }
};

export default function ClientPackageView({
  pkg, services, seoData, assets, socialLinks, gmb,
  onboardingSteps, onboardingProgress, onboardingCompleted, onboardingComplete, seoTasks,
}: Props) {
  const [showSuburbs, setShowSuburbs] = useState(false);
  const activeServices = services.filter(s => s.is_active);

  // Group tasks by category
  const tasksByCategory = seoTasks.reduce((acc, task) => {
    const cat = task.task_category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(task);
    return acc;
  }, {} as Record<string, PackageSeoTask[]>);

  const completedTasks = seoTasks.filter(t => t.status === "COMPLETED").length;
  const taskProgress = seoTasks.length > 0 ? Math.round((completedTasks / seoTasks.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-background border border-border p-8">
        <div className="absolute top-4 right-4">
          <Badge className={pkg.status === "active" ? "bg-emerald-500/15 text-emerald-700 border-emerald-300" : "bg-amber-500/15 text-amber-700 border-amber-300"}>
            {pkg.status === "active" ? "● Active" : pkg.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{pkg.package_name}</h1>
            <p className="text-sm text-muted-foreground">
              Started {format(parseISO(pkg.start_date), "dd MMMM yyyy")}
              {pkg.end_date && ` · Ends ${format(parseISO(pkg.end_date), "dd MMMM yyyy")}`}
            </p>
          </div>
        </div>
      </div>

      {/* Campaign Progress - Big WOW Section */}
      <Card className="rounded-2xl border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/5 to-transparent p-6 pb-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Campaign Progress
            </h2>
            <span className="text-2xl font-bold text-primary">{onboardingProgress}%</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {onboardingComplete
              ? "🎉 Your campaign setup is complete! Results are on the way."
              : "Your digital campaign is being built by our expert team."}
          </p>
        </div>
        <CardContent className="p-6 pt-2 space-y-3">
          <Progress value={onboardingProgress} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {onboardingCompleted} of {onboardingSteps.length} steps completed
          </p>
          <div className="space-y-2 mt-4">
            {onboardingSteps.map(step => {
              const status = friendlyStatus(step.status);
              return (
                <div key={step.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    {status.icon}
                    <span className={`text-sm font-medium ${step.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {step.step_name}
                    </span>
                  </div>
                  <Badge variant="outline" className={status.color}>{status.label}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Services Included */}
      {activeServices.length > 0 && (
        <Card className="rounded-2xl border-border">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <Layers className="h-5 w-5 text-primary" /> Your Services
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeServices.map(s => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-medium text-foreground">{s.service_name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Progress - Tasks by Category */}
      {seoTasks.length > 0 && (
        <Card className="rounded-2xl border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Work Progress
              </h2>
              <span className="text-sm font-medium text-primary">{taskProgress}% Complete</span>
            </div>
            <Progress value={taskProgress} className="h-2 mb-6" />

            <div className="space-y-5">
              {Object.entries(tasksByCategory).map(([cat, tasks]) => {
                const catLabel = TASK_CATEGORIES.find(c => c.value === cat)?.label || cat;
                return (
                  <div key={cat}>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{catLabel}</h3>
                    <div className="space-y-1.5">
                      {tasks.map(task => {
                        const status = friendlyStatus(task.status);
                        return (
                          <div key={task.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-2.5">
                              {status.icon}
                              <span className={`text-sm ${task.status === "COMPLETED" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                {task.task_title}
                              </span>
                            </div>
                            <Badge variant="outline" className={`text-xs ${status.color}`}>{status.label}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEO Coverage */}
      {seoData && (
        <Card className="rounded-2xl border-border">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" /> SEO Coverage
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center">
                <p className="text-3xl font-bold text-primary">{seoData.radius_km}</p>
                <p className="text-xs text-muted-foreground mt-1">Radius (km)</p>
              </div>
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center">
                <p className="text-3xl font-bold text-primary">{seoData.suburbs?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Suburbs Targeted</p>
              </div>
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center">
                <p className="text-3xl font-bold text-primary">{seoData.keyword_count || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Keywords Tracked</p>
              </div>
            </div>
            {seoData.suburbs && seoData.suburbs.length > 0 && (
              <div>
                <button
                  onClick={() => setShowSuburbs(!showSuburbs)}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  {showSuburbs ? "Hide suburbs" : `View all ${seoData.suburbs.length} suburbs →`}
                </button>
                {showSuburbs && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {seoData.suburbs.map((sub, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{sub}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Digital Assets & Social */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        {assets && (assets.domain_name || assets.hosting_provider) && (
          <Card className="rounded-2xl border-border">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" /> Digital Assets
              </h2>
              <div className="space-y-3">
                {assets.domain_name && (
                  <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                    <Globe className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Domain</p>
                      <p className="text-sm font-medium text-foreground">{assets.domain_name}</p>
                    </div>
                  </div>
                )}
                {assets.hosting_provider && (
                  <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                    <Shield className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Hosting</p>
                      <p className="text-sm font-medium text-foreground">{assets.hosting_provider}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Social & GMB */}
        {(socialLinks || gmb) && (
          <Card className="rounded-2xl border-border">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <Share2 className="h-5 w-5 text-primary" /> Online Presence
              </h2>
              <div className="space-y-3">
                {gmb?.gmb_link && (
                  <a href={gmb.gmb_link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 hover:bg-muted/40 transition-colors group">
                    <MapPin className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Google Business Profile</p>
                      <p className="text-sm font-medium text-foreground">View Profile</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                )}
                {socialLinks && Object.entries(socialLinks).filter(([, v]) => v).map(([key, url]) => (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 hover:bg-muted/40 transition-colors group">
                    <Share2 className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                      <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{url}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Friendly message */}
      {!onboardingComplete && (
        <div className="rounded-2xl bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-primary/10 p-6 text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
          <p className="text-base font-semibold text-foreground mb-1">Your Campaign is Being Built</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Our SEO team is actively working on your digital strategy. You'll start seeing results as each phase completes.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground/50 text-center">Managed and optimized by NextWeb</p>
    </div>
  );
}
