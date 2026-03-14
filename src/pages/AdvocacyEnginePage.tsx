import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { useAdvocacy } from "@/hooks/useAdvocacy";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { CreateCampaignDialog } from "@/components/advocacy/CreateCampaignDialog";
import { CampaignCard } from "@/components/advocacy/CampaignCard";
import { LeaderboardTab } from "@/components/advocacy/LeaderboardTab";
import { AnalyticsTab } from "@/components/advocacy/AnalyticsTab";
import { GlobalSettingsTab } from "@/components/advocacy/GlobalSettingsTab";
import {
  Share2, Trophy, BarChart3, Megaphone, TrendingUp, Users, MousePointerClick, Target, Settings,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdvocacyEnginePage() {
  usePageTitle("Advocacy & Referral Engine", "Employee advocacy campaigns and referral tracking.");
  const { user, isSuperAdmin, isBusinessAdmin } = useAuth();
  const canManage = isSuperAdmin || isBusinessAdmin;
  const advocacy = useAdvocacy();
  const {
    campaigns, leaderboard, myPoints, loading, createCampaign,
    deleteCampaign, updateCampaignStatus, recordShare, getCampaignStats,
    getPlatformBreakdown, badges, settings, saveSettings, getMyBadges,
  } = advocacy;

  const handleShare = async (campaignId: string, platform: string, campaign: any) => {
    // Anti self-referral: handled in hook
    const refCode = await recordShare(campaignId, platform);
    if (!refCode) return;
    const link = `${window.location.origin}/ref/${refCode}/${campaignId.substring(0, 8)}`;
    const msg = campaign.share_message_template
      ? campaign.share_message_template.replace("{referral_link}", link)
      : `${campaign.title} - Check it out: ${link}`;

    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(msg)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(msg)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
    };

    if (platform === "copy") {
      navigator.clipboard.writeText(link);
      toast({ title: "Referral link copied!" });
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "noopener,noreferrer");
    }
  };

  const totalShares = advocacy.shares.length;
  const totalClicks = advocacy.referrals.length;
  const totalLeads = advocacy.referrals.filter((r) => r.lead_generated).length;
  const networkSize = settings?.default_network_size || 500;
  const viralReach = totalShares * networkSize;
  const refCode = advocacy.generateReferralCode();

  if (loading) return <div className="p-6 space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advocacy & Referral Engine"
        subtitle="Empower employees and customers to share campaigns and generate referral leads."
        actions={canManage ? <CreateCampaignDialog onCreate={createCampaign} /> : undefined}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Active Campaigns" value={campaigns.filter((c) => c.status === "active").length} icon={Megaphone} />
        <StatCard title="Total Shares" value={totalShares} icon={Share2} />
        <StatCard title="Total Clicks" value={totalClicks} icon={MousePointerClick} />
        <StatCard title="Leads Generated" value={totalLeads} icon={Target} />
        <StatCard title="Est. Viral Reach" value={viralReach.toLocaleString()} icon={TrendingUp} />
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList className="flex-wrap">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-1"><Trophy className="h-3.5 w-3.5" /> Leaderboard</TabsTrigger>
          {canManage && <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="h-3.5 w-3.5" /> Analytics</TabsTrigger>}
          <TabsTrigger value="my-stats" className="gap-1"><Users className="h-3.5 w-3.5" /> My Stats</TabsTrigger>
          {canManage && <TabsTrigger value="settings" className="gap-1"><Settings className="h-3.5 w-3.5" /> Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="campaigns">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No campaigns yet.</p>}
            {campaigns.map((camp) => (
              <CampaignCard
                key={camp.id}
                campaign={camp}
                stats={getCampaignStats(camp.id)}
                canManage={canManage}
                onShare={handleShare}
                onDelete={deleteCampaign}
                onStatusChange={updateCampaignStatus}
                referralCode={refCode}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <LeaderboardTab leaderboard={leaderboard} badges={badges} />
        </TabsContent>

        {canManage && (
          <TabsContent value="analytics">
            <AnalyticsTab campaigns={campaigns} getCampaignStats={getCampaignStats} platformBreakdown={getPlatformBreakdown()} />
          </TabsContent>
        )}

        <TabsContent value="my-stats">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard title="My Points" value={myPoints?.points_total || 0} icon={Trophy} />
              <StatCard title="My Shares" value={myPoints?.shares_count || 0} icon={Share2} />
              <StatCard title="My Leads" value={myPoints?.leads_generated || 0} icon={Target} />
              <StatCard title="My Sales" value={myPoints?.sales_generated || 0} icon={TrendingUp} />
            </div>
            {getMyBadges().length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {getMyBadges().map((b) => (
                  <span key={b.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    🏅 {b.badge_label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {canManage && (
          <TabsContent value="settings">
            <GlobalSettingsTab settings={settings} onSave={saveSettings} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
