import toast from "react-hot-toast";
import { ToastUI } from "./ToastUI";

// ─── Types
interface ShowToastOptions {
  title: string;
  description?: string;
  variant: "success" | "error" | "warning";
  duration?: number;
}

export const showToast = ({
  title,
  description,
  variant,
  duration = 4000,
}: ShowToastOptions) => {
  toast.custom(
    (t) => (
      <div
        className={`bg-white rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 ${
          t.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <ToastUI title={title} description={description} variant={variant} />
      </div>
    ),
    {
      duration,
      position: "top-center",
    },
  );
};
