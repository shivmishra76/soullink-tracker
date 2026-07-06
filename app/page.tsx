"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
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
import { encounterTemplateLinks, starterLinks } from "@/lib/sample-data";
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
const defaultRun: SoulRun = { id: soulLinkRunId, name: "Pokemon Black" };

export default function Home() {
  const [links, setLinks] = useState<SoulLink[]>(starterLinks);
  const [runs, setRuns] = useState<SoulRun[]>([defaultRun]);
  const [activeRunId, setActiveRunId] = useState(() => {
    if (typeof window === "undefined") {
      return soulLinkRunId;
    }

    return window.localStorage.getItem(selectedRunStorageKey) ?? soulLinkRunId;
  });
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [syncMessage, setSyncMessage] = useState(
    isSupabaseConfigured ? "Connecting..." : "Local mode"
  );

  const activeRun = runs.find((run) => run.id === activeRunId) ?? runs[0] ?? defaultRun;

  useEffect(() => {
    window.localStorage.setItem(selectedRunStorageKey, activeRunId);
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
          if (remoteRuns.some((run) => run.id === current)) {
            return current;
          }

          const storedRunId = window.localStorage.getItem(selectedRunStorageKey);

          if (storedRunId && remoteRuns.some((run) => run.id === storedRunId)) {
            return storedRunId;
          }

          return soulLinkRunId;
        });
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
    if (!isSupabaseConfigured) {
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

  const addLink = async (link: SoulLink) => {
    setLinks((current) =>
      [...current, link].sort((a, b) => a.linkNumber - b.linkNumber)
    );
    setIsAddingLink(false);

    if (!isSupabaseConfigured) {
      return;
    }

    try {
      await createSoulLink(activeRunId, link);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Could not add link");
      setLinks((current) => current.filter((currentLink) => currentLink.id !== link.id));
    }
  };

  const updateStatus = async (id: string, status: LinkStatus) => {
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
      await updateSoulLink(activeRunId, updatedLink);
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
      await updateSoulLink(activeRunId, updatedLink);
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
    const previousLink = links.find((link) => link.id === id);

    setLinks((current) => current.filter((link) => link.id !== id));

    if (!isSupabaseConfigured) {
      return;
    }

    try {
      await deleteSoulLink(activeRunId, id);
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

  const createNewRun = async () => {
    const name = window.prompt("Name this run", `Pokemon Black Run ${runs.length + 1}`);

    if (!name?.trim()) {
      return;
    }

    const run = { id: createRunId(name), name: name.trim() };

    if (!isSupabaseConfigured) {
      setRuns((current) => [...current, run]);
      setActiveRunId(run.id);
      setLinks(encounterTemplateLinks);
      return;
    }

    try {
      const createdRun = await createSoulRun(run);
      await resetSoulLinksFromTemplate(createdRun.id);
      const [remoteRuns, remoteLinks] = await Promise.all([
        fetchSoulRuns(),
        fetchSoulLinks(createdRun.id)
      ]);
      setRuns(remoteRuns);
      setActiveRunId(createdRun.id);
      setLinks(remoteLinks);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Could not create run");
    }
  };

  const renameRun = async () => {
    const name = window.prompt("Rename this run", activeRun?.name ?? "Pokemon Black");

    if (!name?.trim()) {
      return;
    }

    if (!isSupabaseConfigured) {
      setRuns((current) =>
        current.map((run) =>
          run.id === activeRunId ? { ...run, name: name.trim() } : run
        )
      );
      return;
    }

    try {
      await updateSoulRunName(activeRunId, name.trim());
      setRuns(await fetchSoulRuns());
      setSyncMessage(`Shared run: ${name.trim()}`);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Could not rename run");
    }
  };

  const clearCurrentRun = async () => {
    const shouldClear = window.confirm(
      `Clear every row from ${activeRun?.name ?? "this run"}? This cannot be undone.`
    );

    if (!shouldClear) {
      return;
    }

    const previousLinks = links;
    setLinks([]);

    if (!isSupabaseConfigured) {
      return;
    }

    try {
      await clearSoulLinks(activeRunId);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Could not clear run");
      setLinks(previousLinks);
    }
  };

  const resetCurrentRun = async () => {
    const shouldReset = window.confirm(
      `Reset ${activeRun?.name ?? "this run"} from the encounter template? Current rows will be replaced.`
    );

    if (!shouldReset) {
      return;
    }

    const previousLinks = links;
    setLinks(encounterTemplateLinks);

    if (!isSupabaseConfigured) {
      return;
    }

    try {
      await resetSoulLinksFromTemplate(activeRunId);
      setLinks(await fetchSoulLinks(activeRunId));
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Could not reset run");
      setLinks(previousLinks);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34rem),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_28rem),#030712]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 py-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-200">
              Pokemon Black randomized run
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              SoulLink Tracker
            </h1>
          </div>
          <div className="flex flex-col gap-2 lg:items-end">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="min-w-56">
                <Select value={activeRunId} onValueChange={setActiveRunId}>
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
              <Button type="button" size="sm" onClick={createNewRun}>
                <Plus className="mr-2 h-4 w-4" />
                New Run
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={renameRun}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={resetCurrentRun}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Template
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-red-400/30 text-red-200 hover:bg-red-400/10 hover:text-red-100"
                onClick={clearCurrentRun}
              >
                <Eraser className="mr-2 h-4 w-4" />
                Clear Run
              </Button>
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
            <AddEncounterForm links={links} onAddLink={addLink} />
          </div>
        )}

        <div>
          <SoulLinkTable
            links={links}
            onStatusChange={updateStatus}
            onLinkUpdate={updateLink}
            onLinkDelete={deleteLink}
            onLinksHydrated={setLinks}
          />
        </div>
      </div>
    </main>
  );
}
