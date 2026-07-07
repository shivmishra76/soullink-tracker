"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { defaultGameId, gameTemplates } from "@/lib/game-templates";
import type { SoulRun } from "@/lib/types";

type NewRunInput = {
  name: string;
  gameId: string;
  playerNames: string[];
};

type SetupRunScreenProps = {
  runs: SoulRun[];
  syncMessage: string;
  onSelectRun: (runId: string) => void;
  onCreateRun: (input: NewRunInput) => Promise<void> | void;
};

const initialPlayers = ["", "", ""];

export function SetupRunScreen({
  runs,
  syncMessage,
  onSelectRun,
  onCreateRun
}: SetupRunScreenProps) {
  const [selectedRunId, setSelectedRunId] = useState(runs[0]?.id ?? "");
  const [runName, setRunName] = useState("");
  const [gameId, setGameId] = useState(defaultGameId);
  const [playerNames, setPlayerNames] = useState(initialPlayers);
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const selectedGame = useMemo(
    () => gameTemplates.find((template) => template.id === gameId) ?? gameTemplates[0],
    [gameId]
  );

  const updatePlayer = (index: number, value: string) => {
    setPlayerNames((current) =>
      current.map((player, playerIndex) => (playerIndex === index ? value : player))
    );
    setMessage("");
  };

  const addPlayer = () => {
    if (playerNames.length < 4) {
      setPlayerNames((current) => [...current, ""]);
    }
  };

  const removePlayer = (index: number) => {
    if (playerNames.length > 2) {
      setPlayerNames((current) => current.filter((_, playerIndex) => playerIndex !== index));
    }
  };

  const createRun = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setIsCreating(true);

    try {
      const cleanPlayerNames = playerNames.map((name) => name.trim()).filter(Boolean);
      const uniqueNames = new Set(cleanPlayerNames.map((name) => name.toLowerCase()));

      if (!runName.trim()) {
        setMessage("Run name is required.");
        return;
      }

      if (cleanPlayerNames.length < 2 || cleanPlayerNames.length > 4) {
        setMessage("Enter 2 to 4 player names.");
        return;
      }

      if (uniqueNames.size !== cleanPlayerNames.length) {
        setMessage("Player names must be unique.");
        return;
      }

      await onCreateRun({
        name: runName.trim(),
        gameId,
        playerNames: cleanPlayerNames
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create run.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34rem),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_28rem),#030712] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="py-4">
          <p className="text-sm font-medium text-cyan-200">Multiplayer Pokemon Nuzlocke tracker</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            SoulLink Tracker
          </h1>
          <div className="mt-4 inline-flex rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200">
            {syncMessage}
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="glass-panel rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl text-white">Open Existing Run</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="existing-run">Run</Label>
                <Select value={selectedRunId} onValueChange={setSelectedRunId}>
                  <SelectTrigger id="existing-run" className="border-cyan-400/30 bg-cyan-400/10 text-cyan-100">
                    <SelectValue placeholder="Select a run" />
                  </SelectTrigger>
                  <SelectContent>
                    {runs.map((run) => (
                      <SelectItem key={run.id} value={run.id}>
                        {run.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                disabled={!selectedRunId}
                onClick={() => onSelectRun(selectedRunId)}
              >
                <Users className="mr-2 h-4 w-4" />
                Open Run
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl text-white">Create New Run</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={createRun}>
                <div className="grid gap-2">
                  <Label htmlFor="new-run-name">Run Name</Label>
                  <Input
                    id="new-run-name"
                    value={runName}
                    onChange={(event) => setRunName(event.target.value)}
                    placeholder="e.g. Friday Soul Link"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="game-template">Game</Label>
                  <Select value={gameId} onValueChange={setGameId}>
                    <SelectTrigger id="game-template">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {gameTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {selectedGame.region} template · {selectedGame.encounterAreas.length} encounter rows
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Players</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={playerNames.length >= 4}
                      onClick={addPlayer}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Player
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {playerNames.map((player, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={player}
                          onChange={(event) => updatePlayer(index, event.target.value)}
                          placeholder={`Player ${index + 1}`}
                        />
                        {playerNames.length > 2 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => removePlayer(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={isCreating}>
                  <Plus className="mr-2 h-4 w-4" />
                  {isCreating ? "Creating..." : "Create Run"}
                </Button>

                {message && (
                  <p className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-zinc-200">
                    {message}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
