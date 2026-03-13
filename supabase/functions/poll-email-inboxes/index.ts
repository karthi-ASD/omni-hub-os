import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Gmail API helpers ──

async function getGmailAccessToken(): Promise<string> {
  const clientId = Deno.env.get("GMAIL_OAUTH_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GMAIL_OAUTH_CLIENT_SECRET")!;
  const refreshToken = Deno.env.get("GMAIL_OAUTH_REFRESH_TOKEN")!;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Gmail OAuth token refresh failed: " + JSON.stringify(data));
  return data.access_token;
}

async function pollGmailInbox(
  emailAddress: string,
  accessToken: string,
  lastPolledAt: string | null
): Promise<any[]> {
  const emails: any[] = [];

  // Build query for unread messages after last poll
  let query = "is:unread in:inbox";
  if (lastPolledAt) {
    const afterEpoch = Math.floor(new Date(lastPolledAt).getTime() / 1000);
    query += ` after:${afterEpoch}`;
  }

  // Use Gmail users.messages.list — we use "me" but delegate with the email
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(emailAddress)}/messages?q=${encodeURIComponent(query)}&maxResults=20`;

  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    const errText = await listRes.text();
    console.error(`Gmail list failed for ${emailAddress}:`, errText);
    return emails;
  }

  const listData = await listRes.json();
  if (!listData.messages || listData.messages.length === 0) return emails;

  // Fetch each message
  for (const msg of listData.messages.slice(0, 20)) {
    try {
      const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(emailAddress)}/messages/${msg.id}?format=full`;
      const msgRes = await fetch(msgUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!msgRes.ok) continue;
      const msgData = await msgRes.json();

      const headers = msgData.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

      const fromRaw = getHeader("From");
      const fromMatch = fromRaw.match(/(?:"?([^"]*)"?\s*)?<?([^>]+@[^>]+)>?/);
      const fromName = fromMatch?.[1]?.trim() || "";
      const fromEmail = fromMatch?.[2]?.trim() || fromRaw;

      // Extract body
      let body = "";
      let bodyHtml = "";
      const parts = msgData.payload?.parts || [];
      if (parts.length > 0) {
        for (const part of parts) {
          if (part.mimeType === "text/plain" && part.body?.data) {
            body = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          }
          if (part.mimeType === "text/html" && part.body?.data) {
            bodyHtml = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          }
        }
      } else if (msgData.payload?.body?.data) {
        body = atob(msgData.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
      }

      emails.push({
        message_id: msgData.id,
        from_email: fromEmail,
        from_name: fromName,
        to_email: emailAddress,
        subject: getHeader("Subject"),
        body,
        body_html: bodyHtml,
        in_reply_to: getHeader("In-Reply-To") || null,
        gmail_thread_id: msgData.threadId,
      });

      // Mark as read
      await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(emailAddress)}/messages/${msg.id}/modify`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
        }
      );
    } catch (e) {
      console.error(`Error processing Gmail message ${msg.id}:`, e);
    }
  }
  return emails;
}

// ── IMAP helpers (via edge function HTTP-based approach) ──
// Since Deno edge functions can't use raw TCP sockets for IMAP,
// we use a lightweight fetch-based IMAP proxy approach.
// For production, this would connect to an IMAP bridge service.
// For now, we'll create a placeholder that logs and can be extended.

async function pollImapInbox(
  config: any,
  password: string,
  lastPolledAt: string | null
): Promise<any[]> {
  // IMAP polling in Deno edge functions requires a proxy/bridge service
  // since Deno Deploy doesn't support raw TCP connections.
  // This is a structured placeholder that logs the attempt.
  console.log(`IMAP poll attempted for ${config.email_address} (${config.imap_host}:${config.imap_port})`);
  console.log(`Last polled: ${lastPolledAt || "never"}`);
  console.log("Note: IMAP requires a bridge service for Deno edge functions. Configure an IMAP-to-HTTP bridge for production use.");
  
  // Return empty — in production, replace with IMAP bridge API call
  return [];
}

// ── Main handler ──

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active, monitored email configurations
    const { data: configs, error: cfgErr } = await supabase
      .from("email_configurations")
      .select("*")
      .eq("is_active", true)
      .eq("monitored", true);

    if (cfgErr || !configs || configs.length === 0) {
      return new Response(JSON.stringify({ message: "No active email configs", configs: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];
    let gmailToken: string | null = null;

    for (const config of configs) {
      try {
        let emails: any[] = [];

        if (config.provider_type === "gmail") {
          // Get token once for all Gmail accounts
          if (!gmailToken) {
            try {
              gmailToken = await getGmailAccessToken();
            } catch (e) {
              console.error("Gmail OAuth failed:", e);
              results.push({ email: config.email_address, error: "OAuth token failed", emails: 0 });
              continue;
            }
          }
          emails = await pollGmailInbox(config.email_address, gmailToken, config.last_polled_at);
        } else if (config.provider_type === "imap") {
          const imapPassword = Deno.env.get("IMAP_DEFAULT_PASSWORD") || "";
          emails = await pollImapInbox(config, imapPassword, config.last_polled_at);
        }

        // Process each email through ticket-email-processor
        let ticketsCreated = 0;
        for (const email of emails) {
          try {
            const processRes = await fetch(`${supabaseUrl}/functions/v1/ticket-email-processor`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                ...email,
                business_id: config.business_id,
              }),
            });
            const processResult = await processRes.json();
            if (processResult.action === "ticket_created" || processResult.action === "thread_updated") {
              ticketsCreated++;
            }
          } catch (procErr) {
            console.error(`Error processing email from ${email.from_email}:`, procErr);
          }
        }

        // Update last_polled_at
        await supabase
          .from("email_configurations")
          .update({ last_polled_at: new Date().toISOString() } as any)
          .eq("id", config.id);

        results.push({
          email: config.email_address,
          provider: config.provider_type,
          fetched: emails.length,
          tickets_created: ticketsCreated,
        });
      } catch (configErr) {
        console.error(`Error polling ${config.email_address}:`, configErr);
        results.push({ email: config.email_address, error: (configErr as Error).message });
      }
    }

    // Log polling run
    await supabase.from("system_events" as any).insert({
      business_id: configs[0].business_id,
      event_type: "EMAIL_POLL_COMPLETED",
      payload_json: { results, polled_at: new Date().toISOString() },
    });

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("poll-email-inboxes error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
