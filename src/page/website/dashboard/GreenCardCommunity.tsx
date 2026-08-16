import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { toPng } from "html-to-image";
import {
  Sprout,
  Users,
  Copy,
  PartyPopper,
  IdCard,
  Lock,
  Download,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/ToastComponent";
import { supabase } from "@/lib/supabaseClient";
import { SITE_URL } from "@/config/Index";
import { LANDSCAPE_CARD_SIZE, PORTRAIT_CARD_SIZE } from "@/constant/greenCard";
import GreenCardImage from "@/components/webComponents/GreenCardImage";

const TIER_SIZE = 50;
const CARD_FILENAME = "agroheal-green-card.png";
const DESKTOP_QUERY = "(min-width: 640px)";

interface CommunityMember {
  id: string;
  full_name: string | null;
  member_id: string | null;
  joined_at: string;
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// Scales a fixed-pixel-size preview down to fit its container's actual
// width, so the card stays fully visible (no horizontal scrolling) at any
// screen size while the exported PNG keeps rendering at native resolution.
const useFitScale = (contentWidth: number) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const updateScale = () => {
      setScale(Math.min(1, el.offsetWidth / contentWidth));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, [contentWidth]);

  return [ref, scale] as const;
};

const GreenCardCommunity = () => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia(DESKTOP_QUERY).matches,
  );
  const [landscapePreviewRef, landscapePreviewScale] = useFitScale(
    LANDSCAPE_CARD_SIZE.width,
  );
  const [portraitPreviewRef, portraitPreviewScale] = useFitScale(
    PORTRAIT_CARD_SIZE.width,
  );
  const [loading, setLoading] = useState(true);
  const [hasGreenCard, setHasGreenCard] = useState(false);
  const [generatingCard, setGeneratingCard] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string>("");
  const [memberSince, setMemberSince] = useState<string>("");
  const [communitySize, setCommunitySize] = useState<number>(1);
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>(
    [],
  );

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { data: greenCard } = await supabase
        .from("subscriptions")
        .select("expires_at, started_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .eq("plan", "green_card")
        .maybeSingle();

      const isActive =
        !!greenCard && new Date(greenCard.expires_at) > new Date();

      if (!isActive) {
        setHasGreenCard(false);
        setLoading(false);
        return;
      }

      setHasGreenCard(true);
      setMemberSince(
        new Date(greenCard.started_at).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      );

      const [
        { data: profile },
        { data: size, error: sizeError },
        { data: members, error: membersError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("referral_code, member_id")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.rpc("get_green_card_community_size", {
          leader_id: user.id,
        }),
        supabase.rpc("get_green_card_community_members", {
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

      if (membersError) {
        console.error(
          "get_green_card_community_members failed",
          membersError,
        );
      }

      setCommunitySize(typeof size === "number" ? size : 1);
      setCommunityMembers(Array.isArray(members) ? members : []);

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      } else {
        const { data: newReferralCode, error: referralCodeError } =
          await supabase.rpc("get_or_create_referral_code", {
            p_user_id: user.id,
          });
        if (referralCodeError) {
          console.error("Referral code assignment failed", referralCodeError);
        } else if (typeof newReferralCode === "string") {
          setReferralCode(newReferralCode);
        }
      }

      if (profile?.member_id) {
        setMemberId(profile.member_id);
      } else {
        const { data: newMemberId, error: memberIdError } =
          await supabase.rpc("get_or_create_green_card_member_id", {
            p_user_id: user.id,
            p_join_year: new Date(greenCard.started_at).getFullYear(),
          });
        if (memberIdError) {
          console.error("Member ID assignment failed", memberIdError);
        } else if (typeof newMemberId === "string") {
          setMemberId(newMemberId);
        }
      }

      setLoading(false);
    };

    load();
  }, [navigate]);

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const referralLink = referralCode
    ? `${SITE_URL}/signup?ref=${referralCode}`
    : "";

  const generateCardBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
    const response = await fetch(dataUrl);
    return response.blob();
  };

  const handleDownloadCard = async () => {
    setGeneratingCard(true);
    try {
      const blob = await generateCardBlob();
      if (!blob) return;
      downloadBlob(blob, CARD_FILENAME);
    } catch (error) {
      console.error("Card download failed", error);
      showToast({
        variant: "error",
        title: "Couldn't generate your card",
        description: "Please try again.",
      });
    } finally {
      setGeneratingCard(false);
    }
  };

  const handleShareCard = async () => {
    setGeneratingCard(true);
    try {
      const blob = await generateCardBlob();
      if (!blob) return;
      const file = new File([blob], CARD_FILENAME, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Agroheal Green Card",
          text: "Join my Agroheal Green Card Community!",
        });
      } else {
        downloadBlob(blob, CARD_FILENAME);
        showToast({
          variant: "success",
          title: "Card downloaded",
          description:
            "Sharing isn't supported on this browser — share the downloaded image from your files.",
        });
      }
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        console.error("Card share failed", error);
        showToast({
          variant: "error",
          title: "Couldn't share your card",
          description: "Please try again.",
        });
      }
    } finally {
      setGeneratingCard(false);
    }
  };

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

  if (!hasGreenCard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-6 h-6 text-green-700" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Get your Green Card to unlock this
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Your Green Card Community — your affiliate link, member count,
            and free ginger seedling progress — unlocks once you secure your
            Agroheal Green Card.
          </p>
          <Button
            onClick={() => navigate("/subscribe")}
            className="w-full h-11 bg-green-800 text-white hover:bg-green-700 rounded-xl font-semibold"
          >
            <IdCard className="w-4 h-4 mr-2" />
            Get your Green Card — ₦1,000
          </Button>
        </div>
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

        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          {/* Visible preview — landscape on larger screens, portrait on mobile
              for readability, both scaled to fit their container width. */}
          {isDesktop ? (
            <div
              ref={landscapePreviewRef}
              className="w-full overflow-hidden rounded-3xl"
            >
              <div
                className="mx-auto overflow-hidden rounded-3xl"
                style={{
                  width: LANDSCAPE_CARD_SIZE.width * landscapePreviewScale,
                  height: LANDSCAPE_CARD_SIZE.height * landscapePreviewScale,
                }}
              >
                <div
                  style={{
                    width: LANDSCAPE_CARD_SIZE.width,
                    height: LANDSCAPE_CARD_SIZE.height,
                    transform: `scale(${landscapePreviewScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <GreenCardImage
                    memberId={memberId || "AGC-PENDING"}
                    memberSince={memberSince}
                    referralLink={referralLink}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div
              ref={portraitPreviewRef}
              className="w-full overflow-hidden rounded-3xl"
            >
              <div
                className="mx-auto overflow-hidden rounded-3xl"
                style={{
                  width: PORTRAIT_CARD_SIZE.width * portraitPreviewScale,
                  height: PORTRAIT_CARD_SIZE.height * portraitPreviewScale,
                }}
              >
                <div
                  style={{
                    width: PORTRAIT_CARD_SIZE.width,
                    height: PORTRAIT_CARD_SIZE.height,
                    transform: `scale(${portraitPreviewScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <GreenCardImage
                    variant="portrait"
                    memberId={memberId || "AGC-PENDING"}
                    memberSince={memberSince}
                    referralLink={referralLink}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Hidden, always full-resolution landscape copy — this is what gets
              captured for download/share, so the exported card always keeps
              the same shape regardless of which preview is currently shown. */}
          <div className="pointer-events-none absolute -left-[9999px] top-0" aria-hidden="true">
            <GreenCardImage
              ref={cardRef}
              memberId={memberId || "AGC-PENDING"}
              memberSince={memberSince}
              referralLink={referralLink}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              onClick={handleDownloadCard}
              disabled={generatingCard}
              className="flex-1 h-11 bg-green-800 text-white hover:bg-green-700 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleShareCard}
              disabled={generatingCard}
              variant="outline"
              className="flex-1 h-11 rounded-xl"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
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

        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
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

          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Your referrals ({communityMembers.length})
            </p>
            {communityMembers.length === 0 ? (
              <p className="text-sm text-gray-500 rounded-xl bg-gray-50 border border-gray-100 p-4">
                No referrals yet — share your affiliate link above to start
                building your community.
              </p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {communityMembers.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Users className="w-3.5 h-3.5 text-green-700" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {member.full_name || "Green Card member"}
                        </p>
                        {member.member_id && (
                          <p className="text-xs text-gray-500">
                            {member.member_id}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(member.joined_at).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
