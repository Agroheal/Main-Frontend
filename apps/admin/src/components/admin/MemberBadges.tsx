import { ShieldCheck, AlertCircle, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProgramEmoji, getProgramPillClass } from "@/lib/memberFilters";
import type { MemberSlotSummary } from "@/types/admin";

export function GreenCardBadge({ active, size = "sm" }: { active: boolean; size?: "sm" | "xs" }) {
  const iconSize = size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3";
  return active ? (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 font-semibold text-emerald-400",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
      )}
    >
      <ShieldCheck className={iconSize} /> Active
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 font-semibold text-destructive",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
      )}
    >
      <AlertCircle className={iconSize} /> Unpaid
    </span>
  );
}

export function RoleBadge({ role }: { role?: string }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        isAdmin ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {role || "user"}
    </span>
  );
}

export function TotalSlotsBadge({ total }: { total: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
      <Sprout className="h-3 w-3" /> {total} {total === 1 ? "Slot" : "Slots"}
    </span>
  );
}

export function ProgramPills({ programs, size = "sm" }: { programs: MemberSlotSummary[]; size?: "sm" | "xs" }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {programs.map((prog, idx) => (
        <span
          key={idx}
          className={cn(
            "inline-flex items-center rounded-full border font-medium",
            getProgramPillClass(prog.category),
            size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
          )}
        >
          {getProgramEmoji(prog.category)} {prog.category.replace(" Village", "")}: <strong className="ml-0.5">{prog.slots}</strong>
        </span>
      ))}
    </div>
  );
}

