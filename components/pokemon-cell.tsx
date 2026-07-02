import Image from "next/image";
import { TypeBadge } from "@/components/type-badge";
import type { SoulLinkMember } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PokemonCell({
  pokemon,
  compact = false
}: {
  pokemon: SoulLinkMember;
  compact?: boolean;
}) {
  if (!pokemon) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className={cn("flex items-center gap-3", compact ? "min-w-0" : "min-w-44")}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md bg-white/[0.08]",
          compact ? "h-10 w-10" : "h-12 w-12"
        )}
      >
        <Image
          src={pokemon.sprite}
          alt={pokemon.name}
          width={44}
          height={44}
          className={cn("object-contain", compact ? "h-9 w-9" : "h-11 w-11")}
        />
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">{pokemon.name}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {pokemon.types.length > 0 ? (
            pokemon.types.map((type) => <TypeBadge key={type} type={type} />)
          ) : (
            <span className="rounded bg-zinc-700 px-2 py-0.5 text-[0.68rem] font-bold uppercase text-zinc-200">
              loading
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
