import { typeStyles } from "@/lib/type-colors";
import type { PokemonType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TypeBadge({ type }: { type: PokemonType }) {
  return (
    <span
      className={cn(
        "rounded px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-normal",
        typeStyles[type]
      )}
    >
      {type}
    </span>
  );
}
