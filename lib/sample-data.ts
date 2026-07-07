import { createEncounterTemplateLinks, defaultPlayerNames } from "@/lib/game-templates";
import { getFallbackPokemon } from "@/lib/pokemon";
import type { LinkStatus, PlayerName, SoulLink } from "@/lib/types";

export const encounterTemplateLinks = createEncounterTemplateLinks();

const players = defaultPlayerNames;

type SeededRow = {
  linkNumber: number;
  area: string;
  pokemon: Partial<Record<PlayerName, string>>;
  status: LinkStatus;
};

const seededRows: SeededRow[] = [
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
    linkNumber: 7,
    area: "Route 3",
    pokemon: { Nayan: "Fraxure", Shivank: "Gastrodon" },
    status: "Dead"
  },
  {
    linkNumber: 9,
    area: "Pinwheel Forest Inside",
    pokemon: { Shivank: "Horsea" },
    status: "Alive"
  },
  {
    linkNumber: 10,
    area: "Striaton",
    pokemon: { Shivank: "Budew", Srikar: "Magnezone" },
    status: "Alive"
  }
];

export const starterLinks: SoulLink[] = encounterTemplateLinks.map((templateLink) => {
  const seededRow = seededRows.find((row) => row.linkNumber === templateLink.linkNumber);

  if (!seededRow) {
    return templateLink;
  }

  return {
    ...templateLink,
    area: seededRow.area,
    status: seededRow.status,
    members: players.reduce(
      (members, player) => ({
        ...members,
        [player]: seededRow.pokemon[player]
          ? getFallbackPokemon(seededRow.pokemon[player] as string)
          : null
      }),
      {} as SoulLink["members"]
    )
  };
});
