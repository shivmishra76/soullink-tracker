"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { genFivePokemon } from "@/lib/pokemon";

type PokemonSearchInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function PokemonSearchInput({
  id,
  value,
  onChange,
  placeholder = "Search Pokemon..."
}: PokemonSearchInputProps) {
  const [focused, setFocused] = useState(false);

  const options = useMemo(() => {
    const query = value.trim().toLowerCase();

    if (!query) {
      return genFivePokemon.slice(0, 8);
    }

    return genFivePokemon
      .filter((pokemon) => pokemon.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        placeholder={placeholder}
        className="pl-9"
      />
      {focused && options.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border border-white/10 bg-zinc-950 p-1 shadow-xl">
          {options.map((pokemon) => (
            <button
              key={pokemon.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onChange(pokemon.name)}
              className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm text-zinc-100 hover:bg-white/10"
            >
              <span>{pokemon.name}</span>
              <span className="text-xs text-muted-foreground">#{pokemon.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
