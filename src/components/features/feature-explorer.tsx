"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  ListRestart,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FeatureCard, FeatureCardSkeleton } from "@/components/features/feature-card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  deriveFeatureFilterOptions,
  getAiSupportLabel,
  getFeatureStatusLabel,
  getSortOptionLabel,
  getTimeBucketLabel,
  type AiSupportFlag,
  type Feature,
  type FeatureDifficulty,
  type FeatureSortOption,
  type FeatureStatus,
  type FeatureTimeBucket,
} from "@/data/features";
import {
  DEFAULT_EXPLORER_STATE,
  FEATURES_PAGE_SIZE,
  getActiveFilterChips,
  hasActiveFilters,
  parseFeatureExplorerState,
  queryFeatures,
  serializeFeatureExplorerState,
  type FeatureExplorerState,
} from "@/lib/features/query";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: FeatureSortOption[] = [
  "featured",
  "popular",
  "newest",
  "oldest",
  "az",
  "za",
  "time_asc",
  "time_desc",
];

function toggleValue<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function FilterCheckboxGroup<T extends string>({
  title,
  options,
  selected,
  getLabel,
  onToggle,
}: {
  title: string;
  options: T[];
  selected: T[];
  getLabel: (value: T) => string;
  onToggle: (value: T) => void;
}) {
  if (!options.length) return null;
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">{title}</legend>
      <div className="space-y-1.5">
        {options.map((option) => {
          const id = `${title}-${option}`.replace(/\s+/g, "-").toLowerCase();
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent/60"
            >
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option)}
                className="h-4 w-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span>{getLabel(option)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function FiltersPanel({
  state,
  options,
  onChange,
}: {
  state: FeatureExplorerState;
  options: ReturnType<typeof deriveFeatureFilterOptions>;
  onChange: (patch: Partial<FeatureExplorerState>) => void;
}) {
  return (
    <div className="space-y-6">
      <FilterCheckboxGroup
        title="Category"
        options={options.categories}
        selected={state.categories}
        getLabel={(v) => v}
        onToggle={(value) =>
          onChange({ categories: toggleValue(state.categories, value), page: 1 })
        }
      />
      <FilterCheckboxGroup
        title="Status"
        options={options.statuses}
        selected={state.statuses}
        getLabel={getFeatureStatusLabel}
        onToggle={(value) =>
          onChange({
            statuses: toggleValue(state.statuses, value as FeatureStatus),
            page: 1,
          })
        }
      />
      <FilterCheckboxGroup
        title="Difficulty"
        options={options.difficulties}
        selected={state.difficulties}
        getLabel={(v) => v}
        onToggle={(value) =>
          onChange({
            difficulties: toggleValue(
              state.difficulties,
              value as FeatureDifficulty
            ),
            page: 1,
          })
        }
      />
      <FilterCheckboxGroup
        title="AI Support"
        options={options.aiSupport}
        selected={state.aiSupport}
        getLabel={getAiSupportLabel}
        onToggle={(value) =>
          onChange({
            aiSupport: toggleValue(state.aiSupport, value as AiSupportFlag),
            page: 1,
          })
        }
      />
      <FilterCheckboxGroup
        title="Estimated Time"
        options={options.timeBuckets}
        selected={state.timeBuckets}
        getLabel={getTimeBucketLabel}
        onToggle={(value) =>
          onChange({
            timeBuckets: toggleValue(
              state.timeBuckets,
              value as FeatureTimeBucket
            ),
            page: 1,
          })
        }
      />
      <FilterCheckboxGroup
        title="Technology"
        options={options.technologies}
        selected={state.technologies}
        getLabel={(v) => v}
        onToggle={(value) =>
          onChange({
            technologies: toggleValue(state.technologies, value),
            page: 1,
          })
        }
      />
    </div>
  );
}

