
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  role: string;
  active: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get request data
    const payload: CreateUserPayload = await req.json();
    const { email, password, name, role, active } = payload;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user in Supabase Auth
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for testing
      user_metadata: {
        full_name: name,
      },
      app_metadata: {
        active: active,
      },
    });

    if (createError) {
      throw createError;
    }

    if (!userData.user) {
      throw new Error("User creation failed");
    }

    const userId = userData.user.id;

    // Add role to user_roles table
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({
        user_id: userId,
        role: role.toLowerCase(),
        updated_at: new Date().toISOString(),
      });

    if (roleError) {
      throw roleError;
    }

    return new Response(
      JSON.stringify({
        id: userId,
        email,
        name,
        role,
        active,
        message: "User created successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
