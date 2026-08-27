"use client";

import {
  AlertTriangle,
  Building2,
  CalendarDays,
  FolderGit,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  ListTodo,
  Rows3,
  Settings,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
} from "react";
import { setDensity, useDensity } from "@/components/operations/density-toggle";
import { cn } from "@/lib/utils";

type PaletteItem = {
  id: string;
  label: string;
  group: "navigate" | "preference";
  icon: ComponentType<{ className?: string }>;
  run: () => void;
};

export type CommandPaletteLabels = {
  title: string;
  placeholder: string;
  navigate: string;
  preferences: string;
  densityComfortable: string;
  densityCompact: string;
  empty: string;
  openHint: string;
  overview: string;
  attention: string;
  work: string;
  dependencies: string;
  team: string;
  capacity: string;
  settings: string;
  organizations: string;
  projects: string;
  github: string;
};

export function CommandPalette({
  labels,
  open,
  onOpenChange,
  basePath = "/app",
  demo = false,
}: {
  labels: CommandPaletteLabels;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  basePath?: string;
  demo?: boolean;
}) {
  const router = useRouter();
  const density = useDensity();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  function close() {
    onOpenChange(false);
  }

  const items = useMemo<PaletteItem[]>(() => {
    const go = (href: string) => {
      close();
      router.push(href);
    };
    const root = basePath.replace(/\/$/, "") || "/app";

    const navigate: PaletteItem[] = [
      {
        id: "nav-overview",
        label: labels.overview,
        group: "navigate",
        icon: LayoutDashboard,
        run: () => go(root),
      },
      {
        id: "nav-attention",
        label: labels.attention,
        group: "navigate",
        icon: AlertTriangle,
        run: () => go(`${root}/attention`),
      },
      {
        id: "nav-work",
        label: labels.work,
        group: "navigate",
        icon: ListTodo,
        run: () => go(`${root}/tasks`),
      },
      {
        id: "nav-dependencies",
        label: labels.dependencies,
        group: "navigate",
        icon: GitBranch,
        run: () => go(`${root}/dependencies`),
      },
      {
        id: "nav-team",
        label: labels.team,
        group: "navigate",
        icon: Users,
        run: () => go(`${root}/team`),
      },
    ];

    if (!demo) {
      navigate.push(
        {
          id: "nav-capacity",
          label: labels.capacity,
          group: "navigate",
          icon: CalendarDays,
          run: () => go(`${root}/calendar`),
        },
        {
          id: "nav-github",
          label: labels.github,
          group: "navigate",
          icon: FolderGit,
          run: () => go(`${root}/github`),
        },
        {
          id: "nav-settings",
          label: labels.settings,
          group: "navigate",
          icon: Settings,
          run: () => go(`${root}/settings`),
        },
        {
          id: "nav-orgs",
          label: labels.organizations,
          group: "navigate",
          icon: Building2,
          run: () => go(`${root}/organizations`),
        },
        {
          id: "nav-projects",
          label: labels.projects,
          group: "navigate",
          icon: FolderKanban,
          run: () => go(`${root}/projects`),
        },
      );
    }

    return [
      ...navigate,
      {
        id: "pref-comfortable",
        label: labels.densityComfortable,
        group: "preference",
        icon: Rows3,
        run: () => {
          setDensity("comfortable");
          close();
        },
      },
      {
        id: "pref-compact",
        label: labels.densityCompact,
        group: "preference",
        icon: Rows3,
        run: () => {
          setDensity("compact");
          close();
        },
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close is a stable render helper
  }, [labels, onOpenChange, router, basePath, demo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      queueMicrotask(() => inputRef.current?.focus());
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      filtered[activeIndex]?.run();
    }
  }

  const navigateItems = filtered.filter((item) => item.group === "navigate");
  const preferenceItems = filtered.filter((item) => item.group === "preference");

  return (
    <dialog
      ref={dialogRef}
      aria-label={labels.title}
      className={cn(
        "fixed left-1/2 top-[12vh] z-50 m-0 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2",
        "rounded-[var(--radius-lg)] border border-[var(--hf-rule-strong)]",
        "bg-[var(--hf-ground-1)] p-0 text-[var(--hf-ink)] shadow-none",
        "backdrop:bg-[var(--hf-ground-0)]/70",
      )}
      onClose={close}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
    >
      <div className="border-b border-[var(--hf-rule)] px-3 py-2">
        <label className="sr-only" htmlFor={`${listId}-input`}>
          {labels.placeholder}
        </label>
        <input
          id={`${listId}-input`}
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={labels.placeholder}
          className="input w-full border-0 bg-transparent px-1 py-2 shadow-none"
          autoComplete="off"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            filtered[activeIndex] ? `${listId}-${filtered[activeIndex].id}` : undefined
          }
        />
      </div>

      <div id={listId} role="listbox" className="max-h-80 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="t-body-sm px-2 py-3 text-[var(--hf-ink-muted)]">{labels.empty}</p>
        ) : (
          <>
            {navigateItems.length > 0 ? (
              <PaletteGroup
                title={labels.navigate}
                items={navigateItems}
                listId={listId}
                activeId={filtered[activeIndex]?.id}
                density={density}
                onActivate={(item) => {
                  setActiveIndex(filtered.findIndex((row) => row.id === item.id));
                  item.run();
                }}
              />
            ) : null}
            {preferenceItems.length > 0 ? (
              <PaletteGroup
                title={labels.preferences}
                items={preferenceItems}
                listId={listId}
                activeId={filtered[activeIndex]?.id}
                density={density}
                onActivate={(item) => {
                  setActiveIndex(filtered.findIndex((row) => row.id === item.id));
                  item.run();
                }}
              />
            ) : null}
          </>
        )}
      </div>

      <p className="t-mono-sm border-t border-[var(--hf-rule)] px-3 py-2 text-[var(--hf-ink-faint)]">
        {labels.openHint}
      </p>
    </dialog>
  );
}

function PaletteGroup({
  title,
  items,
  listId,
  activeId,
  density,
  onActivate,
}: {
  title: string;
  items: PaletteItem[];
  listId: string;
  activeId?: string;
  density: "comfortable" | "compact";
  onActivate: (item: PaletteItem) => void;
}) {
  return (
    <div className="mb-2">
      <p className="t-label px-2 py-1 text-[var(--hf-ink-faint)]">{title}</p>
      <ul className="grid gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeId;
          const selectedPreference =
            (item.id === "pref-comfortable" && density === "comfortable") ||
            (item.id === "pref-compact" && density === "compact");

          return (
            <li key={item.id}>
              <button
                type="button"
                id={`${listId}-${item.id}`}
                role="option"
                aria-selected={active}
                onClick={() => onActivate(item)}
                className={cn(
                  "t-body flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-md)] px-3",
                  "text-left text-[var(--hf-ink)]",
                  "focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
                  "focus-visible:outline-[var(--hf-accent)]",
                  active ? "bg-[var(--hf-ground-3)]" : "hover:bg-[var(--hf-ground-2)]",
                  selectedPreference && "text-[var(--hf-accent)]",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
