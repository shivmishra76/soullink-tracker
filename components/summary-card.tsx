import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tones = {
  green: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  red: "text-red-300 bg-red-400/10 border-red-400/20",
  gray: "text-slate-300 bg-slate-400/10 border-slate-400/20",
  cyan: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20"
};

type SummaryCardProps = {
  icon: LucideIcon;
  label: string;
  value: number;
  helper: string;
  tone: keyof typeof tones;
};

export function SummaryCard({
  icon: Icon,
  label,
  value,
  helper,
  tone
}: SummaryCardProps) {
  return (
    <Card className="glass-panel rounded-lg">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold text-white">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className={cn("rounded-md border p-3", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
