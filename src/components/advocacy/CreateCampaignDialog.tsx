import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CampaignPreview } from "./CampaignPreview";
import { Plus, Megaphone } from "lucide-react";
import type { AdvocacyCampaign } from "@/hooks/useAdvocacy";

const CATEGORIES = ["Event Promotion", "Coupon Promotion", "Product Launch", "Special Offer", "Referral Campaign"];
const CAMPAIGN_TYPES = [
  { value: "employee_advocacy", label: "Employee Advocacy" },
  { value: "client_referral", label: "Client Referral" },
];
const VISIBILITY_OPTIONS = [
  { value: "all_employees", label: "All Employees" },
  { value: "specific_department", label: "Specific Department" },
  { value: "client_portal", label: "Client Portal Users" },
  { value: "mobile_app", label: "Mobile App Users" },
];
const REWARD_TYPES = [
  { value: "points", label: "Points" },
  { value: "cash_bonus", label: "Cash Bonus" },
  { value: "coupon", label: "Coupon" },
  { value: "gift", label: "Gift" },
];
const REWARD_TRIGGERS = [
  { value: "share", label: "On Share" },
  { value: "click", label: "On Click" },
  { value: "lead", label: "On Lead Generated" },
  { value: "sale", label: "On Sale Generated" },
];

interface Props {
  onCreate: (data: Partial<AdvocacyCampaign>) => Promise<void>;
}

export function CreateCampaignDialog({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Event Promotion");
  const [campaignType, setCampaignType] = useState("employee_advocacy");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [rewardsEnabled, setRewardsEnabled] = useState(true);
  const [shareTemplate, setShareTemplate] = useState("");
  const [visibilityType, setVisibilityType] = useState("all_employees");
  const [rewardType, setRewardType] = useState("points");
  const [rewardTrigger, setRewardTrigger] = useState("share");
  const [pointsPerShare, setPointsPerShare] = useState(5);
  const [pointsPerLead, setPointsPerLead] = useState(20);
  const [pointsPerSale, setPointsPerSale] = useState(100);

  const handleCreate = async () => {
    if (!title.trim()) return;
    await onCreate({
      title,
      description: description || null,
      category,
      campaign_type: campaignType,
      start_date: startDate,
      end_date: endDate || null,
      rewards_enabled: rewardsEnabled,
      share_message_template: shareTemplate || null,
      visibility_type: visibilityType,
      reward_type: rewardType,
      reward_trigger: rewardTrigger,
      points_per_share: pointsPerShare,
      points_per_lead: pointsPerLead,
      points_per_sale: pointsPerSale,
      status: "active",
    });
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory("Event Promotion");
    setCampaignType("employee_advocacy"); setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(""); setRewardsEnabled(true); setShareTemplate("");
    setVisibilityType("all_employees"); setRewardType("points"); setRewardTrigger("share");
    setPointsPerShare(5); setPointsPerLead(20); setPointsPerSale(100);
  };

  const previewLink = `${window.location.origin}/campaign/preview?ref=your_code`;

  return (
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
            <div><Label>Visibility</Label>
              <Select value={visibilityType} onValueChange={setVisibilityType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{VISIBILITY_OPTIONS.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Reward Type</Label>
              <Select value={rewardType} onValueChange={setRewardType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REWARD_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Reward Trigger</Label>
              <Select value={rewardTrigger} onValueChange={setRewardTrigger}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REWARD_TRIGGERS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div />
          </div>

          {rewardType === "points" && (
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Pts / Share</Label><Input type="number" value={pointsPerShare} onChange={(e) => setPointsPerShare(Number(e.target.value))} /></div>
              <div><Label>Pts / Lead</Label><Input type="number" value={pointsPerLead} onChange={(e) => setPointsPerLead(Number(e.target.value))} /></div>
              <div><Label>Pts / Sale</Label><Input type="number" value={pointsPerSale} onChange={(e) => setPointsPerSale(Number(e.target.value))} /></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><Label>End Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>

          <label className="flex items-center gap-2 text-sm"><Switch checked={rewardsEnabled} onCheckedChange={setRewardsEnabled} /> Enable Referral Rewards</label>

          <div><Label>Share Message Template</Label><Textarea value={shareTemplate} onChange={(e) => setShareTemplate(e.target.value)} placeholder="Use {referral_link} as placeholder..." rows={3} /></div>

          {title && (
            <CampaignPreview
              title={title}
              description={description}
              shareTemplate={shareTemplate}
              referralLink={previewLink}
            />
          )}

          <Button onClick={handleCreate} className="w-full gap-2" disabled={!title.trim()}>
            <Megaphone className="h-4 w-4" /> Launch Campaign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
