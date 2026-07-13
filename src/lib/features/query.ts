import type {
  AiSupportFlag,
  Feature,
  FeatureDifficulty,
  FeatureSortOption,
  FeatureStatus,
  FeatureTimeBucket,
} from "@/data/features";

export const FEATURES_PAGE_SIZE = 8;

export type FeatureExplorerState = {
  search: string;
  categories: string[];
  statuses: FeatureStatus[];
  difficulties: FeatureDifficulty[];
  aiSupport: AiSupportFlag[];
  timeBuckets: FeatureTimeBucket[];
  technologies: string[];
  sort: FeatureSortOption;
  page: number;
  mode: "pages" | "infinite";
};

export const DEFAULT_EXPLORER_STATE: FeatureExplorerState = {
  search: "",
  categories: [],
  statuses: [],
  difficulties: [],
  aiSupport: [],
  timeBuckets: [],
  technologies: [],
  sort: "featured",
  page: 1,
  mode: "pages",
};

export function parseFeatureExplorerState(
  params: URLSearchParams
): FeatureExplorerState {
  const split = (key: string) =>
    params
      .get(key)
      ?.split(",")
      .map((v) => v.trim())
      .filter(Boolean) ?? [];

  const sort = (params.get("sort") as FeatureSortOption) || "featured";
  const validSort: FeatureSortOption[] = [
    "featured",
    "popular",
    "newest",
    "oldest",
    "az",
    "za",
    "time_asc",
    "time_desc",
  ];

  const modeParam = params.get("mode");
  const page = Number(params.get("page") || "1");

  return {
    search: params.get("search")?.trim() ?? "",
    categories: split("category"),
    statuses: split("status") as FeatureStatus[],
    difficulties: split("difficulty") as FeatureDifficulty[],
    aiSupport: split("ai") as AiSupportFlag[],
    timeBuckets: split("time") as FeatureTimeBucket[],
    technologies: split("tech"),
    sort: validSort.includes(sort) ? sort : "featured",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    mode: modeParam === "infinite" ? "infinite" : "pages",
  };
}

export function serializeFeatureExplorerState(
  state: FeatureExplorerState
): URLSearchParams {
  const params = new URLSearchParams();
  if (state.search) params.set("search", state.search);
  if (state.categories.length)
    params.set("category", state.categories.join(","));
  if (state.statuses.length) params.set("status", state.statuses.join(","));
  if (state.difficulties.length)
    params.set("difficulty", state.difficulties.join(","));
  if (state.aiSupport.length) params.set("ai", state.aiSupport.join(","));
  if (state.timeBuckets.length)
    params.set("time", state.timeBuckets.join(","));
  if (state.technologies.length)
    params.set("tech", state.technologies.join(","));
  if (state.sort !== "featured") params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));
  if (state.mode === "infinite") params.set("mode", "infinite");
  return params;
}

function matchesSearch(feature: Feature, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystack = [
    feature.title,
    feature.category,
    feature.shortDescription,
    feature.fullDescription,
    ...feature.keywords,
    ...feature.technologies,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function filterFeatures(
  features: Feature[],
  state: FeatureExplorerState
): Feature[] {
  return features.filter((feature) => {
    if (!matchesSearch(feature, state.search)) return false;
    if (
      state.categories.length &&
      !state.categories.includes(feature.category)
    ) {
      return false;
    }
    if (state.statuses.length && !state.statuses.includes(feature.status)) {
      return false;
    }
    if (
      state.difficulties.length &&
      !state.difficulties.includes(feature.difficulty)
    ) {
      return false;
    }
    if (
      state.aiSupport.length &&
      !state.aiSupport.every((flag) => feature.aiSupport.includes(flag))
    ) {
      return false;
    }
    if (
      state.timeBuckets.length &&
      !state.timeBuckets.includes(feature.estimatedTimeBucket)
    ) {
      return false;
    }
    if (
      state.technologies.length &&
      !state.technologies.every((tech) => feature.technologies.includes(tech))
    ) {
      return false;
    }
    return true;
  });
}

export function sortFeatures(
  features: Feature[],
  sort: FeatureSortOption
): Feature[] {
  const next = [...features];
  switch (sort) {
    case "popular":
      return next.sort((a, b) => b.popularity - a.popularity);
    case "newest":
      return next.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "oldest":
      return next.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    case "az":
      return next.sort((a, b) => a.title.localeCompare(b.title));
    case "za":
      return next.sort((a, b) => b.title.localeCompare(a.title));
    case "time_asc":
      return next.sort(
        (a, b) => a.estimatedTimeMinutes - b.estimatedTimeMinutes
      );
    case "time_desc":
      return next.sort(
        (a, b) => b.estimatedTimeMinutes - a.estimatedTimeMinutes
      );
    case "featured":
    default:
      return next.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.popularity - a.popularity;
      });
  }
}

