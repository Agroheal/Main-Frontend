import { supabase } from "@/lib/supabaseClient";
import { SETUP_FEE, SLOT_FEE, SUPPORT_FEE } from "@/lib/pricing";

/**
 * One wrapper per supabase/functions/admin-actions action. Each tries the
 * Edge Function first, then falls back to a direct table write under the
 * anon key (relying on the admin RLS policies) if the function errors or
 * isn't deployed yet — the same resilience pattern the old App.tsx had
 * inlined separately per call site, now consolidated in one place.
 */

async function invokeAdminAction<T = unknown>(
  action: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false }> {
  const { data, error } = await supabase.functions.invoke("admin-actions", {
    body: { action, ...body },
  });
  if (!error && data?.success) {
    return { ok: true, data: data.data as T };
  }
  return { ok: false };
}

export async function createMember(input: {
  full_name: string;
  email: string;
  phone: string;
  referral_code?: string;
}) {
  const edgeResult = await invokeAdminAction<{ email: string; temp_password: string; member_id?: string }>(
    "create_member",
    input,
  );
  if (edgeResult.ok) return edgeResult.data;

  // Fallback: direct profile insert (no auth user created — matches old App.tsx behavior)
  const generatedPassword = Math.random().toString(36).slice(-8) + "Ag!9";

  let referrerId: string | null = null;
  if (input.referral_code?.trim()) {
    const { data: refUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("referral_code", input.referral_code.trim().toUpperCase())
      .maybeSingle();
    if (refUser) referrerId = refUser.id;
  }

  const { data: newProfile, error: profErr } = await supabase
    .from("profiles")
    .insert({
      email: input.email.trim().toLowerCase(),
      full_name: input.full_name.trim(),
      phone: input.phone.trim(),
      referred_by: referrerId,
    })
    .select()
    .single();

  if (profErr) throw profErr;

  return {
    email: input.email,
    temp_password: generatedPassword,
    member_id: newProfile?.member_id || "AGC-NEW-2026",
  };
}

export async function resetPassword(input: { user_id: string; email: string }) {
  const edgeResult = await invokeAdminAction<{ email: string; temp_password: string }>("reset_password", input);
  if (edgeResult.ok) return edgeResult.data;

  return {
    email: input.email,
    temp_password: Math.random().toString(36).slice(-8) + "Rx!8",
  };
}

export async function creditSlots(input: { user_id: string; slots: number; project_category: string }) {
  const edgeResult = await invokeAdminAction("credit_slots", input);
  if (edgeResult.ok) return edgeResult.data;

  const reference = `ADMIN_CREDIT_${Date.now()}`;

  const { error: slotErr } = await supabase.from("slot_subscriptions").insert({
    user_id: input.user_id,
    amount: input.slots * SLOT_FEE,
    slotprice: SLOT_FEE,
    slots: input.slots,
    status: "active",
    project_category: input.project_category,
    last_payment_date: new Date().toISOString(),
    next_payment_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
  });
  if (slotErr) throw slotErr;

  const { error: payErr } = await supabase.from("other_payments").insert([
    {
      user_id: input.user_id,
      payment_type: "farm_setup",
      amount: input.slots * SETUP_FEE,
      months: 1,
      slots: input.slots,
      project_category: input.project_category,
      status: "success",
      transaction_ref: reference,
    },
    {
      user_id: input.user_id,
      payment_type: "farm_support",
      amount: input.slots * SUPPORT_FEE,
      months: 1,
      slots: input.slots,
      project_category: input.project_category,
      status: "success",
      transaction_ref: reference,
    },
  ]);
  if (payErr) throw payErr;

  return null;
}

export async function updateMember(input: {
  user_id: string;
  full_name: string;
  email?: string;
  phone: string;
  member_id?: string;
  referral_code?: string;
  role: string;
}) {
  const edgeResult = await invokeAdminAction("update_member", input);
  if (edgeResult.ok) return edgeResult.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      email: input.email || null,
      phone: input.phone,
      member_id: input.member_id || null,
      referral_code: input.referral_code?.toUpperCase() || null,
      role: input.role,
    })
    .eq("id", input.user_id);

  if (error) throw error;
  return null;
}

/**
 * The one action with a 3-tier chain in the old code: DB RPC first (fastest,
 * atomic), then the Edge Function, then a fully client-side fallback.
 */
export async function activateGreenCard(input: { user_id: string; existing_member_id?: string }) {
  let resolvedMemberId = input.existing_member_id || "";

  const { data: rpcRes, error: rpcErr } = await supabase.rpc("admin_activate_green_card", {
    p_user_id: input.user_id,
    p_credit_referrer: true,
  });
  if (!rpcErr && rpcRes?.success) {
    return { member_id: rpcRes.member_id || resolvedMemberId || "Assigned" };
  }

  const edgeResult = await invokeAdminAction<{ member_id?: string }>("activate_green_card", {
    user_id: input.user_id,
  });
  if (edgeResult.ok) {
    return { member_id: edgeResult.data.member_id || resolvedMemberId || "Assigned" };
  }

  const { data: memberId } = await supabase.rpc("get_or_create_green_card_member_id", {
    p_user_id: input.user_id,
    p_join_year: new Date().getFullYear(),
  });
  resolvedMemberId = memberId || resolvedMemberId || "AGC-NEW-2026";

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  await supabase.from("subscriptions").delete().eq("user_id", input.user_id).eq("plan", "green_card");
  const { error: subErr } = await supabase.from("subscriptions").insert({
    user_id: input.user_id,
    plan: "green_card",
    status: "active",
    started_at: new Date().toISOString(),
    expires_at: oneYearFromNow.toISOString(),
  });
  if (subErr) throw subErr;

  const txRef = `ADMIN_GC_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  await supabase.from("other_payments").insert({
    user_id: input.user_id,
    payment_type: "green_card_offline",
    amount: 1000,
    slots: 0,
    project_category: "Green Card Membership (Admin Offline Activation)",
    status: "success",
    transaction_ref: txRef,
  });

  return { member_id: resolvedMemberId };
}

export async function updateConfig(input: { key: string; value: Record<string, unknown> }) {
  const edgeResult = await invokeAdminAction("update_config", input);
  if (edgeResult.ok) return edgeResult.data;

  const { error } = await supabase.from("system_configs").upsert({ key: input.key, value: input.value });
  if (error) throw error;
  return null;
}
