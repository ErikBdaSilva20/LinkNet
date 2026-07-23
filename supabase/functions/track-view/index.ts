import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const detectBrowser = (ua: string): string => {
  if (!ua) return "unknown";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Other";
};

const detectDevice = (ua: string): string => {
  if (!ua) return "unknown";
  if (/Mobile|Android|iPhone/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
};

const generateIpHash = async (ip: string): Promise<string> => {
  const salt = Deno.env.get("IP_HASH_SALT") || "linkbio-daily-salt";
  const dailySalt = salt + "-" + new Date().toDateString();
  const data = new TextEncoder().encode(ip + dailySalt);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { page_id, referrer, user_agent } = await req.json();

    if (!page_id) {
      return new Response(
        JSON.stringify({ error: "page_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract IP and generate hash
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ip_hash = await generateIpHash(ip);

    // Detect browser and device
    const browser = detectBrowser(user_agent || "");
    const device_type = detectDevice(user_agent || "");

    // Insert into database using service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("page_views").insert({
      page_id,
      referrer: referrer || null,
      user_agent: user_agent || null,
      ip_hash,
      browser,
      device_type,
    });

    if (error) {
      console.error("Error inserting page view:", error);
      return new Response(
        JSON.stringify({ error: "Failed to record view" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Track view error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