export function paginateFeatures(
  features: Feature[],
  page: number,
  pageSize = FEATURES_PAGE_SIZE
) {
  const total = features.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const items = features.slice(start, start + pageSize);
  return {
    items,
    total,
    totalPages,
    page: safePage,
    pageSize,
    showingFrom: total === 0 ? 0 : start + 1,
    showingTo: Math.min(start + pageSize, total),
  };
}

export function queryFeatures(
  features: Feature[],
  state: FeatureExplorerState,
  options?: { pageSize?: number; infinite?: boolean }
) {
  const filtered = filterFeatures(features, state);
  const sorted = sortFeatures(filtered, state.sort);
  const pageSize = options?.pageSize ?? FEATURES_PAGE_SIZE;

  if (options?.infinite || state.mode === "infinite") {
    const visibleCount = Math.min(sorted.length, state.page * pageSize);
    return {
      items: sorted.slice(0, visibleCount),
      total: sorted.length,
      totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
      page: state.page,
      pageSize,
      showingFrom: sorted.length === 0 ? 0 : 1,
      showingTo: visibleCount,
      hasMore: visibleCount < sorted.length,
      sorted,
    };
  }

  return {
    ...paginateFeatures(sorted, state.page, pageSize),
    hasMore: false,
    sorted,
  };
}

export type ActiveFilterChip = {
  key: string;
  label: string;
  group:
    | "category"
    | "status"
    | "difficulty"
    | "ai"
    | "time"
    | "tech"
    | "search";
  value: string;
};

export function getActiveFilterChips(
  state: FeatureExplorerState,
  labels: {
    status: (s: FeatureStatus) => string;
    ai: (a: AiSupportFlag) => string;
    time: (t: FeatureTimeBucket) => string;
  }
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  if (state.search.trim()) {
    chips.push({
      key: `search:${state.search}`,
      label: `Search: ${state.search}`,
      group: "search",
      value: state.search,
    });
  }
  for (const category of state.categories) {
    chips.push({
      key: `category:${category}`,
      label: category,
      group: "category",
      value: category,
    });
  }
  for (const status of state.statuses) {
    chips.push({
      key: `status:${status}`,
      label: labels.status(status),
      group: "status",
      value: status,
    });
  }
  for (const difficulty of state.difficulties) {
    chips.push({
      key: `difficulty:${difficulty}`,
      label: difficulty,
      group: "difficulty",
      value: difficulty,
    });
  }
  for (const ai of state.aiSupport) {
    chips.push({
      key: `ai:${ai}`,
      label: labels.ai(ai),
      group: "ai",
      value: ai,
    });
  }
  for (const time of state.timeBuckets) {
    chips.push({
      key: `time:${time}`,
      label: labels.time(time),
      group: "time",
      value: time,
    });
  }
  for (const tech of state.technologies) {
    chips.push({
      key: `tech:${tech}`,
      label: tech,
      group: "tech",
      value: tech,
    });
  }
  return chips;
}

export function hasActiveFilters(state: FeatureExplorerState): boolean {
  return (
    Boolean(state.search.trim()) ||
    state.categories.length > 0 ||
    state.statuses.length > 0 ||
    state.difficulties.length > 0 ||
    state.aiSupport.length > 0 ||
    state.timeBuckets.length > 0 ||
    state.technologies.length > 0
  );
}
