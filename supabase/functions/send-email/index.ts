import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Send Email Edge Function
 *
 * Uses Gmail API via OAuth2 to send emails.
 * Supports TO, CC, BCC, HTML and plain text.
 *
 * POST body:
 * {
 *   to: string | string[],
 *   cc?: string | string[],
 *   bcc?: string | string[],
 *   subject: string,
 *   message: string,        // plain text body
 *   html?: string,          // optional HTML body
 *   from_name?: string,     // display name (default: "NextWeb")
 *   reply_to?: string,
 *   business_id?: string,   // for logging
 * }
 */

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("GMAIL_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GMAIL_OAUTH_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GMAIL_OAUTH_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Gmail OAuth credentials not configured");
  }

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

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to refresh Gmail token: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

function buildMimeMessage(opts: {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  textBody: string;
  htmlBody?: string;
  replyTo?: string;
}): string {
  const boundary = `boundary_${crypto.randomUUID().replace(/-/g, "")}`;
  const lines: string[] = [];

  lines.push(`From: ${opts.from}`);
  lines.push(`To: ${opts.to.join(", ")}`);
  if (opts.cc && opts.cc.length > 0) lines.push(`Cc: ${opts.cc.join(", ")}`);
  if (opts.bcc && opts.bcc.length > 0) lines.push(`Bcc: ${opts.bcc.join(", ")}`);
  lines.push(`Subject: ${opts.subject}`);
  if (opts.replyTo) lines.push(`Reply-To: ${opts.replyTo}`);
  lines.push(`MIME-Version: 1.0`);

  if (opts.htmlBody) {
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    lines.push("");
    lines.push(`--${boundary}`);
    lines.push("Content-Type: text/plain; charset=UTF-8");
    lines.push("");
    lines.push(opts.textBody);
    lines.push(`--${boundary}`);
    lines.push("Content-Type: text/html; charset=UTF-8");
    lines.push("");
    lines.push(opts.htmlBody);
    lines.push(`--${boundary}--`);
  } else {
    lines.push("Content-Type: text/plain; charset=UTF-8");
    lines.push("");
    lines.push(opts.textBody);
  }

  return lines.join("\r\n");
}

function toBase64Url(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  let b64 = "";
  const bytes = new Uint8Array(data);
  for (let i = 0; i < bytes.length; i++) {
    b64 += String.fromCharCode(bytes[i]);
  }
  return btoa(b64).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      to, cc, bcc, subject, message, html,
      from_name, reply_to, business_id,
    } = body;

    if (!to || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "to, subject, and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize recipients to arrays
    const toList = Array.isArray(to) ? to : [to];
    const ccList = cc ? (Array.isArray(cc) ? cc : [cc]) : [];
    const bccList = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [];

    // Get Gmail access token
    const accessToken = await getAccessToken();

    // Get sender email from token info
    const profileRes = await fetch(
      "https://www.googleapis.com/gmail/v1/users/me/profile",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const profile = await profileRes.json();
    const senderEmail = profile.emailAddress || "noreply@nextweb.com.au";
    const displayName = from_name || "NextWeb";

    // Build MIME message
    const mime = buildMimeMessage({
      from: `${displayName} <${senderEmail}>`,
      to: toList,
      cc: ccList.length > 0 ? ccList : undefined,
      bcc: bccList.length > 0 ? bccList : undefined,
      subject,
      textBody: message,
      htmlBody: html || undefined,
      replyTo: reply_to,
    });

    // Send via Gmail API
    const raw = toBase64Url(mime);
    const sendRes = await fetch(
      "https://www.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      }
    );

    if (!sendRes.ok) {
      const errBody = await sendRes.text();
      console.error("Gmail send failed:", errBody);
      return new Response(
        JSON.stringify({ error: "Email send failed", details: errBody }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sendData = await sendRes.json();

    // Log to DB if business_id provided
    if (business_id) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase.from("system_events").insert({
          business_id,
          event_type: "EMAIL_SENT",
          payload_json: {
            to: toList,
            cc: ccList,
            subject,
            gmail_message_id: sendData.id,
          },
        });
      } catch (logErr) {
        console.warn("Email log failed (non-critical):", logErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message_id: sendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
