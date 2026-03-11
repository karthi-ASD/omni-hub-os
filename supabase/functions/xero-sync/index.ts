import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_API_BASE = "https://api.xero.com/api.xro/2.0";

async function getAccessToken(supabase: any, conn: any) {
  let accessToken = conn.access_token_encrypted;

  if (conn.token_expires_at && new Date(conn.token_expires_at) <= new Date()) {
    const clientId = Deno.env.get("XERO_CLIENT_ID")!;
    const clientSecret = Deno.env.get("XERO_CLIENT_SECRET")!;

    const basicAuth = btoa(`${clientId}:${clientSecret}`);
    const refreshRes = await fetch(XERO_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: conn.refresh_token_encrypted,
      }),
    });
    const newTokens = await refreshRes.json();
    if (!refreshRes.ok) {
      await supabase.from("xero_connections").update({ is_connected: false }).eq("id", conn.id);
      throw new Error("Token refresh failed – reconnect Xero");
    }

    accessToken = newTokens.access_token;
    await supabase.from("xero_connections").update({
      access_token_encrypted: newTokens.access_token,
      refresh_token_encrypted: newTokens.refresh_token,
      token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
    }).eq("id", conn.id);
  }

  return accessToken;
}

function formatAddress(addr: any): string {
  return [addr.AddressLine1, addr.AddressLine2, addr.City, addr.Region, addr.PostalCode, addr.Country]
    .filter(Boolean).join(", ");
}

