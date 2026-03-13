import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Gmail OAuth token refresh ──

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

// ── Base64url decode helper ──

function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64urlDecodeText(str: string): string {
  return atob(str.replace(/-/g, "+").replace(/_/g, "/"));
}

// ── Extract attachments from Gmail message parts ──

interface AttachmentMeta {
  filename: string;
  mimeType: string;
  attachmentId: string;
  size: number;
}

function extractAttachmentMeta(parts: any[]): AttachmentMeta[] {
  const attachments: AttachmentMeta[] = [];
  for (const part of parts) {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        attachmentId: part.body.attachmentId,
        size: part.body.size || 0,
      });
    }
    if (part.parts) {
      attachments.push(...extractAttachmentMeta(part.parts));
    }
  }
  return attachments;
}

// ── Download a single Gmail attachment ──

async function downloadGmailAttachment(
  emailAddress: string,
  messageId: string,
  attachmentId: string,
  accessToken: string,
): Promise<Uint8Array> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(emailAddress)}/messages/${messageId}/attachments/${attachmentId}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Attachment download failed: ${res.status}`);
  const json = await res.json();
  return base64urlDecode(json.data);
}

// ── Extract body text from Gmail message payload ──

function extractBody(payload: any): { body: string; bodyHtml: string } {
  let body = "";
  let bodyHtml = "";
  const parts = payload?.parts || [];

  if (parts.length > 0) {
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        body = base64urlDecodeText(part.body.data);
      }
      if (part.mimeType === "text/html" && part.body?.data) {
        bodyHtml = base64urlDecodeText(part.body.data);
      }
      // Nested multipart
      if (part.parts) {
        const nested = extractBody(part);
        if (!body && nested.body) body = nested.body;
        if (!bodyHtml && nested.bodyHtml) bodyHtml = nested.bodyHtml;
      }
    }
  } else if (payload?.body?.data) {
    body = base64urlDecodeText(payload.body.data);
  }

  return { body, bodyHtml };
}

// ── Poll a single Gmail inbox ──

async function pollGmailInbox(
  emailAddress: string,
  accessToken: string,
  lastPolledAt: string | null,
  supabase: any,
  businessId: string,
): Promise<{ emails: any[]; attachmentCount: number }> {
  const emails: any[] = [];
  let attachmentCount = 0;

  let query = "is:unread in:inbox";
  if (lastPolledAt) {
    const afterEpoch = Math.floor(new Date(lastPolledAt).getTime() / 1000);
    query += ` after:${afterEpoch}`;
  }

  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(emailAddress)}/messages?q=${encodeURIComponent(query)}&maxResults=20`;
  const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${accessToken}` } });

  if (!listRes.ok) {
    console.error(`Gmail list failed for ${emailAddress}:`, await listRes.text());
    return { emails, attachmentCount };
  }

  const listData = await listRes.json();
  if (!listData.messages?.length) return { emails, attachmentCount };

  for (const msg of listData.messages.slice(0, 20)) {
    try {
      const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(emailAddress)}/messages/${msg.id}?format=full`;
      const msgRes = await fetch(msgUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!msgRes.ok) continue;
      const msgData = await msgRes.json();

      const headers = msgData.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

      const fromRaw = getHeader("From");
      const fromMatch = fromRaw.match(/(?:"?([^"]*)"?\s*)?<?([^>]+@[^>]+)>?/);
      const fromName = fromMatch?.[1]?.trim() || "";
      const fromEmail = fromMatch?.[2]?.trim() || fromRaw;

      const { body, bodyHtml } = extractBody(msgData.payload);

      // Extract and upload attachments
      const attachmentMeta = extractAttachmentMeta(msgData.payload?.parts || []);
      const uploadedAttachments: { name: string; url: string; type: string; size: number }[] = [];

      for (const att of attachmentMeta) {
        try {
          const fileData = await downloadGmailAttachment(emailAddress, msg.id, att.attachmentId, accessToken);
          const storagePath = `${businessId}/${msg.id}/${att.filename}`;

          const { error: uploadErr } = await supabase.storage
            .from("ticket-attachments")
            .upload(storagePath, fileData, { contentType: att.mimeType, upsert: true });

          if (!uploadErr) {
            const { data: urlData } = supabase.storage
              .from("ticket-attachments")
              .getPublicUrl(storagePath);

            uploadedAttachments.push({
              name: att.filename,
              url: urlData?.publicUrl || storagePath,
              type: att.mimeType,
              size: att.size,
            });
            attachmentCount++;
          } else {
            console.error(`Upload failed for ${att.filename}:`, uploadErr);
          }
        } catch (attErr) {
          console.error(`Attachment error ${att.filename}:`, attErr);
        }
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
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      // Mark as read
      await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(emailAddress)}/messages/${msg.id}/modify`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
        },
      );
    } catch (e) {
      console.error(`Error processing Gmail message ${msg.id}:`, e);
    }
  }

  return { emails, attachmentCount };
}

// ── Main handler ──

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active, monitored Gmail configurations
    const { data: configs, error: cfgErr } = await supabase
      .from("email_configurations")
      .select("*")
      .eq("is_active", true)
      .eq("monitored", true)
      .eq("provider_type", "gmail");

    if (cfgErr || !configs?.length) {
      return new Response(JSON.stringify({ message: "No active Gmail configs", configs: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let gmailToken: string | null = null;
    try {
      gmailToken = await getGmailAccessToken();
    } catch (e) {
      console.error("Gmail OAuth failed:", e);
      return new Response(JSON.stringify({ error: "Gmail OAuth token refresh failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const config of configs) {
      try {
        const { emails, attachmentCount } = await pollGmailInbox(
          config.email_address, gmailToken!, config.last_polled_at, supabase, config.business_id,
        );

        let ticketsCreated = 0;
        for (const email of emails) {
          try {
            const processRes = await fetch(`${supabaseUrl}/functions/v1/ticket-email-processor`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
              body: JSON.stringify({ ...email, business_id: config.business_id }),
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
          fetched: emails.length,
          attachments: attachmentCount,
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
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
