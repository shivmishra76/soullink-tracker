import type { PokemonType, SoulLinkMember, TypeValidation } from "@/lib/types";

export function validateSoulLinkTypes(
  members: SoulLinkMember[]
): TypeValidation {
  const seen = new Set<PokemonType>();
  const duplicateTypes = new Set<PokemonType>();

  members.forEach((member) => {
    member?.types.forEach((type) => {
      if (seen.has(type)) {
        duplicateTypes.add(type);
      }

      seen.add(type);
    });
  });

  return {
    isValid: duplicateTypes.size === 0,
    duplicateTypes: Array.from(duplicateTypes)
  };
}
