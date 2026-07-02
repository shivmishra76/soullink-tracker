"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Archive, HeartPulse, Plus, Skull, X } from "lucide-react";
import { AddEncounterForm } from "@/components/add-encounter-form";
import { SoulLinkTable } from "@/components/soul-link-table";
import { SummaryCard } from "@/components/summary-card";
import { Button } from "@/components/ui/button";
import { starterLinks } from "@/lib/sample-data";
import {
  createSoulLink,
  deleteSoulLink,
  fetchSoulLinks,
  isSupabaseConfigured,
  seedSoulLinks,
  soulLinkRunId,
  subscribeToSoulLinks,
  supabase,
  updateSoulLink
} from "@/lib/supabase";
import type { LinkStatus, SoulLink } from "@/lib/types";

export default function Home() {
  const [links, setLinks] = useState<SoulLink[]>(starterLinks);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [syncMessage, setSyncMessage] = useState(
    isSupabaseConfigured ? "Connecting..." : "Local mode"
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let cancelled = false;

    const refreshLinks = async () => {
      try {
        const remoteLinks = await fetchSoulLinks();

        if (!cancelled) {
          setLinks(remoteLinks);
          setSyncMessage(`Shared run: ${soulLinkRunId}`);
        }
      } catch (error) {
        if (!cancelled) {
          setSyncMessage(
            error instanceof Error ? error.message : "Supabase sync failed"
          );
        }
      }
    };

    const startSync = async () => {
      try {
        await seedSoulLinks(starterLinks);
        await refreshLinks();
      } catch (error) {
        if (!cancelled) {
          setSyncMessage(
            error instanceof Error ? error.message : "Supabase sync failed"
          );
        }
      }
    };

    startSync();
    const channel = subscribeToSoulLinks(refreshLinks);

    return () => {
      cancelled = true;

      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

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
      await createSoulLink(link);
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
      current.map((link) => (link.id === id ? { ...link, status } : link))
    );

    if (!isSupabaseConfigured) {
      return;
    }

    try {
      await updateSoulLink(updatedLink);
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
      await updateSoulLink(updatedLink);
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
      await deleteSoulLink(id);
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34rem),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_28rem),#030712]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2 py-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-200">
              Pokemon Black randomized run
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              SoulLink Tracker
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200">
              {syncMessage}
            </div>
            <Button
              type="button"
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
