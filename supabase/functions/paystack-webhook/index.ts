import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const paystackSignature = req.headers.get("x-paystack-signature");
  const rawBody = await req.text();

  // ── Verify webhook is actually from Paystack ──────────
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY")!;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(rawBody),
  );
  const hashArray = Array.from(new Uint8Array(signature));
  const computedHash = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computedHash !== paystackSignature) {
    return new Response("Unauthorized", { status: 401 });
  }

  const event = JSON.parse(rawBody);

  // ── Handle events ─────────────────────────────────────
  switch (event.event) {
    // Green Card purchase — only ever fires for payments explicitly
    // tagged as a Green Card purchase (metadata.plan === "green_card").
    // Any other Paystack charge (slots, other payments, etc.) is ignored
    // here so it can never grant Green Card access as a side effect.
    case "charge.success": {
      const { reference, amount, metadata } = event.data;
      if (metadata?.plan !== "green_card") break;

      const userId = metadata?.custom_fields?.find(
        (f: any) => f.variable_name === "user_id",
      )?.value;

      if (!userId) break;

      const now = new Date();
      const expires = new Date();
      expires.setFullYear(now.getFullYear() + 100);

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: "green_card",
          status: "active",
          started_at: now.toISOString(),
          expires_at: expires.toISOString(),
        },
        { onConflict: "user_id" },
      );

      const { error: memberIdError } = await supabase.rpc(
        "get_or_create_green_card_member_id",
        { p_user_id: userId, p_join_year: now.getFullYear() },
      );
      if (memberIdError) {
        console.error("Member ID assignment failed:", memberIdError);
      }

      try {
        await supabase.from("payment_logs").insert({
          user_id: userId,
          reference,
          provider: "paystack",
          amount: amount / 100,
          status: "success",
          created_at: now.toISOString(),
        });
      } catch (err) {
        console.error("Log failed:", err);
      }
      break;
    }

    // Green Card payment failed — same explicit-tag guard as above, so a
    // failed unrelated charge never expires someone's real Green Card.
    case "charge.failed": {
      const { metadata } = event.data;
      if (metadata?.plan !== "green_card") break;

      const userId = metadata?.custom_fields?.find(
        (f: any) => f.variable_name === "user_id",
      )?.value;

      if (!userId) break;

      await supabase
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("user_id", userId);

      try {
        await supabase.from("payment_logs").insert({
          user_id: userId,
          reference: event.data.reference,
          provider: "paystack",
          amount: event.data.amount / 100,
          status: "failed",
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Log failed:", err);
      }
      break;
    }

    // Referral withdrawal / transfer
    case "transfer.success": {
      const { reference, amount, recipient } = event.data;

      await supabase
        .from("withdrawals")
        .update({ status: "completed" })
        .eq("reference", reference);
      break;
    }

    case "transfer.failed":
    case "transfer.reversed": {
      const { reference } = event.data;

      await supabase
        .from("withdrawals")
        .update({ status: "failed" })
        .eq("reference", reference);
      break;
    }

    default:
      console.log("Unhandled event:", event.event);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
