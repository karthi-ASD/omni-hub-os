import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CalendarCheck, CalendarClock, CheckCircle2, Clock, User, Wrench, MapPin, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pending: { label: "Awaiting Confirmation", variant: "outline", icon: Clock },
  confirmed: { label: "Confirmed", variant: "default", icon: CheckCircle2 },
  reschedule_requested: { label: "Reschedule Requested", variant: "secondary", icon: CalendarClock },
  rescheduled: { label: "Rescheduled", variant: "default", icon: CalendarCheck },
};

const CustomerAppointmentPage = () => {
  usePageTitle("My Appointments");
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleJob, setRescheduleJob] = useState<any>(null);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const businessId = profile?.business_id;

  const fetchJobs = useCallback(async () => {
    if (!businessId) return;
    // Get client_id for current user
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("business_id", businessId)
      .eq("email", profile?.email)
      .maybeSingle();

    if (!client) {
      // Try tenant_customers
      const { data: tc } = await supabase
        .from("tenant_customers")
        .select("id")
        .eq("business_id", businessId)
        .eq("email", profile?.email)
        .maybeSingle();

      if (tc) {
        const { data } = await supabase
          .from("jobs")
          .select("*")
          .eq("business_id", businessId)
          .eq("tenant_customer_id", tc.id)
          .order("scheduled_start_at", { ascending: true });
        setJobs(data ?? []);
      }
    } else {
      // Fallback: get jobs via tenant_customers linked to client
      const { data: tcs } = await supabase
        .from("tenant_customers")
        .select("id")
        .eq("business_id", businessId);

      if (tcs && tcs.length > 0) {
        const { data } = await supabase
          .from("jobs")
          .select("*")
          .eq("business_id", businessId)
          .in("tenant_customer_id", tcs.map((t: any) => t.id))
          .order("scheduled_start_at", { ascending: true });
        setJobs(data ?? []);
      }
    }
    setLoading(false);
  }, [businessId, profile?.email]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const confirmAppointment = async (jobId: string) => {
    await supabase.from("jobs").update({
      customer_confirmation_status: "confirmed",
    } as any).eq("id", jobId);

    // Notify assigned employees
    const { data: assignments } = await supabase
      .from("job_assignments")
      .select("assigned_employee_user_id")
      .eq("job_id", jobId);

    if (assignments) {
      const notifications = assignments.map((a: any) => ({
        business_id: businessId!,
        user_id: a.assigned_employee_user_id,
        type: "info" as const,
        title: "Appointment Confirmed",
        message: `Customer has confirmed their appointment.`,
      }));
      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications as any);
      }
    }

    toast.success("Appointment confirmed!");
    fetchJobs();
  };

  const submitReschedule = async () => {
    if (!rescheduleJob || !rescheduleReason.trim()) {
      toast.error("Please provide a reason for rescheduling");
      return;
    }

    await supabase.from("jobs").update({
      customer_confirmation_status: "reschedule_requested",
      customer_reschedule_request: rescheduleReason,
      rescheduled_time: rescheduleTime || null,
    } as any).eq("id", rescheduleJob.id);

    // Notify assigned employees
    const { data: assignments } = await supabase
      .from("job_assignments")
      .select("assigned_employee_user_id")
      .eq("job_id", rescheduleJob.id);

    if (assignments) {
      const notifications = assignments.map((a: any) => ({
        business_id: businessId!,
        user_id: a.assigned_employee_user_id,
        type: "warning" as const,
        title: "Reschedule Requested",
        message: `Customer requested to reschedule: "${rescheduleReason}"`,
      }));
      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications as any);
      }
    }

    // Also notify the job creator
    if (rescheduleJob.created_by_user_id) {
      await supabase.from("notifications").insert([{
        business_id: businessId!,
        user_id: rescheduleJob.created_by_user_id,
        type: "warning",
        title: "Reschedule Requested",
        message: `Customer requested to reschedule job "${rescheduleJob.job_title}": "${rescheduleReason}"`,
      }] as any);
    }

    toast.success("Reschedule request submitted");
    setRescheduleJob(null);
    setRescheduleReason("");
    setRescheduleTime("");
    fetchJobs();
  };

  const getAssignedTechnician = (job: any) => {
    // We'll load this separately
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
      </div>
    );
  }

  const upcoming = jobs.filter((j) => j.status !== "completed" && j.status !== "cancelled");
  const past = jobs.filter((j) => j.status === "completed" || j.status === "cancelled");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
        <p className="text-muted-foreground text-sm">View and manage your upcoming service appointments</p>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No appointments found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Upcoming</h2>
              {upcoming.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  businessId={businessId!}
                  onConfirm={confirmAppointment}
                  onReschedule={(j) => {
                    setRescheduleJob(j);
                    setRescheduleReason("");
                    setRescheduleTime("");
                  }}
                />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-muted-foreground">Past</h2>
              {past.map((job) => (
                <JobCard key={job.id} job={job} businessId={businessId!} isPast />
              ))}
            </div>
          )}
        </>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleJob} onOpenChange={(o) => !o && setRescheduleJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Reschedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Job: <span className="font-medium text-foreground">{rescheduleJob?.job_title}</span>
            </p>
            <div>
              <Label>Reason for reschedule *</Label>
              <Textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="e.g., I have a conflict at that time…"
                rows={3}
              />
            </div>
            <div>
              <Label>Preferred new time (optional)</Label>
              <Input
                type="datetime-local"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRescheduleJob(null)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={submitReschedule}>
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function JobCard({
  job,
  businessId,
  onConfirm,
  onReschedule,
  isPast,
}: {
  job: any;
  businessId: string;
  onConfirm?: (id: string) => void;
  onReschedule?: (job: any) => void;
  isPast?: boolean;
}) {
  const [technician, setTechnician] = useState<string | null>(null);

  useEffect(() => {
    const loadTech = async () => {
      const { data } = await supabase
        .from("job_assignments")
        .select("assigned_employee_user_id")
        .eq("job_id", job.id)
        .eq("status", "accepted")
        .limit(1)
        .maybeSingle();

      if (data?.assigned_employee_user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", data.assigned_employee_user_id)
          .maybeSingle();
        setTechnician(profile?.full_name || "Assigned");
      }
    };
    loadTech();
  }, [job.id]);

  const confirmStatus = (job as any).customer_confirmation_status || "pending";
  const config = statusConfig[confirmStatus] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <Card className={isPast ? "opacity-60" : ""}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{job.job_title}</h3>
            {job.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{job.description}</p>
            )}
          </div>
          <Badge variant={config.variant} className="flex items-center gap-1 shrink-0">
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {job.scheduled_start_at && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{format(new Date(job.scheduled_start_at), "dd MMM yyyy, h:mm a")}</span>
            </div>
          )}
          {(job as any).rescheduled_time && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-4 w-4 shrink-0 text-destructive" />
              <span>Requested: {format(new Date((job as any).rescheduled_time), "dd MMM yyyy, h:mm a")}</span>
            </div>
          )}
          {technician && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wrench className="h-4 w-4 shrink-0" />
              <span>{technician}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Badge variant={job.status === "in_progress" ? "default" : "secondary"} className="text-xs">
              {job.status}
            </Badge>
          </div>
        </div>

        {(job as any).customer_reschedule_request && confirmStatus === "reschedule_requested" && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Your reschedule request</p>
              <p className="text-muted-foreground">{(job as any).customer_reschedule_request}</p>
            </div>
          </div>
        )}

        {!isPast && confirmStatus === "pending" && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1" onClick={() => onConfirm?.(job.id)}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Confirm
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onReschedule?.(job)}>
              <CalendarClock className="h-4 w-4 mr-1" /> Reschedule
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CustomerAppointmentPage;
