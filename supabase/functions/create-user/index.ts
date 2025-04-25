
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
    if (!email || !name || !role || !tenant_id) {
      console.error("Missing required fields:", { email, name, role, tenant_id, passwordProvided: !!password });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // First, check if the tenant exists
    console.log("Checking if tenant exists:", tenant_id);
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      console.error("Tenant not found:", tenantError);
      return new Response(
        JSON.stringify({ error: "Invalid tenant_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists in auth system
    console.log("Checking if user exists in auth system");
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    
    let userId;
    let isNewUser = false;
    
    if (existingUsers?.users?.length > 0) {
      const existingUser = existingUsers.users.find(u => u.email === email);
      if (existingUser) {
        // User already exists, use the existing ID
        userId = existingUser.id;
        console.log("User already exists in auth system, using existing ID:", userId);
      } else {
        isNewUser = true;
      }
    }

    if (isNewUser || !userId) {
      console.log("Creating new user in auth system");
      // Create the user in Supabase Auth with email confirmation required
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
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

      userId = userData.user.id;
      console.log("User created successfully:", userId);
      
      // Send invitation email
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);
      if (inviteError) {
        console.error("Error sending invitation email:", inviteError);
      } else {
        console.log("Invitation email sent successfully to:", email);
      }
    }

    // Create profile with tenant_id
    console.log("Creating user profile with tenant_id:", tenant_id);
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email,
        full_name: name,
        tenant_id: tenant_id
      })
      .select();

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // If it's a duplicate key error, update the existing profile
      if (profileError.message.includes("duplicate key")) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ 
            tenant_id: tenant_id,
            full_name: name,
            email: email 
          })
          .eq("id", userId);
          
        if (updateError) {
          console.error("Error updating existing profile:", updateError);
          throw updateError;
        }
      } else {
        throw profileError;
      }
    }

    // Create tenant membership
    console.log("Creating tenant membership for user:", userId, "in tenant:", tenant_id);
    const { error: membershipError } = await supabase
      .from("tenant_memberships")
      .insert({
        user_id: userId,
        tenant_id: tenant_id,
        role: role.toLowerCase(),
        is_primary: true,  // Set this as primary since it's their first/only tenant
        is_owner: false    // Never make new users owners by default
      });

    if (membershipError) {
      console.error("Error creating tenant membership:", membershipError);
      throw membershipError;
    }

    // Add role to user_roles table
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

    // Verify tenant associations were created correctly
    console.log("Verifying tenant associations for user:", userId);
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select(`
        id,
        tenant_id,
        tenant_memberships!inner(
          tenant_id
        )
      `)
      .eq('id', userId)
      .single();

    if (verifyError || !verifyData) {
      console.error("Error verifying tenant associations:", verifyError);
      throw new Error("Failed to verify tenant associations");
    }

    return new Response(
      JSON.stringify({
        id: userId,
        email,
        name,
        role,
        active,
        tenant_id,
        message: isNewUser ? "User invited successfully" : "User added to organization successfully",
        verification_status: isNewUser ? "invitation_sent" : "existing_user"
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
