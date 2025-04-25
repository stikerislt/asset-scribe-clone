
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

    // First, check if the user already exists in auth system
    const { data: existingUsers } = await supabase.auth.admin.listUsers({
      filter: `email.eq.${email}`
    });
    
    let userId;
    let isNewUser = false;
    
    if (existingUsers?.users && existingUsers.users.length > 0) {
      // User already exists, use the existing ID
      userId = existingUsers.users[0].id;
      console.log("User already exists in auth system, using existing ID:", userId);
    } else {
      console.log("Creating new user in auth system");
      isNewUser = true;
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

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();
    
    if (!existingProfile) {
      try {
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
          // If it's a duplicate key error, try updating instead
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
            }
          }
        }
      } catch (error) {
        console.error("Exception in profile creation:", error);
      }
    }

    // Check if tenant membership exists
    const { data: existingMembership } = await supabase
      .from("tenant_memberships")
      .select("id")
      .eq("user_id", userId)
      .eq("tenant_id", tenant_id)
      .single();
    
    if (!existingMembership) {
      // Add tenant membership - Important: set is_primary and is_owner to false for new users
      console.log("Creating tenant membership with tenant_id:", tenant_id);
      const { error: membershipError } = await supabase
        .from("tenant_memberships")
        .insert({
          user_id: userId,
          tenant_id: tenant_id,
          role: role.toLowerCase(),
          is_primary: false,  // Never make new users primary by default
          is_owner: false    // Never make new users owners by default
        });

      if (membershipError) {
        console.error("Error creating tenant membership:", membershipError);
      }
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
