"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { PokemonSearchInput } from "@/components/pokemon-search-input";
import { TypeBadge } from "@/components/type-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchPokemon, getPokemonIdByName } from "@/lib/pokemon";
import type { PlayerName, SoulLink, SoulLinkMember } from "@/lib/types";
import { validateSoulLinkTypes } from "@/lib/validation";

const players: PlayerName[] = ["Nayan", "Shivank", "Srikar"];

type FormState = {
  linkNumber: string;
  area: string;
  pokemon: Record<PlayerName, string>;
};

const initialForm: FormState = {
  linkNumber: "",
  area: "",
  pokemon: {
    Nayan: "",
    Shivank: "",
    Srikar: ""
  }
};

type AddEncounterFormProps = {
  links: SoulLink[];
  onAddLink: (link: SoulLink) => void | Promise<void>;
};

export function AddEncounterForm({ links, onAddLink }: AddEncounterFormProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [preview, setPreview] = useState<Record<PlayerName, SoulLinkMember>>({
    Nayan: null,
    Shivank: null,
    Srikar: null
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validation = useMemo(
    () => validateSoulLinkTypes(Object.values(preview)),
    [preview]
  );

  const setPokemon = async (player: PlayerName, value: string) => {
    setForm((current) => ({
      ...current,
      pokemon: { ...current.pokemon, [player]: value }
    }));
    setMessage("");

    const id = getPokemonIdByName(value);

    if (!value.trim() || !id) {
      setPreview((current) => ({ ...current, [player]: null }));
      return;
    }

    try {
      const pokemon = await fetchPokemon(id);
      setPreview((current) => ({ ...current, [player]: pokemon }));
    } catch {
      setPreview((current) => ({ ...current, [player]: null }));
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const linkNumber = Number(form.linkNumber);

      if (!Number.isInteger(linkNumber) || linkNumber < 1) {
        setMessage("Link number must be a positive whole number.");
        return;
      }

      if (links.some((link) => link.linkNumber === linkNumber)) {
        setMessage("That link number already exists.");
        return;
      }

      if (!form.area.trim()) {
        setMessage("Area is required.");
        return;
      }

      const membersEntries = await Promise.all(
        players.map(async (player) => {
          const name = form.pokemon[player].trim();

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
      const members = Object.fromEntries(membersEntries) as SoulLink["members"];
      const typeValidation = validateSoulLinkTypes(Object.values(members));

      if (!typeValidation.isValid) {
        setMessage(
          `Invalid Soul Link. Duplicate type detected: ${typeValidation.duplicateTypes.join(", ")}.`
        );
        return;
      }

      await onAddLink({
        id: `link-${linkNumber}-${Date.now()}`,
        linkNumber,
        area: form.area.trim(),
        members,
        status: "Pending"
      });
      setForm(initialForm);
      setPreview({ Nayan: null, Shivank: null, Srikar: null });
      setMessage("Link added as Pending.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-panel rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-white">Add New Link</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 lg:grid-cols-[8rem_minmax(10rem,1fr)_repeat(3,minmax(11rem,1fr))_auto] lg:items-end" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="linkNumber">Link Number</Label>
            <Input
              id="linkNumber"
              type="number"
              min={1}
              value={form.linkNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  linkNumber: event.target.value
                }))
              }
              placeholder="e.g. 10"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="area">Area</Label>
            <Input
              id="area"
              value={form.area}
              onChange={(event) =>
                setForm((current) => ({ ...current, area: event.target.value }))
              }
              placeholder="e.g. Route 4"
            />
          </div>

          {players.map((player) => (
            <div key={player} className="grid gap-2">
              <Label htmlFor={`${player}-pokemon`}>{player} Pokemon</Label>
              <PokemonSearchInput
                id={`${player}-pokemon`}
                value={form.pokemon[player]}
                onChange={(value) => setPokemon(player, value)}
                placeholder="Search Pokemon..."
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

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isLoading || !validation.isValid}>
              <Plus className="mr-2 h-4 w-4" />
              {isLoading ? "Adding..." : "Add Link"}
            </Button>
          </div>

          {!validation.isValid && (
            <div className="rounded-md border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm text-yellow-100 lg:col-span-full">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Invalid Soul Link
              </p>
              <p className="mt-1">
                Duplicate type detected: {validation.duplicateTypes.join(", ")}
              </p>
            </div>
          )}

          {message && (
            <p className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-zinc-200 lg:col-span-full">
              {message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
