"use client";

import { Fragment, useEffect, useState } from "react";
import { AlertTriangle, Check, Pencil, Trash2, X } from "lucide-react";
import { PokemonCell } from "@/components/pokemon-cell";
import { PokemonSearchInput } from "@/components/pokemon-search-input";
import { TypeBadge } from "@/components/type-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { fetchPokemon, getPokemonIdByName } from "@/lib/pokemon";
import type { LinkStatus, PlayerName, SoulLink, SoulLinkMember } from "@/lib/types";
import { cn } from "@/lib/utils";
import { validateSoulLinkTypes } from "@/lib/validation";

const statuses: LinkStatus[] = ["Alive", "Dead", "Boxed", "Pending"];

const rowStatusStyles: Record<LinkStatus, string> = {
  Alive: "bg-emerald-500/[0.07] hover:bg-emerald-500/[0.11]",
  Dead: "bg-red-500/[0.08] hover:bg-red-500/[0.12]",
  Boxed: "bg-slate-500/[0.09] hover:bg-slate-500/[0.13]",
  Pending: "bg-yellow-500/[0.08] hover:bg-yellow-500/[0.12]"
};

const statusSelectStyles: Record<LinkStatus, string> = {
  Alive: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  Dead: "border-red-400/30 bg-red-400/10 text-red-100",
  Boxed: "border-slate-400/30 bg-slate-400/10 text-slate-100",
  Pending: "border-yellow-400/30 bg-yellow-400/10 text-yellow-100"
};

type SoulLinkTableProps = {
  links: SoulLink[];
  playerNames: PlayerName[];
  onStatusChange: (id: string, status: LinkStatus) => void | Promise<void>;
  onLinkUpdate: (link: SoulLink) => void | Promise<void>;
  onLinkDelete: (id: string) => void | Promise<void>;
  onLinksHydrated?: (links: SoulLink[]) => void;
};

