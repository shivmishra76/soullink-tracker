import pokemonNames from "@/lib/pokemon-names";
import type { PokemonSummary, PokemonType } from "@/lib/types";

const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon";

const spriteForId = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const pokemonBlackTypeOverrides: Record<number, PokemonType[]> = {
  35: ["normal"],
  36: ["normal"],
  39: ["normal"],
  40: ["normal"],
  122: ["psychic"],
  173: ["normal"],
  174: ["normal"],
  175: ["normal"],
  176: ["normal", "flying"],
  183: ["water"],
  184: ["water"],
  209: ["normal"],
  210: ["normal"],
  280: ["psychic"],
  281: ["psychic"],
  282: ["psychic"],
  298: ["normal"],
  303: ["steel"],
  439: ["psychic"],
  468: ["normal", "flying"],
  546: ["grass"],
  547: ["grass"]
};

const normalizeName = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[.'’]/g, "");

export const genFivePokemon = pokemonNames.map((name, index) => ({
  id: index + 1,
  name
}));

export function formatPokemonName(name: string) {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getPokemonIdByName(name: string) {
  const normalized = normalizeName(name);
  return genFivePokemon.find((pokemon) => normalizeName(pokemon.name) === normalized)
    ?.id;
}

export function getFallbackPokemon(name: string): PokemonSummary | null {
  const id = getPokemonIdByName(name);

  if (!id) {
    return null;
  }

  return {
    id,
    name: formatPokemonName(name),
    types: pokemonBlackTypeOverrides[id] ?? [],
    sprite: spriteForId(id)
  };
}

export async function fetchPokemon(nameOrId: string | number): Promise<PokemonSummary> {
  const response = await fetch(`${POKEAPI_BASE_URL}/${nameOrId.toString().toLowerCase()}`);

  if (!response.ok) {
    throw new Error("Pokemon not found");
  }

  const data = await response.json();

  if (data.id < 1 || data.id > 649) {
    throw new Error("Only Gen 1-5 Pokemon are supported");
  }

  const currentTypes = data.types
    .sort((a: { slot: number }, b: { slot: number }) => a.slot - b.slot)
    .map((typeEntry: { type: { name: PokemonType } }) => typeEntry.type.name)
    .filter((type: string): type is PokemonType => type !== "fairy");

  return {
    id: data.id,
    name: formatPokemonName(data.name),
    types: pokemonBlackTypeOverrides[data.id] ?? currentTypes,
    sprite:
      data.sprites.other?.["official-artwork"]?.front_default ??
      data.sprites.front_default ??
      spriteForId(data.id)
  };
}

export async function resolvePokemon(name: string) {
  const id = getPokemonIdByName(name);
  return fetchPokemon(id ?? normalizeName(name));
}
