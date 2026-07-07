"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Check,
  Archive,
  Eraser,
  HeartPulse,
  Pencil,
  Plus,
  RotateCcw,
  Skull,
  X
} from "lucide-react";
import { AddEncounterForm } from "@/components/add-encounter-form";
import { SetupRunScreen } from "@/components/setup-run-screen";
import { SoulLinkTable } from "@/components/soul-link-table";
import { SummaryCard } from "@/components/summary-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  createEncounterTemplateLinks,
  defaultGameId,
  defaultPlayerNames,
  getGameTemplate
} from "@/lib/game-templates";
import { starterLinks } from "@/lib/sample-data";
import {
  clearSoulLinks,
  createRunId,
  createSoulLink,
  createSoulRun,
  deleteSoulLink,
  ensureDefaultRun,
  fetchSoulLinks,
  fetchSoulRuns,
  isSupabaseConfigured,
  resetSoulLinksFromTemplate,
  soulLinkRunId,
  subscribeToSoulLinks,
  subscribeToSoulRuns,
  supabase,
  updateSoulLink,
  updateSoulRunName
} from "@/lib/supabase";
import type { LinkStatus, SoulLink, SoulRun } from "@/lib/types";

const selectedRunStorageKey = "soullink-selected-run";
const defaultRun: SoulRun = {
  id: soulLinkRunId,
  name: "Pokemon Black",
  gameId: defaultGameId,
  playerNames: defaultPlayerNames
};

type NewRunInput = {
  name: string;
  gameId: string;
  playerNames: string[];
};

