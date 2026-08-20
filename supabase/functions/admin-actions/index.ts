// supabase/functions/admin-actions/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || serviceRoleKey;

    // 1. Verify that the caller is an authenticated administrator
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: { user: callerUser }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !callerUser) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Initialize admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Check admin role in profiles
    const { data: callerProfile, error: profileErr } = await adminClient
      .from("profiles")
      .select("role, full_name")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (profileErr || !callerProfile || callerProfile.role !== "admin") {
      return new Response(
        JSON.stringify({ success: false, message: "Forbidden: Admin privileges required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json();
    const { action } = payload;

    // ── ACTION: create_member ───────────────────────────────────────────────────
    if (action === "create_member") {
      const { full_name, email, phone, referral_code } = payload;
      if (!full_name || !email) {
        return new Response(
          JSON.stringify({ success: false, message: "Full name and email are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate secure temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + "Ag!9";

      // 1. Create auth user
      const { data: authData, error: createErr } = await adminClient.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name, phone }
      });

      if (createErr) throw createErr;
      const newUser = authData.user;
      if (!newUser) throw new Error("Failed to create user account.");

      // 2. Resolve referrer if referral code provided
      let referrerId = null;
      if (referral_code?.trim()) {
        const { data: refUser } = await adminClient
          .from("profiles")
          .select("id")
          .eq("referral_code", referral_code.trim().toUpperCase())
          .maybeSingle();
        if (refUser) referrerId = refUser.id;
      }

      // 3. Update profile record
      await adminClient
        .from("profiles")
        .update({
          full_name,
          referred_by: referrerId
        })
        .eq("id", newUser.id);

      // 4. Assign Member ID
      const { data: memberId } = await adminClient.rpc("get_or_create_green_card_member_id", {
        p_user_id: newUser.id,
        p_join_year: new Date().getFullYear()
      });

      // 5. Create active Green Card subscription
      await adminClient.from("subscriptions").insert({
        user_id: newUser.id,
        plan: "green_card",
        status: "active",
        started_at: new Date().toISOString(),
        expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Member ${full_name} successfully registered.`,
          data: {
            user_id: newUser.id,
            email: newUser.email,
            member_id: memberId,
            temp_password: tempPassword
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: reset_password ──────────────────────────────────────────────────
    if (action === "reset_password") {
      const { user_id, email } = payload;
      if (!user_id && !email) {
        return new Response(
          JSON.stringify({ success: false, message: "User ID or email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let targetUserId = user_id;
      let targetEmail = email;

      if (!targetUserId) {
        const { data: targetUser } = await adminClient
          .from("profiles")
          .select("id")
          .eq("email", email.trim().toLowerCase())
          .maybeSingle();
        if (!targetUser) throw new Error("User not found for provided email.");
        targetUserId = targetUser.id;
      }

      const tempPassword = Math.random().toString(36).slice(-8) + "Rx!8";

      const { error: resetErr } = await adminClient.auth.admin.updateUserById(
        targetUserId,
        { password: tempPassword }
      );

      if (resetErr) throw resetErr;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Password reset successful.",
          data: {
            user_id: targetUserId,
            email: targetEmail,
            temp_password: tempPassword
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: credit_slots ────────────────────────────────────────────────────
    if (action === "credit_slots") {
      const { user_id, slots, project_category } = payload;
      if (!user_id || !slots || slots < 1) {
        return new Response(
          JSON.stringify({ success: false, message: "Invalid user or slot quantity" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const category = project_category || "Mushroom Village";
      const SLOT_FEE = 1000;
      const SETUP_FEE = 3500;
      const SUPPORT_FEE = 500;
      const txRef = `ADMIN_CREDIT_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      // 1. Insert slot subscription
      const { error: slotErr } = await adminClient.from("slot_subscriptions").insert({
        user_id,
        amount: slots * SLOT_FEE,
        slotprice: SLOT_FEE,
        slots,
        status: "active",
        project_category: category,
        last_payment_date: new Date().toISOString(),
        next_payment_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString()
      });

      if (slotErr) throw slotErr;

      // 2. Insert setup & support logs in other_payments
      const { error: payErr } = await adminClient.from("other_payments").insert([
        {
          user_id,
          payment_type: "farm_setup",
          amount: slots * SETUP_FEE,
          months: 1,
          slots,
          project_category: category,
          status: "success",
          transaction_ref: txRef
        },
        {
          user_id,
          payment_type: "farm_support",
          amount: slots * SUPPORT_FEE,
          months: 1,
          slots,
          project_category: category,
          status: "success",
          transaction_ref: txRef
        }
      ]);

      if (payErr) throw payErr;

      return new Response(
        JSON.stringify({
          success: true,
          message: `Successfully credited ${slots} ${category} slots.`
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: update_member ───────────────────────────────────────────────────
    if (action === "update_member") {
      const { user_id, full_name, phone, member_id, referral_code, role } = payload;
      if (!user_id) {
        return new Response(
          JSON.stringify({ success: false, message: "User ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updatePayload: Record<string, any> = {};
      if (full_name !== undefined) updatePayload.full_name = full_name.trim();
      if (phone !== undefined) updatePayload.phone = phone.trim();
      if (member_id !== undefined) updatePayload.member_id = member_id.trim();
      if (referral_code !== undefined) updatePayload.referral_code = referral_code.trim().toUpperCase();
      if (role !== undefined) updatePayload.role = role;

      const { error: updateErr } = await adminClient
        .from("profiles")
        .update(updatePayload)
        .eq("id", user_id);

      if (updateErr) throw updateErr;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Member profile updated successfully."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: update_config ───────────────────────────────────────────────────
    if (action === "update_config") {
      const { key, value } = payload;
      if (!key || value === undefined) {
        return new Response(
          JSON.stringify({ success: false, message: "Key and value are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: cfgErr } = await adminClient.from("system_configs").upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: callerUser.id
      });

      if (cfgErr) throw cfgErr;

      return new Response(
        JSON.stringify({ success: true, message: `Configuration '${key}' updated successfully.` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
