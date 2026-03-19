import { useParams, useSearchParams } from "react-router-dom";
import { useClientPackage } from "@/hooks/useClientPackage";
import { usePackageOnboarding } from "@/hooks/usePackageOnboarding";
import { usePackageSeoTasks } from "@/hooks/usePackageSeoTasks";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Layers, Target, Shield, Share2, ListTodo } from "lucide-react";
import PackageOverviewTab from "@/components/packages/PackageOverviewTab";
import PackageServicesTab from "@/components/packages/PackageServicesTab";
import PackageSeoTab from "@/components/packages/PackageSeoTab";
import PackageAssetsTab from "@/components/packages/PackageAssetsTab";
import PackageSocialLinksTab from "@/components/packages/PackageSocialLinksTab";
import CreatePackageDialog from "@/components/packages/CreatePackageDialog";
import GenerateInstallmentsDialog from "@/components/packages/GenerateInstallmentsDialog";
import PackageOnboardingProgress from "@/components/packages/PackageOnboardingProgress";
import PackageSeoTasksTab from "@/components/packages/PackageSeoTasksTab";
import ClientPackageView from "@/components/packages/ClientPackageView";

interface ClientPackagePageProps {
  clientIdProp?: string;
}

export default function ClientPackagePage({ clientIdProp }: ClientPackagePageProps = {}) {
  const { clientId: routeClientId } = useParams<{ clientId: string }>();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";
  const { roles, clientId: authClientId, isClientUser } = useAuth();
  const { departmentName } = useEmployeeDepartment();

  const resolvedClientId = clientIdProp || routeClientId || authClientId || undefined;

  const {
    pkg, services, seoData, assets, socialLinks, gmb, installments,
    loading, createPackage, updatePackage, upsertService, upsertSeoData,
    upsertAssets, upsertSocialLinks, upsertGmb,
    generateInstallments, markInstallmentPaid, markInstallmentSkipped, reversePayment,
    totalPaid, totalOutstanding, overdueAmount, nextDueDate,
  } = useClientPackage(resolvedClientId);

  const isClient = roles.includes("client");
  const deptLower = (departmentName || "").toLowerCase();
  const isFinanceDept = deptLower.includes("finance") || deptLower.includes("accounts") || deptLower.includes("accounting");
  const isSEODept = deptLower.includes("seo") || deptLower.includes("digital marketing");
  const isAdmin = roles.some(r => ["super_admin", "business_admin"].includes(r));
  const isFinance = isAdmin || isFinanceDept;
  const canAccessSEO = isAdmin || isSEODept;
  const isReadOnly = isClient;
  const canManagePayments = isFinance;
  const canEditOnboarding = !isClient && (isAdmin || isSEODept);

  const {
    steps: onboardingSteps,
    progress: onboardingProgress,
    completedCount: onboardingCompleted,
    updateStepStatus,
    allComplete: onboardingComplete,
  } = usePackageOnboarding(pkg?.id, canEditOnboarding);

  // Fetch SEO tasks for client view
  const { tasks: seoTasks } = usePackageSeoTasks(pkg?.id, resolvedClientId);

  if (!roles || roles.length === 0 || loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!pkg) {
    if (isClient) {
      return (
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <div className="text-2xl font-semibold mb-2 text-foreground">We're Setting Up Your Services</div>
            <p className="text-muted-foreground max-w-md mb-3">
              Your onboarding is in progress. You'll be able to view your full dashboard once setup is complete.
            </p>
            <span className="text-xs text-muted-foreground/70">Managed and optimized by NextWeb</span>
          </div>
        </div>
      );
    }
    if (isFinance) {
      return (
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <div className="text-2xl font-semibold mb-2 text-foreground">No Package Found</div>
            <p className="text-muted-foreground mb-4 max-w-md">This client does not have a package yet. Create one to get started.</p>
            <CreatePackageDialog onCreate={createPackage} />
          </div>
        </div>
      );
    }
    if (isSEODept) {
      return (
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <div className="text-2xl font-semibold mb-2 text-foreground">No Package Yet</div>
            <p className="text-muted-foreground max-w-md">This client's package hasn't been created yet. Please contact the Finance team.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <div className="text-2xl font-semibold mb-2 text-foreground">No Package Available</div>
          <p className="text-muted-foreground max-w-md">No package has been set up for this client yet.</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // CLIENT VIEW — Premium WOW Dashboard
  // ═══════════════════════════════════════════════
  if (isClient) {
    return (
      <div className="p-6">
        <ClientPackageView
          pkg={pkg}
          services={services}
          seoData={seoData}
          assets={assets}
          socialLinks={socialLinks}
          gmb={gmb}
          onboardingSteps={onboardingSteps}
          onboardingProgress={onboardingProgress}
          onboardingCompleted={onboardingCompleted}
          onboardingComplete={onboardingComplete}
          seoTasks={seoTasks.filter(t => t.is_visible_to_client)}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // STAFF VIEW — Full Internal Controls
  // ═══════════════════════════════════════════════
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            {pkg.package_name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Client Digital Intelligence & Revenue Dashboard</p>
        </div>
        {canManagePayments && pkg.payment_type === "installment" && (
          <GenerateInstallmentsDialog
            packageId={pkg.id}
            totalValue={Number(pkg.total_value)}
            startDate={pkg.start_date}
            endDate={pkg.end_date}
            onGenerate={generateInstallments}
          />
        )}
      </div>

      {!onboardingComplete && onboardingSteps.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <PackageOnboardingProgress
            steps={onboardingSteps}
            progress={onboardingProgress}
            completedCount={onboardingCompleted}
            canEditOnboarding={canEditOnboarding}
            onUpdateStatus={updateStepStatus}
          />
        </div>
      )}

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full justify-start bg-muted/30 p-1 rounded-xl flex-wrap">
          <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:bg-background"><Package className="h-3.5 w-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="services" className="gap-1.5 data-[state=active]:bg-background"><Layers className="h-3.5 w-3.5" /> Services</TabsTrigger>
          {canAccessSEO && <TabsTrigger value="seo" className="gap-1.5 data-[state=active]:bg-background"><Target className="h-3.5 w-3.5" /> SEO Data</TabsTrigger>}
          {canAccessSEO && <TabsTrigger value="seo_tasks" className="gap-1.5 data-[state=active]:bg-background"><ListTodo className="h-3.5 w-3.5" /> SEO Tasks</TabsTrigger>}
          <TabsTrigger value="assets" className="gap-1.5 data-[state=active]:bg-background"><Shield className="h-3.5 w-3.5" /> Assets</TabsTrigger>
          <TabsTrigger value="social" className="gap-1.5 data-[state=active]:bg-background"><Share2 className="h-3.5 w-3.5" /> Social & GMB</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PackageOverviewTab
            pkg={pkg} installments={installments} totalPaid={totalPaid}
            totalOutstanding={totalOutstanding} overdueAmount={overdueAmount} nextDueDate={nextDueDate}
            onMarkPaid={markInstallmentPaid} onMarkSkipped={markInstallmentSkipped}
            onReversePayment={canManagePayments ? reversePayment : undefined}
            isReadOnly={!canManagePayments}
          />
        </TabsContent>
        <TabsContent value="services">
          <PackageServicesTab packageId={pkg.id} services={services} onUpsert={upsertService} isReadOnly={isReadOnly} />
        </TabsContent>
        {canAccessSEO && (
          <TabsContent value="seo">
            <PackageSeoTab packageId={pkg.id} seoData={seoData} onSave={upsertSeoData} isReadOnly={false} />
          </TabsContent>
        )}
        {canAccessSEO && (
          <TabsContent value="seo_tasks">
            <PackageSeoTasksTab packageId={pkg.id} clientId={resolvedClientId} isReadOnly={false} />
          </TabsContent>
        )}
        <TabsContent value="assets">
          <PackageAssetsTab packageId={pkg.id} assets={assets} onSave={upsertAssets} isReadOnly={isReadOnly} />
        </TabsContent>
        <TabsContent value="social">
          <PackageSocialLinksTab packageId={pkg.id} socialLinks={socialLinks} gmb={gmb}
            onSaveSocial={upsertSocialLinks} onSaveGmb={upsertGmb} isReadOnly={isReadOnly} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
