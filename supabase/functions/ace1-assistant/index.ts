import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KNOWLEDGE_BASE = `
# ACE1 Command Centre — System Guide

You are the ACE1 Internal AI Assistant. You help ACE1 staff understand how to use the system. Answer questions based ONLY on the knowledge below. If a feature is not covered, use the fallback response.

## HOW TO ADD LEADS
1. Go to **Lead Engine** in the sidebar under "Lead Management".
2. Click the **"Add Lead"** button at the top right.
3. Fill in the required fields: Name, Email, Phone, Source, and any notes.
4. Select the lead stage (default is "New Lead").
5. Assign the lead to a team member using the "Assigned To" dropdown.
6. Click **Save** — the lead appears in your pipeline immediately.
- You can also add leads in bulk via the **Import** feature (CSV upload).
- The system performs automatic duplicate detection on email and phone before saving.

## HOW LEADS COME FROM META (FACEBOOK/INSTAGRAM)
1. Meta Lead Ads are connected via the **Lead Capture API**.
2. When someone fills a Facebook or Instagram lead form, it automatically pushes into ACE1.
3. Leads arrive in the **Lead Engine** with source tagged as "Facebook" or "Instagram".
4. The system auto-assigns based on round-robin or territory rules if configured.
5. You'll see a notification when new Meta leads arrive.
6. To check Meta lead status, filter leads by **Source = Facebook** or **Source = Instagram**.

## HOW TO ASSIGN LEADS
1. Open any lead from the **Lead Engine**.
2. Click the **"Assigned To"** dropdown field.
3. Select the team member you want to assign the lead to.
4. You can also bulk-assign by selecting multiple leads and using the **Bulk Actions** menu.
5. When a lead is assigned, the assignee gets a notification.
6. Managers can view assignment distribution in the **Executive Dashboard**.

## HOW TO MANAGE THE PIPELINE
1. Go to **Opportunities & Pipeline** in the sidebar.
2. The pipeline shows a Kanban board with stages: New Lead → Contacted → Qualified → Property Shared → Shortlisted → EOI Submitted → Deposit Pending → Finance in Progress → Contract Issued → Settlement → Closed.
3. Drag and drop cards between stages to update status.
4. Click on any card to see full deal details, notes, and activity history.
5. Use the **Table View** toggle for a spreadsheet-style view.
6. Filter by assignee, property type, or date range using the filter bar.

## HOW TO TRACK DEALS
1. Go to **Deal Management** in the sidebar under "Investor Relations".
2. Each deal shows its lifecycle: EOI → Deposit → Finance → Contract → Settlement.
3. Click on a deal to open the **Deal Detail Drawer** with 4 tabs:
   - **Lifecycle**: Track EOI status, deposit ($1,000 initial), finance window (2-4 weeks), legal, and settlement.
   - **Parties**: See assigned Broker, Lawyer, Accountant, and Developer.
   - **Property & Finance**: View linked property, commission, and risk rating.
   - **Notes & Activity**: Full timeline of all actions taken.
4. Use progress bars to quickly see where each deal stands.
5. Deals flagged as "Blocked" appear highlighted in red with the blocker reason.

## HOW TO INVITE CLIENTS TO THE PORTAL
1. Go to **Client Portal Management** in the sidebar under "Support & Insights".
2. Click **"Invite Client"**.
3. Enter the client's name and email address.
4. The system sends an invitation email with a secure login link.
5. The client can set their password and access their portal at portal.nextwebos.com/ace1/portal.
6. Clients can view: Dashboard, Enquiries, Properties, Deal Progress, Documents, and Messages.
7. You can manage client access and deactivate accounts from this same module.

## HOW TO ADD EMPLOYEES
1. Go to **HR & Team Management** in the sidebar under "Operations".
2. Click the **"Add Employee"** button.
3. Fill in: Full Name, Email, Phone, Role/Designation, Department, Employment Type, Gender, and Joining Date.
4. Click **Add Employee** to save.
5. The employee gets an employee code (e.g., EMP-0001) automatically.
6. To invite them to log in: The admin sends an invite from the employee's profile. The employee receives an email to set their password and can then log in at portal.nextwebos.com/ace1/login.
7. Manage attendance, leave, tasks, and performance from the HR module tabs.

## HOW TO RAISE SUPPORT TICKETS
1. Go to **Ticketing & Support** in the sidebar under "Support & Insights".
2. Click **"New Ticket"** or **"Raise Ticket"**.
3. Fill in: Subject, Description, Priority (Low/Medium/High/Urgent).
4. The ticket gets a reference number (NW-XXXX).
5. All tickets are initially unassigned and enter the support queue.
6. You can track ticket status: Open → In Progress → Resolved → Closed.
7. Add replies and attachments from the ticket detail view.
8. Clients can also raise tickets from their portal.

## PROPERTY INVENTORY
1. Go to **Property Inventory** under "Investor Relations".
2. Browse properties by type: Residential, Commercial, Industrial, Development, Off-market, Pre-market.
3. Each property shows ROI projections (1/3/5/10 year), availability, documents, and developer links.
4. Use card view or table view to browse.

## COMMUNICATION HUB
1. Go to **Communication Hub** under "Operations".
2. Manage all communications: Email, SMS, WhatsApp, and Webchat from one place.
3. View conversation threads and send messages directly.

## REPORTS & INSIGHTS
1. Go to **Reports & Insights** under "Support & Insights".
2. View business analytics, deal metrics, team performance, and pipeline reports.

## EXECUTIVE DASHBOARD
1. The **Executive Dashboard** is the first screen when you open ACE1 Command Centre.
2. It shows KPIs: Total leads, active deals, pipeline value, commissions, and team performance.

## FALLBACK
If a question is about a feature not described above, respond exactly with:
"This feature is not available yet. Would you like me to request NextWeb to enable it? Please ask your admin to raise a support request via Ticketing & Support."
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, history } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const chatMessages = [
      { role: "system", content: KNOWLEDGE_BASE },
      ...(history || []).slice(-10).map((h: any) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: chatMessages,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ace1-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