export function SoulLinkTable({
  links,
  playerNames,
  onStatusChange,
  onLinkUpdate,
  onLinkDelete,
  onLinksHydrated
}: SoulLinkTableProps) {
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  useEffect(() => {
    if (!onLinksHydrated) {
      return;
    }

    const needsHydration = links.some((link) =>
      playerNames.some((player) => {
        const member = link.members[player];
        return member && member.types.length === 0;
      })
    );

    if (!needsHydration) {
      return;
    }

    let cancelled = false;

    Promise.all(
      links.map(async (link) => {
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
          members: Object.fromEntries(entries) as SoulLink["members"]
        };
      })
    ).then((hydratedLinks) => {
      if (!cancelled) {
        onLinksHydrated(hydratedLinks);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [links, onLinksHydrated, playerNames]);

  return (
    <section className="glass-panel overflow-hidden rounded-lg">
      <div className="border-b border-white/10 p-5">
        <h2 className="text-xl font-semibold text-white">Soul Link Table</h2>
      </div>
      <div className="max-h-[42rem] overflow-auto">
        <table className="w-full min-w-[56rem] table-fixed border-collapse text-left text-sm">
          <colgroup>
            <col className="w-16" />
            <col className="w-[16%]" />
            {playerNames.map((player) => (
              <col key={player} className="w-[18%]" />
            ))}
            <col className="w-44" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-zinc-950/95 text-xs uppercase text-muted-foreground backdrop-blur">
            <tr>
              <th className="px-3 py-3 font-semibold">#</th>
              <th className="px-3 py-3 font-semibold">Area</th>
              {playerNames.map((player) => (
                <th key={player} className="px-3 py-3 font-semibold">
                  {player}
                </th>
              ))}
              <th className="px-3 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => {
              const validation = validateSoulLinkTypes(
                playerNames.map((player) => link.members[player] ?? null)
              );

              return (
                <Fragment key={link.id}>
                  <tr
                    className={cn(
                      "border-t border-white/10 transition-colors",
                      rowStatusStyles[link.status]
                    )}
                  >
                    <td className="px-3 py-3 font-semibold text-white">
                      {link.linkNumber}
                    </td>
                    <td className="px-3 py-3 text-zinc-200">
                      <p className="truncate">{link.area}</p>
                    </td>
                    {playerNames.map((player) => (
                      <td key={player} className="px-3 py-3 align-middle">
                        <PokemonCell pokemon={link.members[player] ?? null} compact />
                      </td>
                    ))}
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-2">
                        <Select
                          value={link.status}
                          onValueChange={(value) =>
                            onStatusChange(link.id, value as LinkStatus)
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "h-8 font-semibold",
                              statusSelectStyles[link.status]
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-full"
                            aria-label={`Edit link ${link.linkNumber}`}
                            onClick={() =>
                              setEditingLinkId((current) =>
                                current === link.id ? null : link.id
                              )
                            }
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-full border-red-400/30 text-red-200 hover:bg-red-400/10 hover:text-red-100"
                            aria-label={`Delete link ${link.linkNumber}`}
                            onClick={() => {
                              const shouldDelete = window.confirm(
                                `Delete link #${link.linkNumber} from ${link.area}?`
                              );

                              if (shouldDelete) {
                                onLinkDelete(link.id);
                                setEditingLinkId((current) =>
                                  current === link.id ? null : current
                                );
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {!validation.isValid && (
                          <p className="flex items-center gap-1 text-xs text-yellow-200">
                            <AlertTriangle className="h-3 w-3" />
                            {validation.duplicateTypes.join(", ")}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                  {editingLinkId === link.id && (
                    <tr className="border-t border-white/10 bg-zinc-950/70">
                      <td colSpan={playerNames.length + 3} className="px-3 py-4">
                        <EditLinkPanel
                          link={link}
                          playerNames={playerNames}
                          onCancel={() => setEditingLinkId(null)}
                          onSave={(updatedLink) => {
                            onLinkUpdate(updatedLink);
                            setEditingLinkId(null);
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type EditLinkPanelProps = {
  link: SoulLink;
  playerNames: PlayerName[];
  onCancel: () => void;
  onSave: (link: SoulLink) => void;
};

function EditLinkPanel({ link, playerNames, onCancel, onSave }: EditLinkPanelProps) {
  const [area, setArea] = useState(link.area);
  const [pokemonNames, setPokemonNames] = useState<Record<PlayerName, string>>(() =>
    Object.fromEntries(
      playerNames.map((player) => [player, link.members[player]?.name ?? ""])
    )
  );
  const [preview, setPreview] = useState<Record<PlayerName, SoulLinkMember>>(() =>
    Object.fromEntries(playerNames.map((player) => [player, link.members[player] ?? null]))
  );
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const validation = validateSoulLinkTypes(Object.values(preview));

  const setPokemon = async (player: PlayerName, value: string) => {
    setPokemonNames((current) => ({ ...current, [player]: value }));
    setMessage("");

    const id = getPokemonIdByName(value);

    if (!value.trim()) {
      setPreview((current) => ({ ...current, [player]: null }));
      return;
    }

    if (!id) {
      return;
    }

    try {
      const pokemon = await fetchPokemon(id);
      setPreview((current) => ({ ...current, [player]: pokemon }));
    } catch {
      setMessage(`Could not load ${value}.`);
    }
  };

  const save = async () => {
    setMessage("");
    setIsSaving(true);

    try {
      if (!area.trim()) {
        setMessage("Area is required.");
        return;
      }

      const memberEntries = await Promise.all(
        playerNames.map(async (player) => {
          const name = pokemonNames[player]?.trim() ?? "";

          if (!name) {
            return [player, null] as const;
          }

          const id = getPokemonIdByName(name);

          if (!id) {
            throw new Error(`${player} Pokemon must be Gen 1-5.`);
          }

          return [player, await fetchPokemon(id)] as const;
        })
      );
      const members = Object.fromEntries(memberEntries) as SoulLink["members"];
      onSave({
        ...link,
        area: area.trim(),
        members
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save link.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 lg:grid-cols-[minmax(10rem,1fr)_repeat(2,minmax(10rem,1fr))_auto] xl:grid-cols-[minmax(10rem,1fr)_repeat(4,minmax(10rem,1fr))_auto] lg:items-end">
      <div className="grid gap-2">
        <Label htmlFor={`area-${link.id}`}>Area</Label>
        <Input
          id={`area-${link.id}`}
          value={area}
          onChange={(event) => setArea(event.target.value)}
        />
      </div>
      {playerNames.map((player) => (
        <div key={player} className="grid gap-2">
          <Label htmlFor={`${link.id}-${player}`}>{player}</Label>
          <PokemonSearchInput
            id={`${link.id}-${player}`}
            value={pokemonNames[player] ?? ""}
            onChange={(value) => setPokemon(player, value)}
          />
          {preview[player] && (
            <div className="flex gap-1">
              {preview[player]?.types.map((type) => (
                <TypeBadge key={type} type={type} />
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="flex gap-2 lg:flex-col">
        <Button type="button" onClick={save} disabled={isSaving}>
          <Check className="mr-2 h-4 w-4" />
          {isSaving ? "Saving" : "Save"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
      {!validation.isValid && (
        <div className="rounded-md border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm text-yellow-100 lg:col-span-full">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Primary Type Warning
          </p>
          <p className="mt-1">
            Duplicate primary type: {validation.duplicateTypes.join(", ")}
          </p>
        </div>
      )}
      {message && (
        <p className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-zinc-200 lg:col-span-full">
          {message}
        </p>
      )}
    </div>
  );
}
