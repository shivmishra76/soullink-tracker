import { getFallbackPokemon } from "@/lib/pokemon";
import type { LinkStatus, PlayerName, SoulLink } from "@/lib/types";

const players: PlayerName[] = ["Nayan", "Shivank", "Srikar"];

const encounterAreas = [
  "Starter",
  "Route 1",
  "Route 2",
  "Dreamyard Static",
  "Dreamyard Grass",
  "Wellspring Cave",
  "Route 3",
  "Pinwheel Forest Outside",
  "Pinwheel Forest Inside",
  "Striaton",
  "Castelia",
  "Route 4",
  "Desert Resort",
  "Relic Castle",
  "Route 5",
  "Driftveil Drawbridge",
  "Cold Storage",
  "Route 6",
  "Chargestone Cave",
  "Route 7",
  "Celestial Tower",
  "Mistralton Cave",
  "Guidance Chamber",
  "Twist Mountain",
  "Icirrus City",
  "Dragonspiral Tower",
  "Moor of Icirrus",
  "Route 8",
  "Tubeline Bridge",
  "Route 9",
  "Route 10",
  "Victory Road",
  "Trial Chamber",
  "Route 11",
  "Village Bridge",
  "Route 12",
  "Route 13",
  "Giant Chasm",
  "Route 14",
  "Abundant Shrine",
  "Route 15",
  "Marvelous Bridge",
  "Route 16",
  "Lostlorn Forest",
  "Route 17",
  "Route 18",
  "P2 Laboratory",
  "Undella Town",
  "Undella Bay",
  "Challenger's Cave"
];

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

function emptyMembers(): SoulLink["members"] {
  return players.reduce(
    (members, player) => ({
      ...members,
      [player]: null
    }),
    {} as SoulLink["members"]
  );
}

export const encounterTemplateLinks: SoulLink[] = encounterAreas.map((area, index) => ({
  id: `template-link-${index + 1}`,
  linkNumber: index + 1,
  area,
  status: "Pending",
  members: emptyMembers()
}));

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
