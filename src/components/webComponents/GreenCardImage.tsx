import { forwardRef } from "react";
import QRCode from "react-qr-code";
import { Leaf, IdCard, Calendar, Users } from "lucide-react";
import { AgrohealImages } from "@/constant/Image";
import { LANDSCAPE_CARD_SIZE, PORTRAIT_CARD_SIZE } from "@/constant/greenCard";

interface GreenCardImageProps {
  memberId: string;
  memberSince: string;
  referralLink: string;
  variant?: "landscape" | "portrait";
}

const GreenCardImage = forwardRef<HTMLDivElement, GreenCardImageProps>(
  ({ memberId, memberSince, referralLink, variant = "landscape" }, ref) => {
    if (variant === "portrait") {
      const { width, height } = PORTRAIT_CARD_SIZE;
      return (
        <div
          ref={ref}
          style={{ width, height, fontFamily: "sans-serif" }}
          className="rounded-3xl overflow-hidden shadow-xl flex flex-col bg-[#0b2417]"
        >
          <div className="relative flex-1 px-6 pt-7 pb-5 flex flex-col items-center text-center">
            <div className="absolute top-5 right-5 opacity-90">
              <Leaf className="w-10 h-10 text-lime-400/40" strokeWidth={1.5} />
            </div>

            {/* Logo lockup */}
            <img
              src={AgrohealImages.HeaderLogo}
              alt="Agroheal"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20 mb-3"
            />
            <p className="text-white font-bold text-base leading-tight">
              AgroHEAL
            </p>
            <p className="text-lime-400 font-extrabold text-sm leading-tight tracking-wide mb-2">
              GREEN CARD
            </p>
            <p className="text-white/70 text-[11px] mb-6">
              Grow Healthy Food, Restore Health, Create Wealth.
            </p>

            {/* Headline */}
            <h1 className="text-3xl font-extrabold text-white leading-none mb-1">
              GREEN CARD
            </h1>
            <p className="italic text-white/80 text-sm mb-6">
              Seed of Hope, Future of Communities.
            </p>

            {/* QR code */}
            <div className="bg-white p-2.5 rounded-xl mb-6">
              <QRCode value={referralLink} size={120} />
            </div>

            {/* Member details */}
            <div className="mt-auto flex items-center justify-center gap-8">
              <div>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="w-5 h-5 rounded-full bg-lime-400/20 flex items-center justify-center">
                    <IdCard className="w-3 h-3 text-lime-400" />
                  </span>
                  <p className="text-[10px] text-lime-400 font-bold uppercase tracking-wider">
                    Member ID
                  </p>
                </div>
                <p className="text-sm font-bold text-white">{memberId}</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="w-5 h-5 rounded-full bg-lime-400/20 flex items-center justify-center">
                    <Calendar className="w-3 h-3 text-lime-400" />
                  </span>
                  <p className="text-[10px] text-lime-400 font-bold uppercase tracking-wider">
                    Member Since
                  </p>
                </div>
                <p className="text-sm font-bold text-white">{memberSince}</p>
              </div>
            </div>
          </div>

          {/* Bottom — community photo band */}
          <div
            className="relative h-[150px] bg-cover bg-center flex items-end"
            style={{ backgroundImage: `url(${AgrohealImages.HowItWorksTwo})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative flex items-center gap-2.5 px-6 py-4">
              <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0">
                <Users className="w-3.5 h-3.5 text-[#0b2417]" />
              </div>
              <p className="text-white text-xs font-bold leading-snug text-left">
                TOGETHER, WE GROW HOPE
                <br />
                AND BUILD THRIVING COMMUNITIES.
              </p>
            </div>
          </div>
        </div>
      );
    }

    const { width, height } = LANDSCAPE_CARD_SIZE;
    return (
      <div
        ref={ref}
        style={{ width, height, fontFamily: "sans-serif" }}
        className="rounded-3xl overflow-hidden shadow-xl flex flex-col bg-[#0b2417]"
      >
        {/* Top — dark green content area */}
        <div className="relative flex-1 px-10 pt-8 pb-6 flex flex-col">
          {/* Decorative leaf accent, top-right */}
          <div className="absolute top-6 right-10 opacity-90">
            <Leaf className="w-16 h-16 text-lime-400/40" strokeWidth={1.5} />
          </div>

          {/* Logo lockup */}
          <div className="flex items-center gap-3 mb-5">
            <img
              src={AgrohealImages.HeaderLogo}
              alt="Agroheal"
              className="w-11 h-11 rounded-full object-cover ring-2 ring-white/20"
            />
            <div>
              <p className="text-white font-bold text-lg leading-tight">
                AgroHEAL
              </p>
              <p className="text-lime-400 font-extrabold text-sm leading-tight tracking-wide">
                GREEN CARD
              </p>
            </div>
          </div>
          <p className="text-white/70 text-xs mb-6">
            Grow Healthy Food, Restore Health, Create Wealth.
          </p>

          {/* Headline */}
          <h1 className="text-5xl font-extrabold text-white leading-none mb-2">
            GREEN CARD
          </h1>
          <p className="italic text-white/80 text-base mb-8">
            Seed of Hope, Future of Communities.
          </p>

          {/* Member details + QR */}
          <div className="mt-auto flex items-end justify-between">
            <div className="flex gap-10">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-5 h-5 rounded-full bg-lime-400/20 flex items-center justify-center">
                    <IdCard className="w-3 h-3 text-lime-400" />
                  </span>
                  <p className="text-[11px] text-lime-400 font-bold uppercase tracking-wider">
                    Member ID
                  </p>
                </div>
                <p className="text-lg font-bold text-white">{memberId}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-5 h-5 rounded-full bg-lime-400/20 flex items-center justify-center">
                    <Calendar className="w-3 h-3 text-lime-400" />
                  </span>
                  <p className="text-[11px] text-lime-400 font-bold uppercase tracking-wider">
                    Member Since
                  </p>
                </div>
                <p className="text-lg font-bold text-white">{memberSince}</p>
              </div>
            </div>

            <div className="bg-white p-2 rounded-xl">
              <QRCode value={referralLink} size={90} />
            </div>
          </div>
        </div>

        {/* Bottom — community photo band */}
        <div
          className="relative h-[190px] bg-cover bg-center flex items-end"
          style={{ backgroundImage: `url(${AgrohealImages.HowItWorksTwo})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="relative flex items-center gap-3 px-10 py-5">
            <div className="w-9 h-9 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-[#0b2417]" />
            </div>
            <p className="text-white text-sm font-bold leading-snug">
              TOGETHER, WE GROW HOPE
              <br />
              AND BUILD THRIVING COMMUNITIES.
            </p>
          </div>
        </div>
      </div>
    );
  },
);

GreenCardImage.displayName = "GreenCardImage";

export default GreenCardImage;
