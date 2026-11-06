export const statusTone = {
  ga: "success",
  beta: "warning",
  paused: "neutral",
} as const;

export const statusLabel = {
  ga: "Live",
  beta: "Beta",
  paused: "Paused",
} as const;

export function money(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function slaLabel(hours: number): string {
  return hours < 1 ? `${Math.round(hours * 60)} min` : `${hours} h`;
}

export function catalogHref(params: {
  q?: string;
  category?: string;
  sort?: string;
  page?: number;
}): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.sort && params.sort !== "relevance") search.set("sort", params.sort);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const suffix = search.toString();
  return suffix ? `/catalog?${suffix}` : "/catalog";
}
