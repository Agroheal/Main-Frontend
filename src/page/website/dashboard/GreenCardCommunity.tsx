import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Sprout, Users, Copy, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/ToastComponent";
import { supabase } from "@/lib/supabaseClient";

const TIER_SIZE = 50;

const GreenCardCommunity = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [communitySize, setCommunitySize] = useState<number>(1);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const [{ data: profile }, { data: size, error: sizeError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("referral_code")
            .eq("id", user.id)
            .maybeSingle(),
          supabase.rpc("get_green_card_community_size", {
            leader_id: user.id,
          }),
        ]);

      if (sizeError) {
        console.error("get_green_card_community_size failed", sizeError);
        showToast({
          variant: "error",
          title: "Couldn't load your community",
          description: "Please refresh the page to try again.",
        });
      }

      setReferralCode(profile?.referral_code ?? null);
      setCommunitySize(typeof size === "number" ? size : 1);
      setLoading(false);
    };

    load();
  }, [navigate]);

  const referralLink = referralCode
    ? `${window.location.origin}/signup?ref=${referralCode}`
    : "";

  const tiersUnlocked = Math.floor(communitySize / TIER_SIZE);
  const progressInTier = communitySize % TIER_SIZE;
  const progressPercent = Math.min(
    100,
    Math.round((progressInTier / TIER_SIZE) * 100),
  );
  const remainingToNextTier =
    progressInTier === 0 && communitySize > 0
      ? 0
      : TIER_SIZE - progressInTier;

  const copyReferralLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      showToast({
        variant: "success",
        title: "Link copied",
        description: "Your Green Card affiliate link is on your clipboard.",
      });
    } catch (error) {
      console.error("Copy failed", error);
      showToast({
        variant: "error",
        title: "Copy failed",
        description: "Could not copy the link.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading your community...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster />
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
            My Green Card Community
          </h1>
          <p className="text-sm text-gray-500">
            Invite prospects with your affiliate link. Every 50 Green Card
            holders in your community (including you) unlocks a round of free
            ginger seedlings for everyone in it.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-green-700" />
            <p className="text-sm font-semibold text-gray-900">
              Your affiliate link
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value={referralLink || "Referral code unavailable"}
              className="flex-1 h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              onClick={copyReferralLink}
              disabled={!referralLink}
              className="h-11 bg-green-800 text-white hover:bg-green-700 rounded-xl"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">
              Community progress
            </p>
            <span className="text-sm text-gray-500">
              {communitySize} member{communitySize === 1 ? "" : "s"}
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden mb-2">
            <div
              className="h-full bg-green-700 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mb-6">
            {remainingToNextTier === 0
              ? `You've just hit a milestone of ${TIER_SIZE}!`
              : `${remainingToNextTier} more member${remainingToNextTier === 1 ? "" : "s"} to unlock the next round of free ginger seedlings.`}
          </p>

          <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4">
            <div className="w-9 h-9 rounded-xl bg-white border border-green-100 flex items-center justify-center flex-shrink-0">
              {tiersUnlocked > 0 ? (
                <PartyPopper className="w-4 h-4 text-green-700" />
              ) : (
                <Sprout className="w-4 h-4 text-green-700" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {tiersUnlocked > 0
                  ? `${tiersUnlocked} round${tiersUnlocked === 1 ? "" : "s"} of free ginger seedlings unlocked`
                  : "No rounds unlocked yet"}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {tiersUnlocked > 0
                  ? "Agroheal's team will reach out with next steps for seedling distribution."
                  : `Reach ${TIER_SIZE} Green Card members in your community to unlock your first round.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GreenCardCommunity;
