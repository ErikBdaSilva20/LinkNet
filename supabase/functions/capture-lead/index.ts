import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limit (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 5;

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  entry.count++;
  return false;
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { page_id, email, name, phone, custom_fields } = await req.json();

    // Validate required fields
    if (!page_id) {
      return new Response(
        JSON.stringify({ error: "page_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Email is optional now (but validated if provided)
    if (email && !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "E-mail inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Must have at least email or name
    if (!email && !name) {
      return new Response(
        JSON.stringify({ error: "Pelo menos nome ou e-mail é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize inputs
    const sanitizedName = name?.trim().slice(0, 100) || null;
    const sanitizedPhone = phone?.trim().slice(0, 20) || null;
    const sanitizedEmail = email?.toLowerCase().trim() || null;
    
    // Sanitize custom fields (limit to 10 fields, 500 chars each)
    let sanitizedCustomFields: Record<string, string> = {};
    if (custom_fields && typeof custom_fields === "object") {
      const entries = Object.entries(custom_fields).slice(0, 10);
      for (const [key, value] of entries) {
        const k = String(key).slice(0, 50);
        const v = String(value || "").slice(0, 500);
        sanitizedCustomFields[k] = v;
      }
    }

    // Rate limiting by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ error: "Muitas tentativas. Aguarde um momento." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const insertData: Record<string, unknown> = {
      page_id,
      name: sanitizedName,
      email: sanitizedEmail || `no-email-${Date.now()}@placeholder.local`,
      phone: sanitizedPhone,
      custom_fields: Object.keys(sanitizedCustomFields).length > 0 ? sanitizedCustomFields : null,
    };

    const { error: insertError } = await supabase
      .from("leads")
      .insert(insertData);

    if (insertError) {
      if (insertError.code === "23505") {
        return new Response(
          JSON.stringify({ error: "Este e-mail já está cadastrado." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (insertError.code === "23503") {
        return new Response(
          JSON.stringify({ error: "Página não encontrada." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Capture lead error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
