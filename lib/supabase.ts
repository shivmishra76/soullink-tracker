import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import {
  createEncounterTemplateLinks,
  defaultGameId,
  defaultPlayerNames
} from "@/lib/game-templates";
import { fetchPokemon } from "@/lib/pokemon";
import type {
  LinkStatus,
  PlayerName,
  PokemonSummary,
  SoulLink,
  SoulRun
} from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseProjectUrl = supabaseUrl ? new URL(supabaseUrl).origin : undefined;

export const soulLinkRunId =
  process.env.NEXT_PUBLIC_SOULLINK_RUN_ID ?? defaultGameId;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseProjectUrl as string, supabaseAnonKey as string)
  : null;

type SoulLinkRow = {
  id: string;
  run_id: string;
  link_number: number;
  area: string;
  status: LinkStatus;
  members: SoulLink["members"];
};

type SoulRunRow = {
  id: string;
  name: string;
  game_id?: string | null;
  player_names?: PlayerName[] | null;
  created_at?: string;
  updated_at?: string;
};

function normalizePlayerNames(playerNames?: PlayerName[] | null) {
  const names = (playerNames ?? defaultPlayerNames)
    .map((name) => name.trim())
    .filter(Boolean);

  return names.length >= 2 ? names.slice(0, 4) : defaultPlayerNames;
}

function toRow(link: SoulLink, runId: string): SoulLinkRow {
  return {
    id: link.id,
    run_id: runId,
    link_number: link.linkNumber,
    area: link.area,
    status: link.status,
    members: link.members
  };
}

function fromRow(row: SoulLinkRow): SoulLink {
  return {
    id: row.id,
    linkNumber: row.link_number,
    area: row.area,
    status: row.status,
    members: row.members
  };
}

function fromRunRow(row: SoulRunRow): SoulRun {
  return {
    id: row.id,
    name: row.name,
    gameId: row.game_id ?? defaultGameId,
    playerNames: normalizePlayerNames(row.player_names),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function sortLinks(links: SoulLink[]) {
  return [...links].sort((a, b) => a.linkNumber - b.linkNumber);
}

function sortRuns(runs: SoulRun[]) {
  return [...runs].sort((a, b) => a.name.localeCompare(b.name));
}

export function createRunId(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);

  return `${slug || "run"}-${Date.now()}`;
}

export async function hydrateLinkPokemon(
  link: SoulLink,
  playerNames: PlayerName[]
): Promise<SoulLink> {
  const entries = await Promise.all(
    playerNames.map(async (player) => {
      const member = link.members[player];

      if (!member || member.types.length > 0) {
        return [player, member ?? null] as const;
      }

      try {
        return [player, await fetchPokemon(member.id)] as const;
      } catch {
        return [player, member] as const;
      }
    })
  );

  return {
    ...link,
    members: Object.fromEntries(entries) as Record<
      PlayerName,
      PokemonSummary | null
    >
  };
}

function linksForRun(
  runId: string,
  gameId = defaultGameId,
  playerNames = defaultPlayerNames,
  links = createEncounterTemplateLinks(gameId, playerNames)
) {
  return links.map((link) => ({
    ...link,
    id: `${runId}-${link.id}`
  }));
}

export async function fetchSoulRuns() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("soul_runs")
    .select("id, name, game_id, player_names, created_at, updated_at");

  if (error) {
    throw error;
  }

  return sortRuns((data ?? []).map((row) => fromRunRow(row as SoulRunRow)));
}

export async function ensureDefaultRun() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("soul_runs")
    .select("id, name, game_id, player_names, created_at, updated_at")
    .eq("id", soulLinkRunId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return fromRunRow(data as SoulRunRow);
  }

  return createSoulRun({
    id: soulLinkRunId,
    name: "Pokemon Black",
    gameId: defaultGameId,
    playerNames: defaultPlayerNames
  });
}

export async function createSoulRun(run: Pick<SoulRun, "id" | "name" | "gameId" | "playerNames">) {
  if (!supabase) {
    return run;
  }

  const { data, error } = await supabase
    .from("soul_runs")
    .insert({
      id: run.id,
      name: run.name,
      game_id: run.gameId,
      player_names: run.playerNames
    })
    .select("id, name, game_id, player_names, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return fromRunRow(data as SoulRunRow);
}

export async function updateSoulRunName(runId: string, name: string) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("soul_runs")
    .update({ name })
    .eq("id", runId);

  if (error) {
    throw error;
  }
}

export async function fetchSoulLinks(runId: string) {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("soul_links")
    .select("id, run_id, link_number, area, status, members")
    .eq("run_id", runId)
    .order("link_number", { ascending: true });

  if (error) {
    throw error;
  }

  return sortLinks((data ?? []).map((row) => fromRow(row as SoulLinkRow)));
}

export async function seedSoulLinks(
  runId: string,
  gameId = defaultGameId,
  playerNames = defaultPlayerNames,
  seedLinks = createEncounterTemplateLinks(gameId, playerNames)
) {
  if (!supabase) {
    return;
  }

  const hydratedLinks = await Promise.all(
    linksForRun(runId, gameId, playerNames, seedLinks).map((link) =>
      hydrateLinkPokemon(link, playerNames)
    )
  );
  const { error } = await supabase
    .from("soul_links")
    .insert(hydratedLinks.map((link) => toRow(link, runId)));

  if (error) {
    throw error;
  }
}

export async function resetSoulLinksFromTemplate(
  runId: string,
  gameId = defaultGameId,
  playerNames = defaultPlayerNames
) {
  await clearSoulLinks(runId);
  await seedSoulLinks(runId, gameId, playerNames);
}

export async function createSoulLink(runId: string, link: SoulLink) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("soul_links").insert(toRow(link, runId));

  if (error) {
    throw error;
  }
}

export async function updateSoulLink(runId: string, link: SoulLink) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("soul_links")
    .update(toRow(link, runId))
    .eq("id", link.id)
    .eq("run_id", runId);

  if (error) {
    throw error;
  }
}

export async function deleteSoulLink(runId: string, id: string) {
  if (!supabase) {
    return;
  }

  const { data, error } = await supabase
    .from("soul_links")
    .delete()
    .eq("id", id)
    .eq("run_id", runId)
    .select("id");

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("Delete did not remove a row. Refresh and try again.");
  }
}

export async function clearSoulLinks(runId: string) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("soul_links").delete().eq("run_id", runId);

  if (error) {
    throw error;
  }
}

export function subscribeToSoulLinks(
  runId: string,
  onChange: () => void
): RealtimeChannel | null {
  if (!supabase) {
    return null;
  }

  return supabase
    .channel(`soul-links:${runId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "soul_links",
        filter: `run_id=eq.${runId}`
      },
      onChange
    )
    .subscribe();
}

export function subscribeToSoulRuns(onChange: () => void): RealtimeChannel | null {
  if (!supabase) {
    return null;
  }

  return supabase
    .channel("soul-runs")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "soul_runs"
      },
      onChange
    )
    .subscribe();
}