// Helper to get connection + headers
async function getConnectionAndHeaders(supabase: any, businessId: string) {
  const { data: conn } = await supabase
    .from("xero_connections").select("*")
    .eq("business_id", businessId)
    .eq("is_connected", true)
    .single();

  if (!conn) throw new Error("Xero not connected for this business");

  const accessToken = await getAccessToken(supabase, conn);

  let tenantId = conn.xero_tenant_id;
  if (!tenantId) {
    const connRes = await fetch("https://api.xero.com/connections", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const conns = await connRes.json();
    tenantId = conns?.[0]?.tenantId;
    if (!tenantId) throw new Error("Could not retrieve Xero tenant ID");
    await supabase.from("xero_connections").update({ xero_tenant_id: tenantId }).eq("id", conn.id);
  }

  return {
    conn,
    xeroHeaders: {
      Authorization: `Bearer ${accessToken}`,
      "Xero-Tenant-Id": tenantId,
      Accept: "application/json",
    },
  };
}

// Helper to write a sync log entry
async function writeSyncLog(supabase: any, businessId: string, syncType: string, status: string, recordsSynced: number, errorMessage: string | null) {
  await supabase.from("xero_sync_logs").insert({
    business_id: businessId,
    sync_type: syncType,
    status,
    records_synced: recordsSynced,
    error_message: errorMessage,
  });
  await supabase.from("xero_connections").update({
    last_sync_at: new Date().toISOString(),
  }).eq("business_id", businessId);
}

// ── SYNC CONTACTS ──
async function syncContacts(supabase: any, businessId: string, xeroHeaders: any) {
  let contactsSynced = 0;
  let page = 1;
  let hasMore = true;

  console.log("[SYNC] Starting contacts sync...");

  while (hasMore) {
    const url = `${XERO_API_BASE}/Contacts?page=${page}&pageSize=100`;
    console.log(`[SYNC] Fetching contacts page ${page}`);
    const res = await fetch(url, { headers: xeroHeaders });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[SYNC] Contacts API error ${res.status}: ${errText}`);
      throw new Error(`Contacts API returned ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const contacts = data.Contacts || [];
    console.log(`[SYNC] Page ${page}: received ${contacts.length} contacts`);

    if (contacts.length === 0) { hasMore = false; break; }

    const rows = contacts.map((c: any) => ({
      business_id: businessId,
      xero_contact_id: c.ContactID,
      contact_name: c.Name || c.FirstName || "Unknown",
      company_name: c.Name || "",
      email: c.EmailAddress || `xero-${c.ContactID}@placeholder.local`,
      phone: c.Phones?.find((p: any) => p.PhoneType === "DEFAULT")?.PhoneNumber || c.Phones?.[0]?.PhoneNumber || null,
      mobile: c.Phones?.find((p: any) => p.PhoneType === "MOBILE")?.PhoneNumber || null,
      website: c.Website || null,
      billing_address: c.Addresses?.find((a: any) => a.AddressType === "POBOX")
        ? formatAddress(c.Addresses.find((a: any) => a.AddressType === "POBOX"))
        : c.Addresses?.[0] ? formatAddress(c.Addresses[0]) : null,
      tax_number: c.TaxNumber || null,
    }));

    const { error: upsertErr } = await supabase.from("clients").upsert(rows, {
      onConflict: "business_id,xero_contact_id",
      ignoreDuplicates: false,
    });

    if (upsertErr) {
      console.error(`[SYNC] Batch contact upsert error:`, upsertErr.message);
    }
    contactsSynced += contacts.length;

    if (contacts.length < 100) hasMore = false;
    else page++;
  }

  console.log(`[SYNC] Contacts sync complete: ${contactsSynced} synced`);
  return contactsSynced;
}

// ── SYNC INVOICES ──
async function syncInvoices(supabase: any, businessId: string, xeroHeaders: any) {
  let invoicesSynced = 0;
  let page = 1;
  let hasMore = true;

  console.log("[SYNC] Starting invoices sync...");

  while (hasMore) {
    const url = `${XERO_API_BASE}/Invoices?page=${page}&pageSize=100&Statuses=AUTHORISED,PAID,SUBMITTED,DRAFT,OVERDUE,VOIDED`;
    console.log(`[SYNC] Fetching invoices page ${page}`);
    const res = await fetch(url, { headers: xeroHeaders });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[SYNC] Invoices API error ${res.status}: ${errText}`);
      throw new Error(`Invoices API returned ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const invoices = data.Invoices || [];
    console.log(`[SYNC] Page ${page}: received ${invoices.length} invoices`);

    if (invoices.length === 0) { hasMore = false; break; }

    // Pre-fetch client ID map for this batch
    const contactIds = invoices.map((inv: any) => inv.Contact?.ContactID).filter(Boolean);
    const uniqueContactIds = [...new Set(contactIds)];
    const clientMap: Record<string, string> = {};

    if (uniqueContactIds.length > 0) {
      const { data: clients } = await supabase
        .from("clients").select("id, xero_contact_id")
        .eq("business_id", businessId)
        .in("xero_contact_id", uniqueContactIds);
      for (const c of clients || []) {
        clientMap[c.xero_contact_id] = c.id;
      }
    }

    const rows = invoices.map((inv: any) => ({
      business_id: businessId,
      xero_invoice_id: inv.InvoiceID,
      xero_contact_id: inv.Contact?.ContactID || null,
      invoice_number: inv.InvoiceNumber,
      client_id: clientMap[inv.Contact?.ContactID] || null,
      contact_name: inv.Contact?.Name || null,
      invoice_date: inv.DateString || null,
      due_date: inv.DueDateString || null,
      currency: inv.CurrencyCode || "AUD",
      total_amount: inv.Total || 0,
      amount_paid: inv.AmountPaid || 0,
      amount_due: inv.AmountDue || 0,
      status: inv.Status || "DRAFT",
      reference: inv.Reference || null,
      department_category: inv.LineItems?.[0]?.Tracking?.[0]?.Option || null,
      line_items_json: inv.LineItems || [],
      synced_at: new Date().toISOString(),
    }));

    const { error: upsertErr } = await supabase.from("xero_invoices").upsert(rows, {
      onConflict: "business_id,xero_invoice_id",
      ignoreDuplicates: false,
    });

    if (upsertErr) {
      console.error(`[SYNC] Batch invoice upsert error:`, upsertErr.message);
    }
    invoicesSynced += invoices.length;

    if (invoices.length < 100) hasMore = false;
    else page++;
  }

  console.log(`[SYNC] Invoices sync complete: ${invoicesSynced} synced`);
  return invoicesSynced;
}

// ── SYNC PAYMENTS ──
async function syncPayments(supabase: any, businessId: string, xeroHeaders: any) {
  let paymentsSynced = 0;
  let page = 1;
  let hasMore = true;

  console.log("[SYNC] Starting payments sync...");

  while (hasMore) {
    const url = `${XERO_API_BASE}/Payments?page=${page}&pageSize=100`;
    console.log(`[SYNC] Fetching payments page ${page}`);
    const res = await fetch(url, { headers: xeroHeaders });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[SYNC] Payments API error ${res.status}: ${errText}`);
      throw new Error(`Payments API returned ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const payments = data.Payments || [];
    console.log(`[SYNC] Page ${page}: received ${payments.length} payments`);

    if (payments.length === 0) { hasMore = false; break; }

    for (const p of payments) {
      let clientId = null;
      let invoiceId = null;

      if (p.Invoice?.InvoiceID) {
        const { data: invRecord } = await supabase
          .from("xero_invoices").select("id, client_id")
          .eq("business_id", businessId)
          .eq("xero_invoice_id", p.Invoice.InvoiceID)
          .single();
        if (invRecord) {
          invoiceId = invRecord.id;
          clientId = invRecord.client_id;
        }
      }

      if (!clientId && p.Invoice?.Contact?.ContactID) {
        const { data: client } = await supabase
          .from("clients").select("id")
          .eq("business_id", businessId)
          .eq("xero_contact_id", p.Invoice.Contact.ContactID)
          .single();
        clientId = client?.id || null;
      }

      const { error: upsertErr } = await supabase.from("xero_payments").upsert({
        business_id: businessId,
        xero_payment_id: p.PaymentID,
        xero_invoice_id: p.Invoice?.InvoiceID || null,
        xero_contact_id: p.Invoice?.Contact?.ContactID || null,
        invoice_id: invoiceId,
        client_id: clientId,
        payment_amount: p.Amount || 0,
        payment_date: p.DateString || null,
        payment_method: p.PaymentType || null,
        transaction_reference: p.Reference || null,
        synced_at: new Date().toISOString(),
      }, { onConflict: "business_id,xero_payment_id", ignoreDuplicates: false });

      if (upsertErr) {
        console.error(`[SYNC] Payment upsert error:`, upsertErr.message);
      }
      paymentsSynced++;
    }

    if (payments.length < 100) hasMore = false;
    else page++;
  }

  console.log(`[SYNC] Payments sync complete: ${paymentsSynced} synced`);
  return paymentsSynced;
}

// ── SYNC EXPENSES (Bills / Expense Claims from Xero) ──
async function syncExpenses(supabase: any, businessId: string, xeroHeaders: any) {
  let expensesSynced = 0;
  let page = 1;
  let hasMore = true;

  console.log("[SYNC] Starting expenses sync (Invoices type=ACCPAY)...");

  while (hasMore) {
    const url = `${XERO_API_BASE}/Invoices?page=${page}&pageSize=100&where=Type%3D%3D%22ACCPAY%22`;
    console.log(`[SYNC] Fetching expenses page ${page}`);
    const res = await fetch(url, { headers: xeroHeaders });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[SYNC] Expenses API error ${res.status}: ${errText}`);
      throw new Error(`Expenses API returned ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const bills = data.Invoices || [];
    console.log(`[SYNC] Page ${page}: received ${bills.length} expense bills`);

    if (bills.length === 0) { hasMore = false; break; }

    for (const bill of bills) {
      const category = bill.LineItems?.[0]?.AccountCode || bill.LineItems?.[0]?.Tracking?.[0]?.Option || "General";

      const { error: upsertErr } = await supabase.from("xero_expenses").upsert({
        business_id: businessId,
        xero_expense_id: bill.InvoiceID,
        expense_date: bill.DateString || null,
        supplier_name: bill.Contact?.Name || "Unknown Supplier",
        category,
        description: bill.Reference || bill.LineItems?.map((li: any) => li.Description).filter(Boolean).join("; ") || null,
        amount: bill.Total || 0,
        currency: bill.CurrencyCode || "AUD",
        status: bill.Status || "AUTHORISED",
        line_items_json: bill.LineItems || [],
        synced_at: new Date().toISOString(),
      }, { onConflict: "business_id,xero_expense_id", ignoreDuplicates: false });

      if (upsertErr) {
        console.error(`[SYNC] Expense upsert error:`, upsertErr.message);
      }
      expensesSynced++;
    }

    if (bills.length < 100) hasMore = false;
    else page++;
  }

  console.log(`[SYNC] Expenses sync complete: ${expensesSynced} synced`);
  return expensesSynced;
}

// ── UPDATE CLIENT_SINCE from first invoice date ──
async function updateClientSinceDates(supabase: any, businessId: string) {
  console.log("[SYNC] Updating client_since dates from first invoices...");

  const { data: clients } = await supabase
    .from("clients").select("id, xero_contact_id")
    .eq("business_id", businessId)
    .not("xero_contact_id", "is", null);

  if (!clients || clients.length === 0) return;

  for (const client of clients) {
    const { data: firstInv } = await supabase
      .from("xero_invoices")
      .select("invoice_date")
      .eq("business_id", businessId)
      .eq("client_id", client.id)
      .not("invoice_date", "is", null)
      .order("invoice_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (firstInv?.invoice_date) {
      await supabase.from("clients").update({
        client_since: firstInv.invoice_date,
      }).eq("id", client.id);
    }
  }

  console.log("[SYNC] Client since dates updated");
}

// ── HANDLE OVERDUE ──
async function handleOverdueInvoices(supabase: any, businessId: string) {
  const { data: overdueInvs } = await supabase
    .from("xero_invoices")
    .select("id, invoice_number, contact_name, amount_due, due_date")
    .eq("business_id", businessId)
    .in("status", ["AUTHORISED", "SUBMITTED"])
    .lt("due_date", new Date().toISOString().split("T")[0]);

  if (overdueInvs && overdueInvs.length > 0) {
    for (const inv of overdueInvs) {
      await supabase.from("xero_invoices").update({ status: "OVERDUE" }).eq("id", inv.id);
    }

    const { data: admins } = await supabase
      .from("user_roles").select("user_id")
      .eq("business_id", businessId)
      .in("role", ["super_admin", "business_admin"]);

    if (admins) {
      for (const admin of admins) {
        await supabase.from("notifications").insert({
          business_id: businessId,
          user_id: admin.user_id,
          type: "warning",
          title: "Overdue Invoices Detected",
          message: `${overdueInvs.length} invoice(s) overdue. Total: $${overdueInvs.reduce((s: number, i: any) => s + Number(i.amount_due), 0).toFixed(2)}`,
        });
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { action, business_id, code, redirect_uri, code_verifier, stage } = await req.json();

    // --- GET AUTH URL ---
    if (action === "get_auth_url") {
      const clientId = Deno.env.get("XERO_CLIENT_ID");
      if (!clientId) throw new Error("Xero credentials not configured");

      const scope = "openid profile email offline_access accounting.contacts accounting.transactions accounting.settings";
      const state = crypto.randomUUID();
      const redirectUriFixed = redirect_uri || "https://bigappcompany.com.au/finance";

      const encodedScope = scope.split(" ").join("%20");
      const authUrl = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUriFixed)}&scope=${encodedScope}&state=${state}`;

      return new Response(JSON.stringify({ success: true, auth_url: authUrl, state }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- OAUTH CALLBACK ---
    if (action === "oauth_callback") {
      const clientId = Deno.env.get("XERO_CLIENT_ID");
      const clientSecret = Deno.env.get("XERO_CLIENT_SECRET");
      if (!clientId || !clientSecret) throw new Error("Xero credentials not configured");

      const basicAuth = btoa(`${clientId}:${clientSecret}`);
      const tokenBody: Record<string, string> = {
        grant_type: "authorization_code",
        code,
        redirect_uri: redirect_uri || "https://bigappcompany.com.au/finance",
      };

      console.log("[OAUTH] Exchanging code for token with Basic Auth...");

      const tokenRes = await fetch(XERO_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${basicAuth}`,
        },
        body: new URLSearchParams(tokenBody),
      });
      const tokens = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokens.error || "Token exchange failed");

      console.log("[OAUTH] Fetching tenant ID from /connections...");
      const connectionsRes = await fetch("https://api.xero.com/connections", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!connectionsRes.ok) {
        const errBody = await connectionsRes.text();
        throw new Error(`Failed to retrieve Xero connections: ${connectionsRes.status}`);
      }

      const connections = await connectionsRes.json();
      if (!connections || connections.length === 0) {
        throw new Error("No Xero organisations found. Please ensure the app has accounting scopes enabled.");
      }

      const tenantId = connections[0].tenantId;
      console.log("[OAUTH] Tenant ID captured:", tenantId);

      await supabase.from("xero_connections").upsert({
        business_id,
        is_connected: true,
        xero_tenant_id: tenantId,
        access_token_encrypted: tokens.access_token,
        refresh_token_encrypted: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        last_sync_at: null,
      }, { onConflict: "business_id" });

      return new Response(JSON.stringify({ success: true, tenantId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- SYNC (single business, staged) ---
    // Now supports `stage` parameter: "contacts", "invoices", "payments", "expenses", "finalize"
    // If no stage provided, defaults to full sync but each stage writes its own log
    if (action === "sync") {
      console.log(`=== XERO SYNC START === Stage: ${stage || "full"}, Business: ${business_id}`);
      const { xeroHeaders } = await getConnectionAndHeaders(supabase, business_id);

      // STAGED SYNC: each stage runs independently and writes its own log
      if (stage) {
        let synced = 0;
        let errorMsg: string | null = null;

        try {
          if (stage === "contacts") {
            synced = await syncContacts(supabase, business_id, xeroHeaders);
          } else if (stage === "invoices") {
            synced = await syncInvoices(supabase, business_id, xeroHeaders);
          } else if (stage === "payments") {
            synced = await syncPayments(supabase, business_id, xeroHeaders);
          } else if (stage === "expenses") {
            synced = await syncExpenses(supabase, business_id, xeroHeaders);
          } else if (stage === "finalize") {
            await updateClientSinceDates(supabase, business_id);
            await handleOverdueInvoices(supabase, business_id);
          } else {
            throw new Error(`Unknown sync stage: ${stage}`);
          }
        } catch (e) {
          errorMsg = e.message;
          console.error(`[SYNC] Stage ${stage} error:`, e.message);
        }

        await writeSyncLog(supabase, business_id, `stage:${stage}`, errorMsg ? "error" : "success", synced, errorMsg);
        console.log(`=== XERO SYNC STAGE COMPLETE === Stage: ${stage}, Records: ${synced}`);

        return new Response(JSON.stringify({
          success: !errorMsg,
          stage,
          recordsSynced: synced,
          error: errorMsg,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // FULL SYNC (legacy): run all stages sequentially, write log per stage
      const syncErrors: string[] = [];
      let contactsSynced = 0, invoicesSynced = 0, paymentsSynced = 0, expensesSynced = 0;

      try { contactsSynced = await syncContacts(supabase, business_id, xeroHeaders); }
      catch (e) { syncErrors.push(`Contacts: ${e.message}`); }
      await writeSyncLog(supabase, business_id, "contacts", syncErrors.length === 0 ? "success" : "error", contactsSynced, syncErrors.length > 0 ? syncErrors[syncErrors.length - 1] : null);

      try { invoicesSynced = await syncInvoices(supabase, business_id, xeroHeaders); }
      catch (e) { syncErrors.push(`Invoices: ${e.message}`); }
      await writeSyncLog(supabase, business_id, "invoices", !syncErrors.some(e => e.startsWith("Invoices")) ? "success" : "error", invoicesSynced, syncErrors.some(e => e.startsWith("Invoices")) ? syncErrors[syncErrors.length - 1] : null);

      try { paymentsSynced = await syncPayments(supabase, business_id, xeroHeaders); }
      catch (e) { syncErrors.push(`Payments: ${e.message}`); }
      await writeSyncLog(supabase, business_id, "payments", !syncErrors.some(e => e.startsWith("Payments")) ? "success" : "error", paymentsSynced, syncErrors.some(e => e.startsWith("Payments")) ? syncErrors[syncErrors.length - 1] : null);

      try { expensesSynced = await syncExpenses(supabase, business_id, xeroHeaders); }
      catch (e) { syncErrors.push(`Expenses: ${e.message}`); }
      await writeSyncLog(supabase, business_id, "expenses", !syncErrors.some(e => e.startsWith("Expenses")) ? "success" : "error", expensesSynced, syncErrors.some(e => e.startsWith("Expenses")) ? syncErrors[syncErrors.length - 1] : null);

      try { await updateClientSinceDates(supabase, business_id); }
      catch (e) { syncErrors.push(`ClientSince: ${e.message}`); }
      try { await handleOverdueInvoices(supabase, business_id); }
      catch (e) { syncErrors.push(`Overdue: ${e.message}`); }

      console.log(`=== XERO SYNC COMPLETE === Contacts: ${contactsSynced}, Invoices: ${invoicesSynced}, Payments: ${paymentsSynced}, Expenses: ${expensesSynced}`);

      return new Response(JSON.stringify({
        success: true,
        contactsSynced,
        invoicesSynced,
        paymentsSynced,
        expensesSynced,
        errors: syncErrors,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- SYNC ALL BUSINESSES (cron) ---
    if (action === "sync_all_businesses") {
      const { data: connections } = await supabase
        .from("xero_connections").select("business_id")
        .eq("is_connected", true);

      const results = [];
      for (const c of (connections || [])) {
        try {
          const { xeroHeaders } = await getConnectionAndHeaders(supabase, c.business_id);

          const syncErrors: string[] = [];
          let contactsSynced = 0, invoicesSynced = 0, paymentsSynced = 0, expensesSynced = 0;

          try { contactsSynced = await syncContacts(supabase, c.business_id, xeroHeaders); }
          catch (e) { syncErrors.push(`Contacts: ${e.message}`); }
          try { invoicesSynced = await syncInvoices(supabase, c.business_id, xeroHeaders); }
          catch (e) { syncErrors.push(`Invoices: ${e.message}`); }
          try { paymentsSynced = await syncPayments(supabase, c.business_id, xeroHeaders); }
          catch (e) { syncErrors.push(`Payments: ${e.message}`); }
          try { expensesSynced = await syncExpenses(supabase, c.business_id, xeroHeaders); }
          catch (e) { syncErrors.push(`Expenses: ${e.message}`); }
          try { await updateClientSinceDates(supabase, c.business_id); }
          catch (e) { syncErrors.push(`ClientSince: ${e.message}`); }
          try { await handleOverdueInvoices(supabase, c.business_id); }
          catch (e) { syncErrors.push(`Overdue: ${e.message}`); }

          await writeSyncLog(supabase, c.business_id, "scheduled",
            syncErrors.length === 0 ? "success" : "partial",
            contactsSynced + invoicesSynced + paymentsSynced + expensesSynced,
            syncErrors.length > 0 ? syncErrors.join("; ") : null);
          results.push({ business_id: c.business_id, success: true });
        } catch (e) {
          results.push({ business_id: c.business_id, error: e.message });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- DISCONNECT ---
    if (action === "disconnect") {
      await supabase.from("xero_connections").update({
        is_connected: false,
        access_token_encrypted: null,
        refresh_token_encrypted: null,
      }).eq("business_id", business_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("xero-sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
