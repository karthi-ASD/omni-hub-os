import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { useAdvocacy } from "@/hooks/useAdvocacy";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import {
  Plus, Share2, Trophy, BarChart3, Megaphone, Copy, Trash2,
  Facebook, Linkedin, Twitter, MessageCircle, Link2, TrendingUp, Users, MousePointerClick, Target,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = ["Event Promotion", "Coupon Promotion", "Product Launch", "Special Offer", "Referral Campaign"];
const CAMPAIGN_TYPES = [
  { value: "employee_advocacy", label: "Employee Advocacy" },
  { value: "client_referral", label: "Client Referral" },
];

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  expired: "bg-muted text-muted-foreground",
  draft: "bg-warning/10 text-warning",
};

export default function AdvocacyEnginePage() {
  usePageTitle("Advocacy & Referral Engine", "Employee advocacy campaigns and referral tracking.");
  const { user, isSuperAdmin, isBusinessAdmin } = useAuth();
  const canManage = isSuperAdmin || isBusinessAdmin;
  const advocacy = useAdvocacy();
  const { campaigns, leaderboard, myPoints, loading, createCampaign, deleteCampaign, recordShare, getCampaignStats } = advocacy;

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Event Promotion");
  const [campaignType, setCampaignType] = useState("employee_advocacy");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [rewardsEnabled, setRewardsEnabled] = useState(true);
  const [shareTemplate, setShareTemplate] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createCampaign({
      title,
      description: description || null,
      category,
      campaign_type: campaignType,
      start_date: startDate,
      end_date: endDate || null,
      rewards_enabled: rewardsEnabled,
      share_message_template: shareTemplate || null,
      status: "active",
    });
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory("Event Promotion");
    setCampaignType("employee_advocacy"); setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(""); setRewardsEnabled(true); setShareTemplate("");
  };

  const handleShare = async (campaignId: string, platform: string, campaign: any) => {
    const refCode = await recordShare(campaignId, platform);
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

  // Aggregate stats
  const totalShares = advocacy.shares.length;
  const totalClicks = advocacy.referrals.length;
  const totalLeads = advocacy.referrals.filter((r) => r.lead_generated).length;
  const totalConversions = advocacy.referrals.filter((r) => r.sale_generated).length;
  const viralReach = totalShares * 500; // estimate

  if (loading) return <div className="p-6 space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advocacy & Referral Engine"
        subtitle="Empower employees and customers to share campaigns and generate referral leads."
        actions={
          canManage ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> New Campaign</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create Advocacy Campaign</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-2">
                  <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Campaign title" /></div>
                  <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Campaign details..." rows={3} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Campaign Type</Label>
                      <Select value={campaignType} onValueChange={setCampaignType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CAMPAIGN_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                    <div><Label>End Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
                  </div>
                  <label className="flex items-center gap-2 text-sm"><Switch checked={rewardsEnabled} onCheckedChange={setRewardsEnabled} /> Enable Referral Rewards</label>
                  <div><Label>Share Message Template</Label><Textarea value={shareTemplate} onChange={(e) => setShareTemplate(e.target.value)} placeholder="Use {referral_link} as placeholder..." rows={3} /></div>
                  <Button onClick={handleCreate} className="w-full gap-2" disabled={!title.trim()}>
                    <Megaphone className="h-4 w-4" /> Launch Campaign
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Active Campaigns" value={campaigns.filter((c) => c.status === "active").length} icon={<Megaphone className="h-5 w-5" />} />
        <StatCard title="Total Shares" value={totalShares} icon={<Share2 className="h-5 w-5" />} />
        <StatCard title="Total Clicks" value={totalClicks} icon={<MousePointerClick className="h-5 w-5" />} />
        <StatCard title="Leads Generated" value={totalLeads} icon={<Target className="h-5 w-5" />} />
        <StatCard title="Est. Viral Reach" value={viralReach.toLocaleString()} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-1"><Trophy className="h-3.5 w-3.5" /> Leaderboard</TabsTrigger>
          {canManage && <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="h-3.5 w-3.5" /> Analytics</TabsTrigger>}
          <TabsTrigger value="my-stats" className="gap-1"><Users className="h-3.5 w-3.5" /> My Stats</TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No campaigns yet.</p>}
            {campaigns.map((camp) => {
              const stats = getCampaignStats(camp.id);
              return (
                <Card key={camp.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge className={statusColors[camp.status] || ""}>{camp.status}</Badge>
                        <CardTitle className="text-base">{camp.title}</CardTitle>
                      </div>
                      <Badge variant="outline">{camp.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {camp.description && <p className="text-sm text-muted-foreground line-clamp-2">{camp.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{stats.shares} shares</span>
                      <span>{stats.clicks} clicks</span>
                      <span>{stats.leads} leads</span>
                      <span>{camp.start_date ? format(new Date(camp.start_date), "MMM d") : ""}</span>
                    </div>
                    {camp.status === "active" && (
                      <div className="flex gap-1 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => handleShare(camp.id, "whatsapp", camp)} title="WhatsApp">
                          <MessageCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleShare(camp.id, "facebook", camp)} title="Facebook">
                          <Facebook className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleShare(camp.id, "twitter", camp)} title="Twitter/X">
                          <Twitter className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleShare(camp.id, "linkedin", camp)} title="LinkedIn">
                          <Linkedin className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleShare(camp.id, "copy", camp)} title="Copy Link">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    {canManage && (
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteCampaign(camp.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="h-5 w-5 text-warning" /> Advocacy Leaderboard</CardTitle></CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No points earned yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((emp, i) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-bold">{i + 1}</TableCell>
                        <TableCell className="font-medium">{emp.full_name}</TableCell>
                        <TableCell className="text-right font-semibold">{emp.points_total}</TableCell>
                        <TableCell className="text-right">{emp.shares_count}</TableCell>
                        <TableCell className="text-right">{emp.leads_generated}</TableCell>
                        <TableCell className="text-right">{emp.sales_generated}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        {canManage && (
          <TabsContent value="analytics">
            <Card>
              <CardHeader><CardTitle className="text-base">Campaign Analytics</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((camp) => {
                      const stats = getCampaignStats(camp.id);
                      return (
                        <TableRow key={camp.id}>
                          <TableCell className="font-medium">{camp.title}</TableCell>
                          <TableCell><Badge className={statusColors[camp.status] || ""}>{camp.status}</Badge></TableCell>
                          <TableCell className="text-right">{stats.shares}</TableCell>
                          <TableCell className="text-right">{stats.clicks}</TableCell>
                          <TableCell className="text-right">{stats.leads}</TableCell>
                          <TableCell className="text-right">{stats.conversions}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* My Stats Tab */}
        <TabsContent value="my-stats">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard title="My Points" value={myPoints?.points_total || 0} icon={<Trophy className="h-5 w-5" />} />
            <StatCard title="My Shares" value={myPoints?.shares_count || 0} icon={<Share2 className="h-5 w-5" />} />
            <StatCard title="My Leads" value={myPoints?.leads_generated || 0} icon={<Target className="h-5 w-5" />} />
            <StatCard title="My Sales" value={myPoints?.sales_generated || 0} icon={<TrendingUp className="h-5 w-5" />} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
