import type { PokemonType, SoulLinkMember, TypeValidation } from "@/lib/types";

export function validateSoulLinkTypes(
  members: SoulLinkMember[]
): TypeValidation {
  const seen = new Set<PokemonType>();
  const duplicateTypes = new Set<PokemonType>();

  members.forEach((member) => {
    const primaryType = member?.types[0];

    if (!primaryType) {
      return;
    }

    if (seen.has(primaryType)) {
      duplicateTypes.add(primaryType);
    }

    seen.add(primaryType);
  });

  return {
    isValid: duplicateTypes.size === 0,
    duplicateTypes: Array.from(duplicateTypes)
  };
}
