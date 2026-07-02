import type { LinkStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<LinkStatus, string> = {
  Alive: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  Dead: "border-red-400/30 bg-red-400/10 text-red-200",
  Boxed: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  Pending: "border-yellow-400/30 bg-yellow-400/10 text-yellow-100"
};

export function StatusBadge({ status }: { status: LinkStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
}