export function FeatureExplorer({
  features,
  initialState,
  syncUrl = true,
  showHeader = true,
  compact = false,
}: {
  features: Feature[];
  initialState?: Partial<FeatureExplorerState>;
  syncUrl?: boolean;
  showHeader?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<FeatureExplorerState>({
    ...DEFAULT_EXPLORER_STATE,
    ...initialState,
  });
  const [searchInput, setSearchInput] = useState(state.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hydratedRef = useRef(false);

  const filterOptions = useMemo(
    () => deriveFeatureFilterOptions(features),
    [features]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 280);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!syncUrl || typeof window === "undefined") return;
    if (pathname === "/features") {
      const params = new URLSearchParams(window.location.search);
      const parsed = parseFeatureExplorerState(params);
      if (!params.has("mode") && window.matchMedia("(max-width: 767px)").matches) {
        parsed.mode = "infinite";
      }
      setState(parsed);
      setSearchInput(parsed.search);
    } else if (window.matchMedia("(max-width: 767px)").matches) {
      setState((prev) => ({ ...prev, mode: "infinite" }));
    }
    const timer = window.setTimeout(() => {
      hydratedRef.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, syncUrl]);

  useEffect(() => {
    setState((prev) =>
      prev.search === debouncedSearch
        ? prev
        : { ...prev, search: debouncedSearch, page: 1 }
    );
  }, [debouncedSearch]);

  useEffect(() => {
    if (!syncUrl || !hydratedRef.current) return;
    const params = serializeFeatureExplorerState(state);
    const query = params.toString();
    const href = query ? `/features?${query}` : "/features";

    if (pathname === "/features") {
      const next = query ? `${pathname}?${query}` : pathname;
      const current = `${pathname}${window.location.search}`;
      if (current !== next) {
        router.replace(next, { scroll: false });
      }
      return;
    }

    // From the home page, sync only once the user starts exploring.
    if (hasActiveFilters(state) || state.sort !== "featured" || state.page > 1) {
      router.replace(href, { scroll: false });
    }
  }, [state, syncUrl, router, pathname]);

  const result = useMemo(
    () => queryFeatures(features, state, { pageSize: FEATURES_PAGE_SIZE }),
    [features, state]
  );

  const chips = useMemo(
    () =>
      getActiveFilterChips(state, {
        status: getFeatureStatusLabel,
        ai: getAiSupportLabel,
        time: getTimeBucketLabel,
      }),
    [state]
  );

  const updateState = useCallback((patch: Partial<FeatureExplorerState>) => {
    startTransition(() => {
      setState((prev) => ({ ...prev, ...patch }));
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setState({
      ...DEFAULT_EXPLORER_STATE,
      mode: state.mode,
      sort: "featured",
    });
  }, [state.mode]);

  const removeChip = useCallback(
    (chip: ReturnType<typeof getActiveFilterChips>[number]) => {
      if (chip.group === "search") {
        setSearchInput("");
        updateState({ search: "", page: 1 });
        return;
      }
      if (chip.group === "category") {
        updateState({
          categories: state.categories.filter((c) => c !== chip.value),
          page: 1,
        });
      } else if (chip.group === "status") {
        updateState({
          statuses: state.statuses.filter((s) => s !== chip.value),
          page: 1,
        });
      } else if (chip.group === "difficulty") {
        updateState({
          difficulties: state.difficulties.filter((d) => d !== chip.value),
          page: 1,
        });
      } else if (chip.group === "ai") {
        updateState({
          aiSupport: state.aiSupport.filter((a) => a !== chip.value),
          page: 1,
        });
      } else if (chip.group === "time") {
        updateState({
          timeBuckets: state.timeBuckets.filter((t) => t !== chip.value),
          page: 1,
        });
      } else if (chip.group === "tech") {
        updateState({
          technologies: state.technologies.filter((t) => t !== chip.value),
          page: 1,
        });
      }
    },
    [state, updateState]
  );

  // Infinite scroll sentinel
  useEffect(() => {
    if (state.mode !== "infinite" || !result.hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          updateState({ page: state.page + 1 });
        }
      },
      { rootMargin: "240px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [state.mode, state.page, result.hasMore, updateState]);

  return (
    <section
      id="features"
      className={cn(
        "scroll-mt-24",
        compact
          ? "container mx-auto max-w-6xl px-4 py-16"
          : "container mx-auto max-w-6xl px-4 py-10"
      )}
      aria-labelledby="features-heading"
    >
      {showHeader ? (
        <motion.div
          className="mx-auto mb-10 max-w-3xl text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2
            id="features-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Everything you need to prepare with confidence
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Prepare for real-world interviews with AI-powered practice,
            personalized feedback, voice conversations, resume analysis, coding
            challenges, and detailed progress tracking.
          </p>
        </motion.div>
      ) : null}

      <div className="top-16 z-30 -mx-4 mb-6 border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search features, categories, keywords, technology…"
              className="h-11 pl-9 pr-9"
              aria-label="Search features"
            />
            {searchInput ? (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Clear search"
                onClick={() => {
                  setSearchInput("");
                  updateState({ search: "", page: 1 });
                }}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="lg:hidden"
              onClick={() => setFilterOpen(true)}
              aria-label="Open filters"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {chips.length > 0 ? (
                <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                  {chips.length}
                </span>
              ) : null}
            </Button>

            <div className="min-w-[200px]">
              <Label htmlFor="feature-sort" className="sr-only">
                Sort features
              </Label>
              <Select
                value={state.sort}
                onValueChange={(value) =>
                  updateState({
                    sort: value as FeatureSortOption,
                    page: 1,
                  })
                }
              >
                <SelectTrigger id="feature-sort" aria-label="Sort features">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {getSortOptionLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="inline-flex rounded-xl border border-border/60 p-1">
              <button
                type="button"
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-medium",
                  state.mode === "pages"
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground"
                )}
                onClick={() => updateState({ mode: "pages", page: 1 })}
                aria-pressed={state.mode === "pages"}
              >
                <LayoutGrid className="mr-1 inline h-3.5 w-3.5" />
                Pages
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-medium",
                  state.mode === "infinite"
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground"
                )}
                onClick={() => updateState({ mode: "infinite", page: 1 })}
                aria-pressed={state.mode === "infinite"}
              >
                Infinite
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing{" "}
            <span className="font-medium text-foreground">
              {result.items.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{result.total}</span>{" "}
            Features
            {state.mode === "pages" && result.totalPages > 1 ? (
              <span className="text-muted-foreground">
                {" "}
                (page {result.page}/{result.totalPages})
              </span>
            ) : null}
          </p>

          {chips.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              <ListRestart className="mr-1.5 h-3.5 w-3.5" />
              Clear All Filters
            </Button>
          ) : null}
        </div>

        {chips.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <AnimatePresence>
              {chips.map((chip) => (
                <motion.button
                  key={chip.key}
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => removeChip(chip)}
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs font-medium hover:bg-accent"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="top-36 rounded-2xl border border-border/60 bg-card/50 p-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </div>
            <FiltersPanel
              state={state}
              options={filterOptions}
              onChange={updateState}
            />
          </div>
        </aside>

        <div>
          {loading ? (
            <div
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
              aria-busy="true"
              aria-label="Loading features"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <FeatureCardSkeleton key={i} />
              ))}
            </div>
          ) : result.items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center rounded-3xl border border-dashed border-border/70 bg-card/40 px-6 py-16 text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Search className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">No matching features found.</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Try a different search term or reset your filters to browse the
                full catalog.
              </p>
              <Button className="mt-6" onClick={clearFilters}>
                Reset Filters
              </Button>
            </motion.div>
          ) : (
            <>
              <motion.div
                layout
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
              >
                <AnimatePresence mode="popLayout">
                  {result.items.map((feature, index) => (
                    <FeatureCard
                      key={feature.id}
                      feature={feature}
                      index={index}
                      searchQuery={state.search}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>

              {state.mode === "pages" ? (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Previous page"
                    disabled={result.page <= 1}
                    onClick={() => updateState({ page: result.page - 1 })}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: result.totalPages }).map((_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          type="button"
                          size="sm"
                          variant={page === result.page ? "default" : "ghost"}
                          aria-label={`Go to page ${page}`}
                          aria-current={page === result.page ? "page" : undefined}
                          onClick={() => updateState({ page })}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Next page"
                    disabled={result.page >= result.totalPages}
                    onClick={() => updateState({ page: result.page + 1 })}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div ref={sentinelRef} className="mt-8 flex justify-center py-4">
                  {result.hasMore ? (
                    <p className="text-sm text-muted-foreground">
                      Loading more features…
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      You&apos;ve reached the end.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <FiltersPanel
            state={state}
            options={filterOptions}
            onChange={(patch) => {
              updateState(patch);
            }}
          />
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                clearFilters();
              }}
            >
              Reset
            </Button>
            <Button className="flex-1" onClick={() => setFilterOpen(false)}>
              Show {result.total} results
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
