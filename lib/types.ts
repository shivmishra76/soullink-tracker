export type PlayerName = "Nayan" | "Shivank" | "Srikar";

export type PokemonType =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel";

export type LinkStatus = "Alive" | "Dead" | "Boxed" | "Pending";

export type PokemonSummary = {
  id: number;
  name: string;
  types: PokemonType[];
  sprite: string;
};

export type SoulLinkMember = PokemonSummary | null;

export type SoulLink = {
  id: string;
  linkNumber: number;
  area: string;
  members: Record<PlayerName, SoulLinkMember>;
  status: LinkStatus;
};

export type SoulRun = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TypeValidation = {
  isValid: boolean;
  duplicateTypes: PokemonType[];
};
