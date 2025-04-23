
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
  tenant_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Starting user creation process");
    
    // Create Supabase admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get request data
    const payload: CreateUserPayload = await req.json();
    const { email, password, name, role, active, tenant_id } = payload;

    // Validate required fields
    if (!email || !password || !name || !role || !tenant_id) {
      console.error("Missing required fields:", { email, name, role, tenant_id, passwordProvided: !!password });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating user in auth system with tenant_id:", tenant_id);
    // Create the user in Supabase Auth
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
      app_metadata: {
        active: active,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      throw createError;
    }

    if (!userData.user) {
      console.error("User creation failed - no user data returned");
      throw new Error("User creation failed");
    }

    const userId = userData.user.id;
    console.log("User created successfully:", userId);

    // Add user to profiles table with tenant_id
    console.log("Adding user to profiles table with tenant_id:", tenant_id);
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email,
        full_name: name,
        tenant_id: tenant_id
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      throw profileError;
    }

    // Add tenant membership
    console.log("Creating tenant membership with tenant_id:", tenant_id);
    const { error: membershipError } = await supabase
      .from("tenant_memberships")
      .insert({
        user_id: userId,
        tenant_id: tenant_id,
        role: role.toLowerCase(),
        is_primary: true
      });

    if (membershipError) {
      console.error("Error creating tenant membership:", membershipError);
      throw membershipError;
    }

    // Add role to user_roles table
    console.log("Setting user role to:", role.toLowerCase());
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({
        user_id: userId,
        role: role.toLowerCase(),
        updated_at: new Date().toISOString(),
      });

    if (roleError) {
      console.error("Error setting user role:", roleError);
      throw roleError;
    }

    return new Response(
      JSON.stringify({
        id: userId,
        email,
        name,
        role,
        active,
        tenant_id,
        message: "User created successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in create-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
