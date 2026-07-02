import type { PokemonType } from "@/lib/types";

export const typeStyles: Record<PokemonType, string> = {
  normal: "bg-stone-300 text-stone-950",
  fire: "bg-red-500 text-white",
  water: "bg-blue-500 text-white",
  electric: "bg-yellow-300 text-yellow-950",
  grass: "bg-emerald-500 text-white",
  ice: "bg-cyan-200 text-cyan-950",
  fighting: "bg-orange-700 text-white",
  poison: "bg-fuchsia-600 text-white",
  ground: "bg-amber-600 text-white",
  flying: "bg-sky-300 text-sky-950",
  psychic: "bg-pink-500 text-white",
  bug: "bg-lime-500 text-lime-950",
  rock: "bg-stone-500 text-white",
  ghost: "bg-violet-700 text-white",
  dragon: "bg-indigo-600 text-white",
  dark: "bg-zinc-800 text-white",
  steel: "bg-slate-400 text-slate-950"
};
