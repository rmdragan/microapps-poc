import { z } from "zod";
import {
  AuditListSchema,
  CatalogItemSchema,
  CatalogListSchema,
  CourierListSchema,
  HealthSchema,
  OpsSettingsSchema,
  ReportSummarySchema,
  SessionUserSchema,
  TimeseriesSchema,
  type OpsSettingsUpdate,
} from "./schemas";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiClientOptions = {
  baseUrl: string;
  headers?: HeadersInit;
  fetchImpl?: typeof fetch;
};

export type CatalogQuery = {
  q?: string;
  category?: string;
  sort?: string;
  page?: number;
};

function toEntries(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return headers as Record<string, string>;
}

export function createApiClient({
  baseUrl,
  headers,
  fetchImpl = fetch,
}: ApiClientOptions) {
  async function request<T>(
    path: string,
    schema: z.ZodType<T>,
    init?: RequestInit,
  ): Promise<T> {
    const url = new URL(path, baseUrl);
    const response = await fetchImpl(url, {
      ...init,
      cache: "no-store",
      headers: {
        accept: "application/json",
        ...(init?.body ? { "content-type": "application/json" } : {}),
        ...toEntries(headers),
        ...toEntries(init?.headers),
      },
    });

    const text = await response.text();
    let body: unknown = undefined;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!response.ok) {
      const message =
        typeof body === "object" && body && "error" in body
          ? String((body as { error: unknown }).error)
          : response.statusText || `Request failed with ${response.status}`;
      throw new ApiError(response.status, message, body);
    }

    return schema.parse(body);
  }

  return {
    me: () => request("/api/me", SessionUserSchema),
    health: () => request("/api/health", HealthSchema),
    catalog: {
      list(query: CatalogQuery = {}) {
        const params = new URLSearchParams();
        if (query.q) params.set("q", query.q);
        if (query.category) params.set("category", query.category);
        if (query.sort) params.set("sort", query.sort);
        if (query.page) params.set("page", String(query.page));
        const suffix = params.size ? `?${params}` : "";
        return request(`/api/catalog${suffix}`, CatalogListSchema);
      },
      get(id: string) {
        return request(`/api/catalog/${encodeURIComponent(id)}`, CatalogItemSchema);
      },
    },
    ops: {
      settings: () => request("/api/ops/settings", OpsSettingsSchema),
      update(input: OpsSettingsUpdate) {
        return request("/api/ops/settings", OpsSettingsSchema, {
          method: "PUT",
          body: JSON.stringify(input),
        });
      },
      audit: () => request("/api/ops/audit", AuditListSchema),
    },
    reports: {
      summary: () => request("/api/reports/summary", ReportSummarySchema),
      timeseries: () => request("/api/reports/timeseries", TimeseriesSchema),
      couriers: () => request("/api/reports/couriers", CourierListSchema),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
