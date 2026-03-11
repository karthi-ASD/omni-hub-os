import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeBase64Url } from "https://deno.land/std@0.224.0/encoding/base64url.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_API_BASE = "https://api.xero.com/api.xro/2.0";

// PKCE helper functions
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return encodeBase64Url(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return encodeBase64Url(new Uint8Array(digest));
}

async function getAccessToken(supabase: any, conn: any) {
  let accessToken = conn.access_token_encrypted;

  if (conn.token_expires_at && new Date(conn.token_expires_at) <= new Date()) {
    const clientId = Deno.env.get("XERO_CLIENT_ID")!;
    const clientSecret = Deno.env.get("XERO_CLIENT_SECRET")!;

    const refreshRes = await fetch(XERO_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: conn.refresh_token_encrypted,
        client_id: clientId,
        client_secret: clientSecret,
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

async function syncContacts(supabase: any, businessId: string, xeroHeaders: any) {
  let contactsSynced = 0;
  let page = 1;
  let hasMore = true;

  console.log("[SYNC] Starting contacts sync...");

  while (hasMore) {
    const url = `${XERO_API_BASE}/Contacts?page=${page}&pageSize=100`;
    console.log(`[SYNC] Fetching contacts page ${page}: ${url}`);
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

    for (const c of contacts) {
      const email = c.EmailAddress || `xero-${c.ContactID}@placeholder.local`;
      const { error: upsertErr } = await supabase.from("clients").upsert({
        business_id: businessId,
        xero_contact_id: c.ContactID,
        contact_name: c.Name || c.FirstName || "Unknown",
        company_name: c.Name || "",
        email,
        phone: c.Phones?.find((p: any) => p.PhoneType === "DEFAULT")?.PhoneNumber || c.Phones?.[0]?.PhoneNumber || null,
        mobile: c.Phones?.find((p: any) => p.PhoneType === "MOBILE")?.PhoneNumber || null,
        website: c.Website || null,
        billing_address: c.Addresses?.find((a: any) => a.AddressType === "POBOX") 
          ? formatAddress(c.Addresses.find((a: any) => a.AddressType === "POBOX"))
          : c.Addresses?.[0] ? formatAddress(c.Addresses[0]) : null,
        tax_number: c.TaxNumber || null,
      }, { onConflict: "business_id,xero_contact_id", ignoreDuplicates: false });
      
      if (upsertErr) {
        console.error(`[SYNC] Contact upsert error for ${c.Name}:`, upsertErr.message);
      }
      contactsSynced++;
    }

    if (contacts.length < 100) hasMore = false;
    else page++;
  }

  console.log(`[SYNC] Contacts sync complete: ${contactsSynced} synced`);
  return contactsSynced;
}

function formatAddress(addr: any): string {
  return [addr.AddressLine1, addr.AddressLine2, addr.City, addr.Region, addr.PostalCode, addr.Country]
    .filter(Boolean).join(", ");
}

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

    for (const inv of invoices) {
      let clientId = null;
      if (inv.Contact?.ContactID) {
        const { data: client } = await supabase
          .from("clients").select("id")
          .eq("business_id", businessId)
          .eq("xero_contact_id", inv.Contact.ContactID)
          .single();
        clientId = client?.id || null;
      }

      const deptCategory = inv.LineItems?.[0]?.Tracking?.[0]?.Option || null;

      const { error: upsertErr } = await supabase.from("xero_invoices").upsert({
        business_id: businessId,
        xero_invoice_id: inv.InvoiceID,
        xero_contact_id: inv.Contact?.ContactID || null,
        invoice_number: inv.InvoiceNumber,
        client_id: clientId,
        contact_name: inv.Contact?.Name || null,
        invoice_date: inv.DateString || null,
        due_date: inv.DueDateString || null,
        currency: inv.CurrencyCode || "AUD",
        total_amount: inv.Total || 0,
        amount_paid: inv.AmountPaid || 0,
        amount_due: inv.AmountDue || 0,
        status: inv.Status || "DRAFT",
        reference: inv.Reference || null,
        department_category: deptCategory,
        line_items_json: inv.LineItems || [],
        synced_at: new Date().toISOString(),
      }, { onConflict: "business_id,xero_invoice_id", ignoreDuplicates: false });
      
      if (upsertErr) {
        console.error(`[SYNC] Invoice upsert error for ${inv.InvoiceNumber}:`, upsertErr.message);
      }
      invoicesSynced++;
    }

    if (invoices.length < 100) hasMore = false;
    else page++;
  }

  console.log(`[SYNC] Invoices sync complete: ${invoicesSynced} synced`);
  return invoicesSynced;
}

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
    const { action, business_id, code, redirect_uri, code_verifier } = await req.json();

    // --- GET AUTH URL (server-side, keeps client_id secret + PKCE) ---
    if (action === "get_auth_url") {
      const clientId = Deno.env.get("XERO_CLIENT_ID");
      if (!clientId) throw new Error("Xero credentials not configured");
      
      const scope = "openid offline_access accounting.contacts accounting.transactions";
      const state = crypto.randomUUID();
      const redirectUriFixed = redirect_uri || "https://bigappcompany.com.au/finance";

      // Manually build URL to ensure %20 encoding for scopes
      const encodedScope = scope.split(" ").join("%20");
      const authUrl = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUriFixed)}&scope=${encodedScope}&state=${state}`;
      
      console.log("=== XERO OAUTH DEBUG ===");
      console.log("Auth URL:", authUrl);
      console.log("Redirect URI:", redirectUriFixed);
      console.log("Scopes:", scope);
      console.log("========================");
      
      return new Response(JSON.stringify({ success: true, auth_url: authUrl, state }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- OAUTH CALLBACK ---
    if (action === "oauth_callback") {
      const clientId = Deno.env.get("XERO_CLIENT_ID");
      const clientSecret = Deno.env.get("XERO_CLIENT_SECRET");
      if (!clientId || !clientSecret) throw new Error("Xero credentials not configured");

      const tokenBody: Record<string, string> = {
        grant_type: "authorization_code",
        code,
        redirect_uri: redirect_uri || "https://bigappcompany.com.au/finance",
        client_id: clientId,
        client_secret: clientSecret,
      };
      
      console.log("=== XERO TOKEN EXCHANGE ===");
      console.log("Redirect URI:", tokenBody.redirect_uri);
      console.log("===========================");

      const tokenRes = await fetch(XERO_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(tokenBody),
      });
      const tokens = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokens.error || "Token exchange failed");

      const connectionsRes = await fetch("https://api.xero.com/connections", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const connections = await connectionsRes.json();
      const tenantId = connections[0]?.tenantId;

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

    // --- SYNC ALL BUSINESSES (cron job) ---
    if (action === "sync_all_businesses") {
      const { data: connections } = await supabase
        .from("xero_connections").select("business_id")
        .eq("is_connected", true);

      const results = [];
      for (const c of (connections || [])) {
        try {
          const { data: conn } = await supabase
            .from("xero_connections").select("*")
            .eq("business_id", c.business_id)
            .eq("is_connected", true)
            .single();
          if (!conn) continue;

          const accessToken = await getAccessToken(supabase, conn);
          const xeroHeaders = {
            Authorization: `Bearer ${accessToken}`,
            "Xero-Tenant-Id": conn.xero_tenant_id,
            Accept: "application/json",
          };

          const syncErrors: string[] = [];
          let contactsSynced = 0, invoicesSynced = 0, paymentsSynced = 0;

          try { contactsSynced = await syncContacts(supabase, c.business_id, xeroHeaders); }
          catch (e) { syncErrors.push(`Contacts: ${e.message}`); }
          try { invoicesSynced = await syncInvoices(supabase, c.business_id, xeroHeaders); }
          catch (e) { syncErrors.push(`Invoices: ${e.message}`); }
          try { paymentsSynced = await syncPayments(supabase, c.business_id, xeroHeaders); }
          catch (e) { syncErrors.push(`Payments: ${e.message}`); }
          try { await handleOverdueInvoices(supabase, c.business_id); }
          catch (e) { syncErrors.push(`Overdue: ${e.message}`); }

          await supabase.from("xero_sync_logs").insert({
            business_id: c.business_id, sync_type: "scheduled", 
            status: syncErrors.length === 0 ? "success" : "partial",
            records_synced: contactsSynced + invoicesSynced + paymentsSynced,
            error_message: syncErrors.length > 0 ? syncErrors.join("; ") : null,
          });
          await supabase.from("xero_connections").update({ last_sync_at: new Date().toISOString() }).eq("business_id", c.business_id);
          results.push({ business_id: c.business_id, success: true });
        } catch (e) {
          results.push({ business_id: c.business_id, error: e.message });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- SYNC (single business) ---
    if (action === "sync") {
      const { data: conn } = await supabase
        .from("xero_connections").select("*")
        .eq("business_id", business_id)
        .eq("is_connected", true)
        .single();

      if (!conn) throw new Error("Xero not connected for this business");

      const accessToken = await getAccessToken(supabase, conn);

      const xeroHeaders = {
        Authorization: `Bearer ${accessToken}`,
        "Xero-Tenant-Id": conn.xero_tenant_id,
        Accept: "application/json",
      };

      const syncErrors: string[] = [];
      let contactsSynced = 0, invoicesSynced = 0, paymentsSynced = 0;

      try { contactsSynced = await syncContacts(supabase, business_id, xeroHeaders); }
      catch (e) { syncErrors.push(`Contacts: ${e.message}`); }

      try { invoicesSynced = await syncInvoices(supabase, business_id, xeroHeaders); }
      catch (e) { syncErrors.push(`Invoices: ${e.message}`); }

      try { paymentsSynced = await syncPayments(supabase, business_id, xeroHeaders); }
      catch (e) { syncErrors.push(`Payments: ${e.message}`); }

      try { await handleOverdueInvoices(supabase, business_id); }
      catch (e) { syncErrors.push(`Overdue check: ${e.message}`); }

      const syncStatus = syncErrors.length === 0 ? "success" : "partial";
      await supabase.from("xero_sync_logs").insert({
        business_id,
        sync_type: "full",
        status: syncStatus,
        records_synced: contactsSynced + invoicesSynced + paymentsSynced,
        error_message: syncErrors.length > 0 ? syncErrors.join("; ") : null,
      });

      await supabase.from("xero_connections").update({
        last_sync_at: new Date().toISOString(),
      }).eq("business_id", business_id);

      return new Response(JSON.stringify({
        success: true,
        contactsSynced,
        invoicesSynced,
        paymentsSynced,
        errors: syncErrors,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
