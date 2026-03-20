import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Safely extract numeric kW from strings like "6.6kW", "10 kW", "13.2kW Solar System" */
function parseSystemSizeKw(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const match = raw.replace(/,/g, "").match(/([\d.]+)\s*k?w?/i);
  return match ? parseFloat(match[1]) || null : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposal_id } = await req.json();
    if (!proposal_id) {
      return new Response(JSON.stringify({ error: "proposal_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for atomic server-side operation
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get caller from JWT
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch proposal
    const { data: proposal, error: pErr } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposal_id)
      .maybeSingle();

    if (pErr || !proposal) {
      return new Response(
        JSON.stringify({ error: "Proposal not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const businessId = proposal.business_id;

    // Get user profile for business_id verification
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || profile.business_id !== businessId) {
      return new Response(
        JSON.stringify({ error: "Tenant mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. IDEMPOTENCY: If already accepted, return existing linked records
    if (proposal.status === "accepted") {
      // Find existing project
      const { data: existingProject } = await supabase
        .from("projects")
        .select("id, project_name")
        .eq("business_id", businessId)
        .eq("proposal_id", proposal_id)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          already_approved: true,
          message: "Proposal already approved. Existing client/project linked.",
          project: existingProject || null,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Mark proposal as accepted
    const { error: updateErr } = await supabase
      .from("proposals")
      .update({ status: "accepted", approved_at: new Date().toISOString() })
      .eq("id", proposal_id);

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: "Failed to update proposal" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const auditLogs: any[] = [];
    auditLogs.push({
      business_id: businessId,
      actor_user_id: user.id,
      action_type: "PROPOSAL_ACCEPTED",
      entity_type: "proposal",
      entity_id: proposal_id,
      new_value_json: { proposal_title: proposal.title },
    });

    let leadData: any = null;
    if (proposal.lead_id) {
      // Update lead stage to "won"
      await supabase.from("leads").update({ stage: "won" }).eq("id", proposal.lead_id);

      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("id", proposal.lead_id)
        .maybeSingle();
      leadData = data;
    }

    // 4. FIND OR CREATE CLIENT (dedup by email/phone)
    let clientId: string | null = null;
    let clientCreated = false;

    const clientEmail = proposal.client_email || leadData?.email || null;
    const clientPhone = proposal.client_phone || leadData?.phone || null;
    const clientName = proposal.client_name || leadData?.name || null;

    // Search for existing client
    if (clientEmail) {
      const { data: byEmail } = await supabase
        .from("clients")
        .select("id")
        .eq("business_id", businessId)
        .ilike("email", clientEmail.trim())
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();
      if (byEmail) clientId = byEmail.id;
    }

    if (!clientId && clientPhone) {
      const normPhone = clientPhone.replace(/[^0-9]/g, "");
      if (normPhone.length >= 8) {
        const { data: byPhone } = await supabase
          .from("clients")
          .select("id, phone, mobile")
          .eq("business_id", businessId)
          .is("deleted_at", null);
        if (byPhone) {
          const match = byPhone.find((c: any) => {
            const cp = (c.phone || "").replace(/[^0-9]/g, "");
            const cm = (c.mobile || "").replace(/[^0-9]/g, "");
            const suffix = normPhone.slice(-9);
            return cp.endsWith(suffix) || cm.endsWith(suffix);
          });
          if (match) clientId = match.id;
        }
      }
    }

    if (!clientId && clientName) {
      // Create new client
      const insertPayload: any = {
        business_id: businessId,
        contact_name: clientName,
        email: clientEmail || null,
        phone: clientPhone || null,
        mobile: clientPhone || null,
        city: leadData?.suburb || leadData?.city || null,
        lead_source: leadData?.source || "crm",
        onboarding_status: "pending",
      };

      // Only set company_name if lead has a business name; otherwise leave null
      if (leadData?.business_name) {
        insertPayload.company_name = leadData.business_name;
      }

      const { data: newClient, error: cErr } = await supabase
        .from("clients")
        .insert(insertPayload)
        .select("id")
        .maybeSingle();

      if (!cErr && newClient) {
        clientId = newClient.id;
        clientCreated = true;
        auditLogs.push({
          business_id: businessId,
          actor_user_id: user.id,
          action_type: "CLIENT_CREATED",
          entity_type: "client",
          entity_id: clientId,
          new_value_json: { from_proposal: proposal_id, name: clientName },
        });
      }
    }

    if (clientId && !clientCreated) {
      auditLogs.push({
        business_id: businessId,
        actor_user_id: user.id,
        action_type: "CLIENT_LINKED",
        entity_type: "client",
        entity_id: clientId,
        new_value_json: { from_proposal: proposal_id, reused: true },
      });
    }

    // 5. FIND OR CREATE PROJECT (dedup by proposal_id or lead_id)
    let projectId: string | null = null;
    let projectName: string | null = null;
    let projectCreated = false;

    // Check by proposal_id first
    const { data: existingByProposal } = await supabase
      .from("projects")
      .select("id, project_name")
      .eq("business_id", businessId)
      .eq("proposal_id", proposal_id)
      .maybeSingle();

    if (existingByProposal) {
      projectId = existingByProposal.id;
      projectName = existingByProposal.project_name;
    }

    // Check by lead_id
    if (!projectId && proposal.lead_id) {
      const { data: existingByLead } = await supabase
        .from("projects")
        .select("id, project_name")
        .eq("business_id", businessId)
        .eq("lead_id", proposal.lead_id)
        .maybeSingle();

      if (existingByLead) {
        projectId = existingByLead.id;
        projectName = existingByLead.project_name;
        // Link proposal_id to existing project
        await supabase
          .from("projects")
          .update({ proposal_id: proposal_id })
          .eq("id", projectId);
      }
    }

    if (!projectId) {
      // Create new project
      const systemKw = parseSystemSizeKw(proposal.system_size);
      projectName = `${clientName || "Solar"} - ${proposal.system_size || "System"}`;

      const { data: newProject, error: prjErr } = await supabase
        .from("projects")
        .insert({
          business_id: businessId,
          lead_id: proposal.lead_id || null,
          client_id: clientId,
          deal_id: null,
          proposal_id: proposal_id,
          project_name: projectName,
          project_type: "solar_installation",
          pipeline_stage: "new_project",
          status: "new",
          system_size_kw: systemKw,
          estimated_value: proposal.total_amount || null,
          priority: "medium",
          contact_name: clientName,
          contact_phone: clientPhone,
          contact_email: clientEmail,
          address: leadData?.suburb || leadData?.address || null,
          notes: proposal.proposal_notes || null,
          description: proposal.title || null,
          assigned_manager_user_id: user.id,
          start_date: new Date().toISOString().split("T")[0],
        })
        .select("id, project_name")
        .maybeSingle();

      if (!prjErr && newProject) {
        projectId = newProject.id;
        projectName = newProject.project_name;
        projectCreated = true;

        auditLogs.push({
          business_id: businessId,
          actor_user_id: user.id,
          action_type: "PROJECT_CREATED",
          entity_type: "project",
          entity_id: projectId,
          new_value_json: {
            from_proposal: proposal_id,
            project_name: projectName,
          },
        });

        // 6. Create onboarding reminders with entity_type = "project"
        const tasks = [
          { title: "Call client to confirm details", due_offset: 1 },
          { title: "Schedule site inspection", due_offset: 2 },
          { title: "Collect documentation (ID, bills)", due_offset: 3 },
          { title: "Prepare system design proposal", due_offset: 5 },
          { title: "Submit permit application", due_offset: 7 },
        ];

        const reminders = tasks.map((t) => ({
          business_id: businessId,
          entity_type: "project",
          entity_id: projectId,
          assigned_to_user_id: user.id,
          title: `[${projectName}] ${t.title}`,
          due_at: new Date(
            Date.now() + t.due_offset * 86400000
          ).toISOString(),
          created_by_user_id: user.id,
          priority: "medium",
        }));

        await supabase.from("reminders").insert(reminders);

        auditLogs.push({
          business_id: businessId,
          actor_user_id: user.id,
          action_type: "TASKS_CREATED",
          entity_type: "project",
          entity_id: projectId,
          new_value_json: { task_count: tasks.length },
        });
      }
    } else {
      auditLogs.push({
        business_id: businessId,
        actor_user_id: user.id,
        action_type: "PROJECT_LINKED",
        entity_type: "project",
        entity_id: projectId,
        new_value_json: { from_proposal: proposal_id, reused: true },
      });
    }

    // 7. System event
    await supabase.from("system_events").insert({
      business_id: businessId,
      event_type: "PROPOSAL_APPROVED_FLOW",
      payload_json: {
        proposal_id,
        client_id: clientId,
        client_created: clientCreated,
        project_id: projectId,
        project_created: projectCreated,
        actor_user_id: user.id,
      },
    });

    // 8. Write all audit logs
    if (auditLogs.length > 0) {
      await supabase.from("audit_logs").insert(auditLogs);
    }

    return new Response(
      JSON.stringify({
        success: true,
        client_id: clientId,
        client_created: clientCreated,
        project_id: projectId,
        project_name: projectName,
        project_created: projectCreated,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("approve-proposal error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