export default function Home() {
  const [links, setLinks] = useState<SoulLink[]>(starterLinks);
  const [runs, setRuns] = useState<SoulRun[]>([defaultRun]);
  const [activeRunId, setActiveRunId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(selectedRunStorageKey);
  });
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<"clear" | "reset" | null>(null);
  const [syncMessage, setSyncMessage] = useState(
    isSupabaseConfigured ? "Connecting..." : "Local mode"
  );

  const activeRun = activeRunId
    ? runs.find((run) => run.id === activeRunId) ?? null
    : null;
  const activeTemplate = getGameTemplate(activeRun?.gameId ?? defaultGameId);

  useEffect(() => {
    if (!activeRunId) {
      window.localStorage.removeItem(selectedRunStorageKey);
      setConfirmationAction(null);
      return;
    }

    window.localStorage.setItem(selectedRunStorageKey, activeRunId);
    setConfirmationAction(null);
  }, [activeRunId]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let cancelled = false;

    const refreshRuns = async () => {
      try {
        await ensureDefaultRun();
        const remoteRuns = await fetchSoulRuns();

        if (cancelled) {
          return;
        }

        setRuns(remoteRuns.length > 0 ? remoteRuns : [defaultRun]);
        setActiveRunId((current) => {
          if (current && remoteRuns.some((run) => run.id === current)) {
            return current;
          }

          const storedRunId = window.localStorage.getItem(selectedRunStorageKey);

          if (storedRunId && remoteRuns.some((run) => run.id === storedRunId)) {
            return storedRunId;
          }

          return null;
        });
        setSyncMessage("Choose or create a run");
      } catch (error) {
        if (!cancelled) {
          setSyncMessage(
            error instanceof Error ? error.message : "Supabase sync failed"
          );
        }
      }
    };

    refreshRuns();
    const channel = subscribeToSoulRuns(refreshRuns);

    return () => {
      cancelled = true;

      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !activeRunId) {
      return;
    }

    let cancelled = false;

    const refreshLinks = async () => {
      try {
        const remoteLinks = await fetchSoulLinks(activeRunId);

        if (!cancelled) {
          setLinks(remoteLinks);
          setSyncMessage(`Shared run: ${activeRun?.name ?? activeRunId}`);
        }
      } catch (error) {
        if (!cancelled) {
          setSyncMessage(
            error instanceof Error ? error.message : "Supabase sync failed"
          );
        }
      }
    };

    refreshLinks();
    const channel = subscribeToSoulLinks(activeRunId, refreshLinks);

    return () => {
      cancelled = true;

      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [activeRunId, activeRun?.name]);

  const counts = useMemo(
    () => ({
      alive: links.filter((link) => link.status === "Alive").length,
      dead: links.filter((link) => link.status === "Dead").length,
      boxed: links.filter((link) => link.status === "Boxed").length,
      total: links.length
    }),
    [links]
  );

  const selectRun = (runId: string) => {
    const run = runs.find((currentRun) => currentRun.id === runId);

    if (!run) {
      return;
    }

    setActiveRunId(runId);
    setIsAddingLink(false);

    if (!isSupabaseConfigured) {
      setLinks(run.id === defaultRun.id ? starterLinks : createEncounterTemplateLinks(run.gameId, run.playerNames));
    }
  };

  const createRunFromSetup = async ({ name, gameId, playerNames }: NewRunInput) => {
    const run = { id: createRunId(name), name, gameId, playerNames };
    const templateLinks = createEncounterTemplateLinks(gameId, playerNames);

    if (!isSupabaseConfigured) {
      setRuns((current) => [...current, run]);
      setActiveRunId(run.id);
      setLinks(templateLinks);
      setSyncMessage("Local mode");
      return;
    }

    try {
      const createdRun = await createSoulRun(run);
      await resetSoulLinksFromTemplate(createdRun.id, createdRun.gameId, createdRun.playerNames);
      const [remoteRuns, remoteLinks] = await Promise.all([
        fetchSoulRuns(),
        fetchSoulLinks(createdRun.id)
      ]);
      setRuns(remoteRuns);
      setActiveRunId(createdRun.id);
      setLinks(remoteLinks);
      setSyncMessage(`Shared run: ${createdRun.name}`);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Could not create run");
      throw error;
    }
  };

  const addLink = async (link: SoulLink) => {
    if (!activeRun) {
      return;
    }

    setLinks((current) =>
      [...current, link].sort((a, b) => a.linkNumber - b.linkNumber)
    );
    setIsAddingLink(false);

    if (!isSupabaseConfigured) {
      return;
    }

    try {
      await createSoulLink(activeRun.id, link);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Could not add link");
      setLinks((current) => current.filter((currentLink) => currentLink.id !== link.id));
    }
  };

  const updateStatus = async (id: string, status: LinkStatus) => {
    if (!activeRun) {
      return;
    }

    const linkToUpdate = links.find((link) => link.id === id);

    if (!linkToUpdate) {
      return;
    }

    const updatedLink = { ...linkToUpdate, status };

    setLinks((current) =>
      current.map((link) => (link.id === id ? updatedLink : link))
    );

    if (!isSupabaseConfigured) {
      return;
    }

    try {
      await updateSoulLink(activeRun.id, updatedLink);
    } catch (error) {
      setSyncMessage(
        error instanceof Error ? error.message : "Could not update status"
      );
      setLinks((current) =>
        current.map((link) => (link.id === id ? linkToUpdate : link))
      );
    }
  };

  const updateLink = async (updatedLink: SoulLink) => {
    if (!activeRun) {
      return;
    }

    const previousLink = links.find((link) => link.id === updatedLink.id);

    setLinks((current) =>
      current
        .map((link) => (link.id === updatedLink.id ? updatedLink : link))
        .sort((a, b) => a.linkNumber - b.linkNumber)
    );

    if (!isSupabaseConfigured) {
      return;
    }

    try {
      await updateSoulLink(activeRun.id, updatedLink);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Could not save link");

      if (previousLink) {
        setLinks((current) =>
          current
            .map((link) => (link.id === previousLink.id ? previousLink : link))
            .sort((a, b) => a.linkNumber - b.linkNumber)
        );
      }
    }
  };

  const deleteLink = async (id: string) => {
    if (!activeRun) {
      return;
    }

    const previousLink = links.find((link) => link.id === id);

    setLinks((current) => current.filter((link) => link.id !== id));

    if (!isSupabaseConfigured) {
      return;
    }

    try {
      await deleteSoulLink(activeRun.id, id);
    } catch (error) {
      setSyncMessage(
        error instanceof Error ? error.message : "Could not delete link"
      );

      if (previousLink) {
        setLinks((current) =>
          [...current, previousLink].sort((a, b) => a.linkNumber - b.linkNumber)
        );
      }
    }
  };

  const renameRun = async () => {
    if (!activeRun) {
      return;
    }

    const name = window.prompt("Rename this run", activeRun.name);

    if (!name?.trim()) {
      return;
    }

    if (!isSupabaseConfigured) {
      setRuns((current) =>
        current.map((run) =>
          run.id === activeRun.id ? { ...run, name: name.trim() } : run
        )
      );
      return;
    }

    try {
      await updateSoulRunName(activeRun.id, name.trim());
      setRuns(await fetchSoulRuns());
      setSyncMessage(`Shared run: ${name.trim()}`);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Could not rename run");
    }
  };

  const clearCurrentRun = async () => {
    if (!activeRun) {
      return;
    }

    setConfirmationAction(null);

    const previousLinks = links;
    setLinks([]);

    if (!isSupabaseConfigured) {
      return;
    }

    try {
      await clearSoulLinks(activeRun.id);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Could not clear run");
      setLinks(previousLinks);
    }
  };

  const resetCurrentRun = async () => {
    if (!activeRun) {
      return;
    }

    setConfirmationAction(null);

    const previousLinks = links;
    const templateLinks = createEncounterTemplateLinks(activeRun.gameId, activeRun.playerNames);
    setLinks(templateLinks);

    if (!isSupabaseConfigured) {
      return;
    }

    try {
      await resetSoulLinksFromTemplate(activeRun.id, activeRun.gameId, activeRun.playerNames);
      setLinks(await fetchSoulLinks(activeRun.id));
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Could not reset run");
      setLinks(previousLinks);
    }
  };

  if (!activeRun) {
    return (
      <SetupRunScreen
        runs={runs}
        syncMessage={syncMessage}
        onSelectRun={selectRun}
        onCreateRun={createRunFromSetup}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34rem),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_28rem),#030712]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 py-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-200">
              {activeTemplate.name} · {activeRun.playerNames.join(" / ")}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              SoulLink Tracker
            </h1>
          </div>
          <div className="flex flex-col gap-2 lg:items-end">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="min-w-56">
                <Select value={activeRun.id} onValueChange={selectRun}>
                  <SelectTrigger className="h-9 border-cyan-400/30 bg-cyan-400/10 text-cyan-100">
                    <SelectValue placeholder="Select run" />
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
              <div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200">
                {syncMessage}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => setActiveRunId(null)}>
                <Plus className="mr-2 h-4 w-4" />
                New Run
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={renameRun}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </Button>
              {confirmationAction === "reset" ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-yellow-400/30 text-yellow-100 hover:bg-yellow-400/10 hover:text-yellow-50"
                    onClick={resetCurrentRun}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Confirm Reset
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setConfirmationAction(null)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmationAction("reset")}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Template
                </Button>
              )}
              {confirmationAction === "clear" ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-red-400/30 text-red-200 hover:bg-red-400/10 hover:text-red-100"
                    onClick={clearCurrentRun}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Confirm Clear
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setConfirmationAction(null)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-red-400/30 text-red-200 hover:bg-red-400/10 hover:text-red-100"
                  onClick={() => setConfirmationAction("clear")}
                >
                  <Eraser className="mr-2 h-4 w-4" />
                  Clear Run
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant={isAddingLink ? "secondary" : "default"}
                onClick={() => setIsAddingLink((current) => !current)}
              >
                {isAddingLink ? (
                  <X className="mr-2 h-4 w-4" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {isAddingLink ? "Close" : "Add Link"}
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={HeartPulse}
            label="Alive Links"
            value={counts.alive}
            helper="currently active"
            tone="green"
          />
          <SummaryCard
            icon={Skull}
            label="Dead Links"
            value={counts.dead}
            helper="fainted links"
            tone="red"
          />
          <SummaryCard
            icon={Archive}
            label="Boxed Links"
            value={counts.boxed}
            helper="stored away"
            tone="gray"
          />
          <SummaryCard
            icon={Activity}
            label="Total Links"
            value={counts.total}
            helper="all encounters"
            tone="cyan"
          />
        </section>

        {isAddingLink && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <AddEncounterForm
              links={links}
              playerNames={activeRun.playerNames}
              onAddLink={addLink}
            />
          </div>
        )}

        <SoulLinkTable
          links={links}
          playerNames={activeRun.playerNames}
          onStatusChange={updateStatus}
          onLinkUpdate={updateLink}
          onLinkDelete={deleteLink}
          onLinksHydrated={setLinks}
        />
      </div>
    </main>
  );
}
