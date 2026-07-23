import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Validate URL to prevent open redirect attacks
const isValidDestinationUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// Detect device type from user agent
const detectDeviceType = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return "mobile";
  }
  if (/tablet|ipad/i.test(ua)) {
    return "tablet";
  }
  return "desktop";
};

// Detect browser from user agent
const detectBrowser = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  if (ua.includes("chrome") && !ua.includes("edg")) return "Chrome";
  if (ua.includes("firefox")) return "Firefox";
  if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
  if (ua.includes("edg")) return "Edge";
  if (ua.includes("opera") || ua.includes("opr")) return "Opera";
  return "Other";
};

// Generate IP hash for privacy
const generateIpHash = async (ip: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "short-link-salt-2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug, referrer, user_agent } = await req.json();

    if (!slug || typeof slug !== "string") {
      return new Response(
        JSON.stringify({ error: "Slug is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for inserting clicks
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch short link by slug
    const { data: shortLink, error: fetchError } = await supabase
      .from("short_links")
      .select("*")
      .eq("slug", slug)
      .single();

    if (fetchError || !shortLink) {
      return new Response(
        JSON.stringify({ error: "Link not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validate destination URL (prevent open redirect)
    if (!isValidDestinationUrl(shortLink.destination_url)) {
      console.error("Invalid destination URL:", shortLink.destination_url);
      return new Response(
        JSON.stringify({ error: "Invalid destination URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Get client IP for hashing
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("cf-connecting-ip") 
      || "unknown";

    // 4. Record click in link_clicks table
    const ua = user_agent || "";
    const ipHash = await generateIpHash(clientIp);
    
    // Use link_id if available, otherwise use the short_link.id as fallback
    // (link_clicks.link_id is NOT NULL, so we need a value)
    const linkId = shortLink.link_id || shortLink.id;

    const { error: insertError } = await supabase.from("link_clicks").insert({
      link_id: linkId,
      short_link_id: shortLink.id,
      referrer: referrer || null,
      user_agent: ua || null,
      ip_hash: ipHash,
      browser: detectBrowser(ua),
      device_type: detectDeviceType(ua),
    });

    if (insertError) {
      console.error("Error recording click:", insertError);
      // Don't fail the redirect, just log the error
    }

    // 5. Return destination URL for client-side redirect
    return new Response(
      JSON.stringify({ destination_url: shortLink.destination_url }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in resolve-short-link:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
