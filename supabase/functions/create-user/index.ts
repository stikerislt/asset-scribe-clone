
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

    // Create or update profile with tenant_id
    console.log("Creating or updating user profile with tenant_id:", tenant_id);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          email,
          full_name: name,
          tenant_id: tenant_id
        });

      if (profileError) {
        console.error("Error upserting profile:", profileError);
        throw profileError;
      }
      console.log("Profile created or updated successfully for user:", userId);
    } catch (error) {
      console.error("Exception in profile upsert:", error);
      throw error;
    }

    // Create tenant membership
    console.log("Creating tenant membership for user:", userId, "in tenant:", tenant_id);
    try {
      const { error: membershipError } = await supabase
        .from("tenant_memberships")
        .upsert({
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
      console.log("Tenant membership created successfully for user:", userId);
    } catch (error) {
      console.error("Exception in tenant membership upsert:", error);
      throw error;
    }

    // Add role to user_roles table
    try {
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
      console.log("User role set successfully for user:", userId);
    } catch (error) {
      console.error("Exception in user role upsert:", error);
      throw error;
    }

    // Verify tenant associations - but don't use inner join since this is causing the error
    console.log("Verifying tenant associations for user:", userId);
    try {
      // First check if profile exists with correct tenant_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, tenant_id')
        .eq('id', userId)
        .single();
      
      if (profileError || !profileData) {
        console.error("Error verifying profile:", profileError);
        throw new Error("Failed to verify profile");
      }
      
      if (profileData.tenant_id !== tenant_id) {
        console.error("Profile tenant_id mismatch:", profileData.tenant_id, "expected:", tenant_id);
        throw new Error("Profile tenant_id mismatch");
      }
      
      // Then check if tenant membership exists
      const { data: membershipData, error: membershipError } = await supabase
        .from('tenant_memberships')
        .select('tenant_id')
        .eq('user_id', userId)
        .eq('tenant_id', tenant_id)
        .single();
      
      if (membershipError || !membershipData) {
        console.error("Error verifying tenant membership:", membershipError);
        throw new Error("Failed to verify tenant membership");
      }
      
      console.log("Tenant associations verified successfully for user:", userId);
    } catch (error) {
      console.error("Error verifying tenant associations:", error);
      return new Response(
        JSON.stringify({ error: "Failed to verify tenant associations: " + error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
