import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Briefcase, CalendarDays, Clock, CheckCircle2, MapPin, Navigation,
  DollarSign, User, Phone, ArrowRight, AlertTriangle, Wrench,
  Bell, ChevronRight, Loader2,
} from "lucide-react";
import { format, isToday, isTomorrow, startOfDay, addDays } from "date-fns";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "secondary",
  assigned: "outline",
  in_progress: "default",
  completed: "default",
  cancelled: "destructive",
};

const paymentColors: Record<string, string> = {
  unpaid: "destructive",
  partial: "secondary",
  paid: "default",
  invoiced: "outline",
};

const StaffMobileAppPage = () => {
  usePageTitle("My Jobs");
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [completing, setCompleting] = useState(false);

  const businessId = profile?.business_id;

  const fetchJobs = useCallback(async () => {
    if (!user || !businessId) return;

    // Get jobs assigned to current user
    const { data: assignments } = await supabase
      .from("job_assignments")
      .select("job_id, status")
      .eq("assigned_employee_user_id", user.id);

    if (!assignments || assignments.length === 0) {
      setJobs([]);
      setLoading(false);
      return;
    }

    const jobIds = assignments.map((a: any) => a.job_id);

    const { data } = await supabase
      .from("jobs")
      .select("*, tenant_customers(name, phone, email)")
      .in("id", jobIds)
      .eq("business_id", businessId)
      .order("scheduled_start_at", { ascending: true });

    setJobs(data ?? []);
    setLoading(false);
  }, [user, businessId]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Register push token on mount
  useEffect(() => {
    const registerPushToken = async () => {
      if (!user || !businessId) return;
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
    };
    registerPushToken();
  }, [user, businessId]);

  const todayJobs = jobs.filter((j) =>
    j.scheduled_start_at && isToday(new Date(j.scheduled_start_at)) && j.status !== "completed" && j.status !== "cancelled"
  );

  const tomorrowJobs = jobs.filter((j) =>
    j.scheduled_start_at && isTomorrow(new Date(j.scheduled_start_at)) && j.status !== "completed" && j.status !== "cancelled"
  );

  const upcomingJobs = jobs.filter((j) => {
    if (!j.scheduled_start_at) return false;
    const d = new Date(j.scheduled_start_at);
    return d > addDays(startOfDay(new Date()), 2) && j.status !== "completed" && j.status !== "cancelled";
  });

  const completedJobs = jobs.filter((j) => j.status === "completed");

  const completeJob = async () => {
    if (!selectedJob) return;
    setCompleting(true);
    try {
      await supabase.from("jobs").update({
        status: "completed",
        completed_at: new Date().toISOString(),
      } as any).eq("id", selectedJob.id);

      await supabase.from("job_assignments").update({
        status: "completed",
      } as any).eq("job_id", selectedJob.id).eq("assigned_employee_user_id", user!.id);

      // Notify job creator
      if (selectedJob.created_by_user_id) {
        await supabase.from("notifications").insert([{
          business_id: businessId,
          user_id: selectedJob.created_by_user_id,
          type: "info",
          title: "Job Completed",
          message: `${profile?.full_name} completed "${selectedJob.job_title}"`,
        }] as any);
      }

      toast.success("Job marked as completed!");
      setSelectedJob(null);
      setCompletionNotes("");
      fetchJobs();
    } catch (e) {
      toast.error("Failed to complete job");
    } finally {
      setCompleting(false);
    }
  };

  const openNavigation = (job: any) => {
    const address = (job as any).job_address;
    const lat = (job as any).job_lat;
    const lng = (job as any).job_lng;

    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
    } else if (address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, "_blank");
    } else {
      toast.error("No address available for navigation");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-foreground">My Jobs</h1>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">My Jobs</h1>
          <p className="text-xs text-muted-foreground">
            {todayJobs.length} today · {tomorrowJobs.length} tomorrow
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Today", value: todayJobs.length, icon: CalendarDays, color: "text-primary" },
          { label: "Tomorrow", value: tomorrowJobs.length, icon: Clock, color: "text-accent-foreground" },
          { label: "Done", value: completedJobs.length, icon: CheckCircle2, color: "text-primary" },
          { label: "Total", value: jobs.length, icon: Briefcase, color: "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-2 text-center">
              <s.icon className={`h-4 w-4 mx-auto ${s.color}`} />
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="today">
        <TabsList className="w-full grid grid-cols-4 h-9">
          <TabsTrigger value="today" className="text-xs">Today</TabsTrigger>
          <TabsTrigger value="tomorrow" className="text-xs">Tomorrow</TabsTrigger>
          <TabsTrigger value="upcoming" className="text-xs">Upcoming</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">Done</TabsTrigger>
        </TabsList>

        {[
          { key: "today", data: todayJobs, empty: "No jobs scheduled for today" },
          { key: "tomorrow", data: tomorrowJobs, empty: "No jobs scheduled for tomorrow" },
          { key: "upcoming", data: upcomingJobs, empty: "No upcoming jobs" },
          { key: "completed", data: completedJobs.slice(0, 20), empty: "No completed jobs yet" },
        ].map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="mt-3">
            {tab.data.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  {tab.empty}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {tab.data.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onSelect={() => setSelectedJob(job)}
                    onNavigate={() => openNavigation(job)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={(o) => !o && setSelectedJob(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedJob?.job_title}</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              {selectedJob.description && (
                <p className="text-sm text-muted-foreground">{selectedJob.description}</p>
              )}

              <div className="space-y-2 text-sm">
                {selectedJob.scheduled_start_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>{format(new Date(selectedJob.scheduled_start_at), "EEEE, dd MMM yyyy 'at' h:mm a")}</span>
                  </div>
                )}
                {selectedJob.scheduled_end_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>Ends: {format(new Date(selectedJob.scheduled_end_at), "h:mm a")}</span>
                  </div>
                )}
                {(selectedJob as any).job_address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{(selectedJob as any).job_address}</span>
                  </div>
                )}
                {selectedJob.tenant_customers && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4 shrink-0" />
                    <span>{selectedJob.tenant_customers.name}</span>
                  </div>
                )}
                {selectedJob.tenant_customers?.phone && (
                  <a href={`tel:${selectedJob.tenant_customers.phone}`} className="flex items-center gap-2 text-primary">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{selectedJob.tenant_customers.phone}</span>
                  </a>
                )}
              </div>

              {/* Payment Status */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  {(selectedJob as any).payment_amount > 0 && (
                    <span className="text-sm font-medium">${(selectedJob as any).payment_amount}</span>
                  )}
                  <Badge variant={(paymentColors[(selectedJob as any).payment_status] || "secondary") as any}>
                    {(selectedJob as any).payment_status || "unpaid"}
                  </Badge>
                </div>
              </div>

              {/* Customer Confirmation */}
              {(selectedJob as any).customer_confirmation_status && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Customer</span>
                  <Badge variant={
                    (selectedJob as any).customer_confirmation_status === "confirmed" ? "default" :
                    (selectedJob as any).customer_confirmation_status === "reschedule_requested" ? "destructive" : "outline"
                  }>
                    {(selectedJob as any).customer_confirmation_status}
                  </Badge>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedJob(null);
                    openNavigation(selectedJob);
                  }}
                >
                  <Navigation className="h-4 w-4 mr-1" /> Navigate
                </Button>
                {selectedJob.status !== "completed" && (
                  <Button className="flex-1" onClick={completeJob} disabled={completing}>
                    {completing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                    Complete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function JobCard({
  job,
  onSelect,
  onNavigate,
}: {
  job: any;
  onSelect: () => void;
  onNavigate: () => void;
}) {
  const confirmStatus = (job as any).customer_confirmation_status;

  return (
    <Card
      className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Badge variant={(statusColors[job.status] || "secondary") as any} className="text-[10px] px-1.5 py-0">
                {job.status}
              </Badge>
              {confirmStatus === "reschedule_requested" && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Reschedule
                </Badge>
              )}
              {confirmStatus === "confirmed" && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Confirmed
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium text-foreground truncate">{job.job_title}</p>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
              {job.scheduled_start_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(job.scheduled_start_at), "h:mm a")}
                </span>
              )}
              {job.tenant_customers?.name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {job.tenant_customers.name}
                </span>
              )}
            </div>
            {(job as any).job_address && (
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {(job as any).job_address}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={(paymentColors[(job as any).payment_status] || "secondary") as any} className="text-[9px]">
              <DollarSign className="h-2.5 w-2.5" />{(job as any).payment_status || "unpaid"}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onNavigate(); }}
            >
              <Navigation className="h-3.5 w-3.5 text-primary" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StaffMobileAppPage;
