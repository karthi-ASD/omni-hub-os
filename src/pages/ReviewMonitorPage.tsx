import { useReviewMonitor } from "@/hooks/useReviewMonitor";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Star, StarHalf, MessageSquare, Settings, TrendingUp, Send,
  Clock, CheckCircle2, AlertTriangle, BarChart3, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

const ReviewMonitorPage = () => {
  usePageTitle("Review Monitor");
  const {
    reviews, requests, settings, loading, stats,
    upsertSettings, sendManualRequest,
  } = useReviewMonitor();

  const [settingsForm, setSettingsForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // Initialize form when settings load
  const form = {
    is_enabled: settingsForm.is_enabled ?? settings?.is_enabled ?? true,
    delay_hours: settingsForm.delay_hours ?? settings?.delay_hours ?? 2,
    channel: settingsForm.channel ?? settings?.channel ?? "sms",
    message_template: settingsForm.message_template ?? settings?.message_template ?? "",
    review_link: settingsForm.review_link ?? settings?.review_link ?? "",
    min_job_value: settingsForm.min_job_value ?? settings?.min_job_value ?? 0,
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    await upsertSettings(form);
    setSettingsForm({});
    setSaving(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review Monitor</h1>
        <p className="text-muted-foreground">
          Track Google Business Profile reviews & automate review requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Star className="h-4 w-4" /> Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{stats.avgRating.toFixed(1)}</span>
              <div className="flex">{renderStars(Math.round(stats.avgRating))}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-4 w-4" /> Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{stats.totalReviews}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Send className="h-4 w-4" /> Requests Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{requests.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> Auto-Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">
              {requests.filter(r => r.auto_sent).length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Rating Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.ratingDistribution.map(({ star, count }) => {
              const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-12 flex items-center gap-1">
                    {star} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </span>
                  <Progress value={pct} className="flex-1 h-3" />
                  <span className="text-sm text-muted-foreground w-10 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews">
            <Star className="h-4 w-4 mr-1" /> Reviews
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Send className="h-4 w-4 mr-1" /> Review Requests
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1" /> Automation Settings
          </TabsTrigger>
        </TabsList>

        {/* Reviews Tab */}
        <TabsContent value="reviews">
          <Card>
            <CardContent className="p-0">
              {reviews.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No reviews yet</p>
                  <p className="text-sm">Reviews from Google Business Profile will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                            {(review.reviewer_name || "?")[0]}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{review.reviewer_name || "Anonymous"}</p>
                            {review.review_time && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(review.review_time), "dd MMM yyyy")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex">{renderStars(review.rating)}</div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-foreground/80 pl-10">{review.comment}</p>
                      )}
                      {review.reply_text && (
                        <div className="pl-10 mt-1 border-l-2 border-primary/20 pl-3">
                          <p className="text-xs text-muted-foreground mb-0.5">Your reply</p>
                          <p className="text-sm">{review.reply_text}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Auto</TableHead>
                    <TableHead>Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No review requests yet
                      </TableCell>
                    </TableRow>
                  ) : requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        {(req as any).tenant_customers?.name || "—"}
                      </TableCell>
                      <TableCell>{(req as any).jobs?.job_title || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{req.channel || "sms"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={req.status === "sent" ? "default" : req.status === "clicked" ? "secondary" : "outline"}>
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {req.auto_sent ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <span className="text-xs text-muted-foreground">Manual</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(req.sent_at), "dd MMM yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Automated Review Requests</CardTitle>
              <p className="text-sm text-muted-foreground">
                Automatically send review requests to customers after job completion
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Enable Auto-Send</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically request reviews when jobs are completed
                  </p>
                </div>
                <Switch
                  checked={form.is_enabled}
                  onCheckedChange={(v) => setSettingsForm({ ...settingsForm, is_enabled: v })}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Google Review Link</Label>
                  <Input
                    placeholder="https://g.page/r/your-business/review"
                    value={form.review_link}
                    onChange={(e) => setSettingsForm({ ...settingsForm, review_link: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your Google Business Profile review link
                  </p>
                </div>

                <div>
                  <Label>Send Channel</Label>
                  <Select
                    value={form.channel}
                    onValueChange={(v) => setSettingsForm({ ...settingsForm, channel: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Delay After Completion (hours)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.delay_hours}
                    onChange={(e) => setSettingsForm({ ...settingsForm, delay_hours: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <Label>Minimum Job Value ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.min_job_value}
                    onChange={(e) => setSettingsForm({ ...settingsForm, min_job_value: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Only request reviews for jobs above this value (0 = all)
                  </p>
                </div>
              </div>

              <div>
                <Label>Message Template</Label>
                <Textarea
                  rows={3}
                  placeholder="Hi {customer_name}, thank you for choosing us!..."
                  value={form.message_template}
                  onChange={(e) => setSettingsForm({ ...settingsForm, message_template: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Variables: {"{customer_name}"}, {"{review_link}"}, {"{job_title}"}
                </p>
              </div>

              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReviewMonitorPage;
