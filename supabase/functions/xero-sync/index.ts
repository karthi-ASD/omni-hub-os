import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_API_BASE = "https://api.xero.com/api.xro/2.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { action, business_id, code, redirect_uri } = await req.json();

    // --- OAUTH CALLBACK: exchange code for tokens ---
    if (action === "oauth_callback") {
      const clientId = Deno.env.get("XERO_CLIENT_ID");
      const clientSecret = Deno.env.get("XERO_CLIENT_SECRET");
      if (!clientId || !clientSecret) throw new Error("Xero credentials not configured");

      const tokenRes = await fetch(XERO_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokens.error || "Token exchange failed");

      // Get tenant ID
      const connectionsRes = await fetch("https://api.xero.com/connections", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const connections = await connectionsRes.json();
      const tenantId = connections[0]?.tenantId;

      // Upsert connection record
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

    // --- SYNC: pull data from Xero ---
    if (action === "sync") {
      const { data: conn } = await supabase
        .from("xero_connections")
        .select("*")
        .eq("business_id", business_id)
        .eq("is_connected", true)
        .single();

      if (!conn) throw new Error("Xero not connected for this business");

      let accessToken = conn.access_token_encrypted;

      // Refresh token if expired
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

      const xeroHeaders = {
        Authorization: `Bearer ${accessToken}`,
        "Xero-Tenant-Id": conn.xero_tenant_id,
        Accept: "application/json",
      };

      let syncErrors: string[] = [];
      let contactsSynced = 0, invoicesSynced = 0, paymentsSynced = 0;

      // ----- SYNC CONTACTS -----
      try {
        const res = await fetch(`${XERO_API_BASE}/Contacts?page=1&pageSize=100`, { headers: xeroHeaders });
        const data = await res.json();
        const contacts = data.Contacts || [];

        for (const c of contacts) {
          await supabase.from("clients").upsert({
            business_id,
            xero_contact_id: c.ContactID,
            contact_name: c.Name || c.FirstName || "",
            company_name: c.Name || "",
            email: c.EmailAddress || null,
            phone: c.Phones?.[0]?.PhoneNumber || null,
            website: c.Website || null,
            billing_address: c.Addresses?.[0] ? `${c.Addresses[0].AddressLine1 || ""} ${c.Addresses[0].City || ""} ${c.Addresses[0].Region || ""} ${c.Addresses[0].PostalCode || ""}`.trim() : null,
            tax_number: c.TaxNumber || null,
          }, { onConflict: "business_id,xero_contact_id", ignoreDuplicates: false });
          contactsSynced++;
        }
      } catch (e) {
        syncErrors.push(`Contacts: ${e.message}`);
      }

      // ----- SYNC INVOICES -----
      try {
        const res = await fetch(`${XERO_API_BASE}/Invoices?page=1&pageSize=100&Statuses=AUTHORISED,PAID,SUBMITTED,DRAFT,OVERDUE,VOIDED`, { headers: xeroHeaders });
        const data = await res.json();
        const invoices = data.Invoices || [];

        for (const inv of invoices) {
          // Find matching client
          let clientId = null;
          if (inv.Contact?.ContactID) {
            const { data: client } = await supabase
              .from("clients")
              .select("id")
              .eq("business_id", business_id)
              .eq("xero_contact_id", inv.Contact.ContactID)
              .single();
            clientId = client?.id || null;
          }

          await supabase.from("xero_invoices").upsert({
            business_id,
            xero_invoice_id: inv.InvoiceID,
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
            department_category: inv.LineItems?.[0]?.Tracking?.[0]?.Option || null,
            line_items_json: inv.LineItems || [],
            synced_at: new Date().toISOString(),
          }, { onConflict: "business_id,xero_invoice_id", ignoreDuplicates: false });
          invoicesSynced++;
        }
      } catch (e) {
        syncErrors.push(`Invoices: ${e.message}`);
      }

      // ----- SYNC PAYMENTS -----
      try {
        const res = await fetch(`${XERO_API_BASE}/Payments?page=1&pageSize=100`, { headers: xeroHeaders });
        const data = await res.json();
        const payments = data.Payments || [];

        for (const p of payments) {
          let clientId = null;
          if (p.Invoice?.Contact?.ContactID) {
            const { data: client } = await supabase
              .from("clients")
              .select("id")
              .eq("business_id", business_id)
              .eq("xero_contact_id", p.Invoice.Contact.ContactID)
              .single();
            clientId = client?.id || null;
          }

          await supabase.from("xero_payments").upsert({
            business_id,
            xero_payment_id: p.PaymentID,
            client_id: clientId,
            payment_amount: p.Amount || 0,
            payment_date: p.DateString || null,
            payment_method: p.PaymentType || null,
            transaction_reference: p.Reference || null,
          }, { onConflict: "business_id,xero_payment_id", ignoreDuplicates: false });
          paymentsSynced++;
        }
      } catch (e) {
        syncErrors.push(`Payments: ${e.message}`);
      }

      // Log sync result
      const syncStatus = syncErrors.length === 0 ? "success" : "partial";
      await supabase.from("xero_sync_logs").insert({
        business_id,
        sync_type: "full",
        status: syncStatus,
        records_synced: contactsSynced + invoicesSynced + paymentsSynced,
        error_message: syncErrors.length > 0 ? syncErrors.join("; ") : null,
      });

      // Update last sync time
      await supabase.from("xero_connections").update({
        last_sync_at: new Date().toISOString(),
      }).eq("business_id", business_id);

      // Create overdue invoice notifications
      const { data: overdueInvs } = await supabase
        .from("xero_invoices")
        .select("id, invoice_number, contact_name, amount_due, due_date")
        .eq("business_id", business_id)
        .in("status", ["AUTHORISED", "SUBMITTED"])
        .lt("due_date", new Date().toISOString().split("T")[0]);

      if (overdueInvs && overdueInvs.length > 0) {
        // Update status to OVERDUE
        for (const inv of overdueInvs) {
          await supabase.from("xero_invoices").update({ status: "OVERDUE" }).eq("id", inv.id);
        }

        // Get admin user IDs for notifications
        const { data: admins } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("business_id", business_id)
          .in("role", ["super_admin", "business_admin"]);

        if (admins) {
          for (const admin of admins) {
            await supabase.from("notifications").insert({
              business_id,
              user_id: admin.user_id,
              type: "warning",
              title: "Overdue Invoices Detected",
              message: `${overdueInvs.length} invoice(s) are overdue. Total outstanding: $${overdueInvs.reduce((s, i) => s + Number(i.amount_due), 0).toFixed(2)}`,
            });
          }
        }
      }

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
