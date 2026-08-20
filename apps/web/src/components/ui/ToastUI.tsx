interface ToastUIProps {
  title: string;
  description?: string;
  variant: "success" | "error" | "warning";
}

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export const ToastUI = ({ title, description, variant }: ToastUIProps) => {
  //   const isSuccess = variant === "success";

  const config = {
    success: {
      outerRing: "bg-green-100",
      innerRing: "bg-green-200",
      iconBg: "bg-green-600",
      Icon: CheckCircle2,
      titleColor: "text-gray-900",
    },
    error: {
      outerRing: "bg-red-100",
      innerRing: "bg-red-200",
      iconBg: "bg-red-600",
      Icon: XCircle,
      titleColor: "text-gray-900",
    },
    warning: {
      outerRing: "bg-yellow-100",
      innerRing: "bg-yellow-200",
      iconBg: "bg-yellow-600",
      Icon: AlertTriangle,
      titleColor: "text-gray-900",
    },
  }[variant];

  const { outerRing, innerRing, iconBg, Icon, titleColor } = config;

  return (
    <div className="flex flex-col items-center text-center px-4 py-3 min-w-[220px] max-w-[330px]">
      {/* Cyclic icon rings */}
      <div
        className={`w-14 h-14 rounded-full ${outerRing} flex items-center justify-center mb-3`}
      >
        <div
          className={`w-10 h-10 rounded-full ${innerRing} flex items-center justify-center`}
        >
          <div
            className={`w-7 h-7 rounded-full ${iconBg} flex items-center justify-center`}
          >
            <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Text */}
      <p className={`text-sm font-semibold ${titleColor} leading-snug`}>
        {title}
      </p>
      {description && (
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
