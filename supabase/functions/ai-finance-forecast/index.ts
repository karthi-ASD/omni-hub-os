import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Authenticate
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: authError } = await supabase.auth.getClaims(token);
  if (authError || !claims?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  try {
    const { business_id } = await req.json();
    if (!business_id) throw new Error("business_id required");

    // Gather historical data
    const [invoicesR, schedulesR, expensesR] = await Promise.all([
      supabase.from("xero_invoices").select("invoice_date, total_amount, status, department_category, contact_name").eq("business_id", business_id).eq("status", "PAID").order("invoice_date", { ascending: true }).limit(500),
      supabase.from("client_billing_schedules").select("service_type, monthly_fee, billing_cycle, is_active").eq("business_id", business_id).eq("is_active", true),
      supabase.from("agency_expenses").select("expense_date, amount, category, department").eq("business_id", business_id).order("expense_date", { ascending: true }).limit(300),
    ]);

    const invoices = invoicesR.data || [];
    const schedules = schedulesR.data || [];
    const expenses = expensesR.data || [];

    // Compute monthly revenue
    const monthlyRev: Record<string, number> = {};
    invoices.forEach((inv: any) => {
      if (inv.invoice_date) {
        const key = inv.invoice_date.substring(0, 7);
        monthlyRev[key] = (monthlyRev[key] || 0) + Number(inv.total_amount);
      }
    });

    // Compute MRR from schedules
    let mrr = 0;
    schedules.forEach((s: any) => {
      const fee = Number(s.monthly_fee);
      if (s.billing_cycle === "yearly") mrr += fee / 12;
      else if (s.billing_cycle === "quarterly") mrr += fee / 3;
      else mrr += fee;
    });

    // Department breakdown
    const deptRev: Record<string, number> = {};
    invoices.forEach((inv: any) => {
      const dept = inv.department_category || "Unassigned";
      deptRev[dept] = (deptRev[dept] || 0) + Number(inv.total_amount);
    });

    // Unique clients count over time
    const clientSet = new Set(invoices.map((i: any) => i.contact_name).filter(Boolean));

    // Monthly expenses
    const monthlyExp: Record<string, number> = {};
    expenses.forEach((e: any) => {
      const key = e.expense_date.substring(0, 7);
      monthlyExp[key] = (monthlyExp[key] || 0) + Number(e.amount);
    });

    // Build prompt for AI
    const months = Object.entries(monthlyRev).sort(([a], [b]) => a.localeCompare(b));
    const historyText = months.map(([m, r]) => `${m}: $${r.toFixed(0)}`).join("\n");
    const expenseText = Object.entries(monthlyExp).sort(([a], [b]) => a.localeCompare(b)).map(([m, a]) => `${m}: $${a.toFixed(0)}`).join("\n");
    const deptText = Object.entries(deptRev).map(([d, r]) => `${d}: $${r.toFixed(0)}`).join("\n");

    const prompt = `You are a financial analyst for a digital agency. Analyze the data below and provide forecasts.

MONTHLY REVENUE HISTORY:
${historyText || "No data yet"}

MONTHLY EXPENSES:
${expenseText || "No data yet"}

CURRENT MRR: $${mrr.toFixed(0)}
TOTAL ACTIVE CLIENTS: ${clientSet.size}

REVENUE BY DEPARTMENT:
${deptText || "No data yet"}

Provide a JSON response with this exact structure (numbers only, no currency symbols in values):
{
  "forecast_3m": <number>,
  "forecast_6m": <number>,
  "forecast_12m": <number>,
  "projected_mrr_3m": <number>,
  "projected_client_count_3m": <number>,
  "department_forecasts": { "<dept>": <number_3m_forecast> },
  "growth_trend": "increasing" | "stable" | "declining",
  "risk_factors": ["<string>"],
  "opportunities": ["<string>"],
  "confidence_score": <0-100>
}

Only return valid JSON, no markdown or explanation.`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    const aiData = await aiRes.json();
    let forecastText = aiData.choices?.[0]?.message?.content || "{}";
    // Strip markdown code fences if present
    forecastText = forecastText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let forecast;
    try {
      forecast = JSON.parse(forecastText);
    } catch {
      forecast = { error: "Failed to parse AI response", raw: forecastText };
    }

    // Store forecast snapshot
    await supabase.from("forecast_snapshots").insert({
      business_id,
      snapshot_date: new Date().toISOString().split("T")[0],
      forecast_json: forecast,
      model_used: "gemini-2.5-flash",
      confidence: forecast.confidence_score || null,
    });

    return new Response(JSON.stringify({ success: true, forecast }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-finance-forecast error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
