import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("Send WhatsApp test message via edge function", async () => {
  const url = `${SUPABASE_URL}/functions/v1/whatsapp-test-send`;
  
  console.log("Calling:", url);
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to: "+919894806302",
      message: "👋 Hello! This is a test message from NextWeb OS WhatsApp integration. If you received this, the system is working correctly! ✅"
    }),
  });

  const body = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", body);
});
