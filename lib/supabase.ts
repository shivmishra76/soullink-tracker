import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import { fetchPokemon } from "@/lib/pokemon";
import type { LinkStatus, PlayerName, PokemonSummary, SoulLink } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseProjectUrl = supabaseUrl
  ? new URL(supabaseUrl).origin
  : undefined;

export const soulLinkRunId =
  process.env.NEXT_PUBLIC_SOULLINK_RUN_ID ?? "pokemon-black";

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

const players: PlayerName[] = ["Nayan", "Shivank", "Srikar"];

function toRow(link: SoulLink): SoulLinkRow {
  return {
    id: link.id,
    run_id: soulLinkRunId,
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

function sortLinks(links: SoulLink[]) {
  return [...links].sort((a, b) => a.linkNumber - b.linkNumber);
}

export async function hydrateLinkPokemon(link: SoulLink): Promise<SoulLink> {
  const entries = await Promise.all(
    players.map(async (player) => {
      const member = link.members[player];

      if (!member || member.types.length > 0) {
        return [player, member] as const;
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
    members: Object.fromEntries(entries) as Record<PlayerName, PokemonSummary | null>
  };
}

export async function fetchSoulLinks() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("soul_links")
    .select("id, run_id, link_number, area, status, members")
    .eq("run_id", soulLinkRunId)
    .order("link_number", { ascending: true });

  if (error) {
    throw error;
  }

  return sortLinks((data ?? []).map((row) => fromRow(row as SoulLinkRow)));
}

export async function seedSoulLinks(seedLinks: SoulLink[]) {
  if (!supabase) {
    return;
  }

  const { data, error } = await supabase
    .from("soul_links")
    .select("id")
    .eq("run_id", soulLinkRunId)
    .limit(1);

  if (error) {
    throw error;
  }

  if ((data ?? []).length > 0) {
    return;
  }

  const hydratedLinks = await Promise.all(seedLinks.map(hydrateLinkPokemon));
  const { error: insertError } = await supabase
    .from("soul_links")
    .insert(hydratedLinks.map(toRow));

  if (insertError) {
    throw insertError;
  }
}

export async function createSoulLink(link: SoulLink) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("soul_links").insert(toRow(link));

  if (error) {
    throw error;
  }
}

export async function updateSoulLink(link: SoulLink) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("soul_links")
    .update(toRow(link))
    .eq("id", link.id)
    .eq("run_id", soulLinkRunId);

  if (error) {
    throw error;
  }
}

export async function deleteSoulLink(id: string) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("soul_links")
    .delete()
    .eq("id", id)
    .eq("run_id", soulLinkRunId);

  if (error) {
    throw error;
  }
}

export function subscribeToSoulLinks(onChange: () => void): RealtimeChannel | null {
  if (!supabase) {
    return null;
  }

  return supabase
    .channel(`soul-links:${soulLinkRunId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "soul_links",
        filter: `run_id=eq.${soulLinkRunId}`
      },
      onChange
    )
    .subscribe();
}
