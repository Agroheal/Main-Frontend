import { forwardRef } from "react";
import QRCode from "react-qr-code";
import { Leaf, Users } from "lucide-react";
import { AgrohealImages } from "@/constant/Image";

interface GreenCardImageProps {
  fullName: string;
  memberId: string;
  memberSince: string;
  referralLink: string;
}

const GreenCardImage = forwardRef<HTMLDivElement, GreenCardImageProps>(
  ({ fullName, memberId, memberSince, referralLink }, ref) => {
    return (
      <div
        ref={ref}
        style={{ width: 900, height: 520, fontFamily: "sans-serif" }}
        className="rounded-3xl overflow-hidden shadow-xl flex flex-col bg-white"
      >
        {/* Top — cream section */}
        <div className="flex-1 bg-[#f8f7f0] flex px-10 py-8 gap-8">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <img
                src={AgrohealImages.HeaderLogo}
                alt="Agroheal"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-green-900 font-bold text-lg leading-tight tracking-wide">
                  AGROHEAL <span className="text-green-700">GREEN CARD</span>
                </p>
                <p className="text-[11px] text-gray-500 leading-tight">
                  Grow Healthy Food. Restore Health. Create Wealth.
                </p>
              </div>
            </div>

            <h1 className="text-4xl font-extrabold text-green-900 leading-none mb-1">
              GREEN CARD
            </h1>
            <p className="italic text-green-700 text-sm mb-8">
              Seed of Hope. Future of Communities.
            </p>

            <div className="mt-auto">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">
                Member Name
              </p>
              <p className="text-xl font-bold text-gray-900 mb-4">
                {fullName}
              </p>

              <div className="flex gap-10">
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider">
                    Member ID
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {memberId}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider">
                    Member Since
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {memberSince}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Leaf className="w-8 h-8 text-green-700" />
            </div>
            <div className="bg-white p-2 rounded-xl border border-gray-200">
              <QRCode value={referralLink} size={110} />
            </div>
          </div>
        </div>

        {/* Bottom — dark green band */}
        <div className="bg-green-900 px-10 py-5 flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-white" />
          </div>
          <p className="text-white text-sm font-medium">
            TOGETHER, WE GROW HOPE AND BUILD THRIVING COMMUNITIES.
          </p>
        </div>
      </div>
    );
  },
);

GreenCardImage.displayName = "GreenCardImage";

export default GreenCardImage;
