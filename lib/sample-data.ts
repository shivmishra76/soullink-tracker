import { getFallbackPokemon } from "@/lib/pokemon";
import type { LinkStatus, PlayerName, SoulLink } from "@/lib/types";

const players: PlayerName[] = ["Nayan", "Shivank", "Srikar"];

const rows: Array<{
  linkNumber: number;
  area: string;
  pokemon: Partial<Record<PlayerName, string>>;
  status: LinkStatus;
}> = [
  {
    linkNumber: 1,
    area: "Starter",
    pokemon: { Nayan: "Mewtwo", Shivank: "Froslass", Srikar: "Charizard" },
    status: "Alive"
  },
  {
    linkNumber: 2,
    area: "Route 1",
    pokemon: { Nayan: "Gliscor", Shivank: "Tympole", Srikar: "Honchkrow" },
    status: "Dead"
  },
  {
    linkNumber: 3,
    area: "Route 2",
    pokemon: { Nayan: "Pansage", Shivank: "Chinchou", Srikar: "Swellow" },
    status: "Dead"
  },
  {
    linkNumber: 4,
    area: "Dreamyard Static",
    pokemon: { Nayan: "Galvantula", Shivank: "Clefairy", Srikar: "Tauros" },
    status: "Boxed"
  },
  {
    linkNumber: 5,
    area: "Dreamyard Grass",
    pokemon: { Nayan: "Stoutland", Shivank: "Electrike", Srikar: "Venusaur" },
    status: "Dead"
  },
  {
    linkNumber: 6,
    area: "Route 3",
    pokemon: { Nayan: "Fraxure", Shivank: "Gastrodon" },
    status: "Dead"
  },
  {
    linkNumber: 7,
    area: "Cave",
    pokemon: { Nayan: "Ponyta", Shivank: "Accelgor", Srikar: "Seaking" },
    status: "Alive"
  },
  {
    linkNumber: 8,
    area: "Striaton",
    pokemon: { Shivank: "Budew", Srikar: "Magnezone" },
    status: "Alive"
  },
  {
    linkNumber: 9,
    area: "Pinwheel Forest",
    pokemon: { Shivank: "Horsea" },
    status: "Alive"
  }
];

export const starterLinks: SoulLink[] = rows.map((row) => ({
  id: `link-${row.linkNumber}`,
  linkNumber: row.linkNumber,
  area: row.area,
  status: row.status,
  members: players.reduce(
    (members, player) => ({
      ...members,
      [player]: row.pokemon[player]
        ? getFallbackPokemon(row.pokemon[player] as string)
        : null
    }),
    {} as SoulLink["members"]
  )
}));
