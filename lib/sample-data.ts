import { getFallbackPokemon } from "@/lib/pokemon";
import type { LinkStatus, PlayerName, SoulLink } from "@/lib/types";

const players: PlayerName[] = ["Nayan", "Shivank", "Srikar"];

type TemplateRow = {
  area: string;
  pokemon?: Partial<Record<PlayerName, string>>;
  status?: LinkStatus;
};

const rows: TemplateRow[] = [
  {
    area: "Starter",
    pokemon: { Nayan: "Mewtwo", Shivank: "Froslass", Srikar: "Charizard" },
    status: "Alive"
  },
  {
    area: "Route 1",
    pokemon: { Nayan: "Gliscor", Shivank: "Tympole", Srikar: "Honchkrow" },
    status: "Dead"
  },
  {
    area: "Route 2",
    pokemon: { Nayan: "Pansage", Shivank: "Chinchou", Srikar: "Swellow" },
    status: "Dead"
  },
  {
    area: "Dreamyard Static",
    pokemon: { Nayan: "Galvantula", Shivank: "Clefairy", Srikar: "Tauros" },
    status: "Boxed"
  },
  {
    area: "Dreamyard Grass",
    pokemon: { Nayan: "Stoutland", Shivank: "Electrike", Srikar: "Venusaur" },
    status: "Dead"
  },
  { area: "Wellspring Cave" },
  {
    area: "Route 3",
    pokemon: { Nayan: "Fraxure", Shivank: "Gastrodon" },
    status: "Dead"
  },
  { area: "Pinwheel Forest Outside" },
  {
    area: "Pinwheel Forest Inside",
    pokemon: { Shivank: "Horsea" },
    status: "Alive"
  },
  {
    area: "Striaton",
    pokemon: { Shivank: "Budew", Srikar: "Magnezone" },
    status: "Alive"
  },
  { area: "Castelia" },
  { area: "Route 4" },
  { area: "Desert Resort" },
  { area: "Relic Castle" },
  { area: "Route 5" },
  { area: "Driftveil Drawbridge" },
  { area: "Cold Storage" },
  { area: "Route 6" },
  { area: "Chargestone Cave" },
  { area: "Route 7" },
  { area: "Celestial Tower" },
  { area: "Mistralton Cave" },
  { area: "Guidance Chamber" },
  { area: "Twist Mountain" },
  { area: "Icirrus City" },
  { area: "Dragonspiral Tower" },
  { area: "Moor of Icirrus" },
  { area: "Route 8" },
  { area: "Tubeline Bridge" },
  { area: "Route 9" },
  { area: "Route 10" },
  { area: "Victory Road" },
  { area: "Trial Chamber" },
  { area: "Route 11" },
  { area: "Village Bridge" },
  { area: "Route 12" },
  { area: "Route 13" },
  { area: "Giant Chasm" },
  { area: "Route 14" },
  { area: "Abundant Shrine" },
  { area: "Route 15" },
  { area: "Marvelous Bridge" },
  { area: "Route 16" },
  { area: "Lostlorn Forest" },
  { area: "Route 17" },
  { area: "Route 18" },
  { area: "P2 Laboratory" },
  { area: "Undella Town" },
  { area: "Undella Bay" },
  { area: "Challenger's Cave" }
];

export const encounterTemplateLinks: SoulLink[] = rows.map((row, index) => ({
  id: `template-link-${index + 1}`,
  linkNumber: index + 1,
  area: row.area,
  status: row.status ?? "Pending",
  members: players.reduce(
    (members, player) => ({
      ...members,
      [player]: row.pokemon?.[player]
        ? getFallbackPokemon(row.pokemon[player] as string)
        : null
    }),
    {} as SoulLink["members"]
  )
}));

export const starterLinks = encounterTemplateLinks;
