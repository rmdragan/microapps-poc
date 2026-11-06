import { z } from "zod";

export const CATEGORIES = ["Parcel", "Freight", "Cold chain", "On-demand"] as const;
export const CATALOG_SORTS = ["relevance", "sla", "price"] as const;

export const CatalogCategorySchema = z.enum(CATEGORIES);
export const CatalogSortSchema = z.enum(CATALOG_SORTS);
export const ServiceStatusSchema = z.enum(["ga", "beta", "paused"]);

export const CatalogItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  category: CatalogCategorySchema,
  regions: z.array(z.string()),
  slaHours: z.number(),
  priceFrom: z.number(),
  priceUnit: z.enum(["parcel", "pallet", "kg"]),
  status: ServiceStatusSchema,
  updatedAt: z.string(),
  highlights: z.array(z.string()),
  metrics: z.object({
    onTime: z.number(),
    volume: z.number(),
    incidents: z.number(),
  }),
});

export type CatalogItem = z.infer<typeof CatalogItemSchema>;

export const CatalogListSchema = z.object({
  items: z.array(CatalogItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  pageCount: z.number(),
  facets: z.array(z.object({ category: CatalogCategorySchema, count: z.number() })),
});

export type CatalogList = z.infer<typeof CatalogListSchema>;

export const OpsSettingsSchema = z.object({
  routingStrategy: z.enum(["fastest", "cheapest", "balanced"]),
  cutoffTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour time like 17:30"),
  slaThreshold: z.number().min(50, "Minimum is 50%").max(100, "Maximum is 100%"),
  autoReroute: z.boolean(),
  escalationEmails: z.array(z.email("Enter a valid email")),
  updatedAt: z.string(),
  updatedBy: z.string(),
});

export type OpsSettings = z.infer<typeof OpsSettingsSchema>;

export const OpsSettingsUpdateSchema = OpsSettingsSchema.omit({
  updatedAt: true,
  updatedBy: true,
});

export type OpsSettingsUpdate = z.infer<typeof OpsSettingsUpdateSchema>;

export const AuditEntrySchema = z.object({
  id: z.string(),
  at: z.string(),
  actor: z.string(),
  action: z.string(),
  detail: z.string(),
});

export type AuditEntry = z.infer<typeof AuditEntrySchema>;

export const AuditListSchema = z.array(AuditEntrySchema);

export const SessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  groups: z.array(z.string()),
});

export const ReportSummarySchema = z.object({
  window: z.string(),
  onTime: z.number(),
  volume: z.number(),
  incidents: z.number(),
  costPerParcel: z.number(),
  deltas: z.object({
    onTime: z.number(),
    volume: z.number(),
    incidents: z.number(),
    costPerParcel: z.number(),
  }),
});

export type ReportSummary = z.infer<typeof ReportSummarySchema>;

export const TimeseriesPointSchema = z.object({
  day: z.string(),
  label: z.string(),
  volume: z.number(),
  onTime: z.number(),
});

export type TimeseriesPoint = z.infer<typeof TimeseriesPointSchema>;

export const TimeseriesSchema = z.array(TimeseriesPointSchema);

export const CourierSchema = z.object({
  id: z.string(),
  name: z.string(),
  hub: z.string(),
  deliveries: z.number(),
  onTime: z.number(),
  status: z.enum(["active", "break", "offline"]),
});

export type Courier = z.infer<typeof CourierSchema>;

export const CourierListSchema = z.array(CourierSchema);

export const HealthSchema = z.object({
  ok: z.boolean(),
  service: z.string(),
  version: z.string(),
  now: z.string(),
});
