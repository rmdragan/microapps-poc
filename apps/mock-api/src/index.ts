import { serve } from "@hono/node-server";
import {
  AuditListSchema,
  CATEGORIES,
  CatalogItemSchema,
  CatalogListSchema,
  CourierListSchema,
  HealthSchema,
  OpsSettingsSchema,
  OpsSettingsUpdateSchema,
  ReportSummarySchema,
  TimeseriesSchema,
} from "@micro/api";
import { parseSession, type SessionUser } from "@micro/auth/headers";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  auditLog,
  catalogItems,
  couriers,
  opsSettings,
  reportSummary,
  resetData,
  setOpsSettings,
  timeseries,
} from "./data";

const PAGE_SIZE = 6;
const failures = new Set<string>();

type Variables = { user: SessionUser };

const app = new Hono<{ Variables: Variables }>();

app.use("*", cors());
app.use("*", async (c, next) => {
  await new Promise((resolve) => setTimeout(resolve, 70 + Math.random() * 110));
  await next();
});

app.use("*", async (c, next) => {
  const scope = c.req.path.startsWith("/api/catalog")
    ? "catalog"
    : c.req.path.startsWith("/api/ops")
      ? "ops"
      : c.req.path.startsWith("/api/reports")
        ? "reports"
        : null;

  if (scope && failures.has(scope)) {
    return c.json({ error: `The ${scope} service is unavailable (simulated failure).` }, 503);
  }
  await next();
});

app.use("/api/ops/*", async (c, next) => {
  const user = parseSession(c.req.raw.headers);
  if (!user) {
    return c.json({ error: "Authentication required" }, 401);
  }
  c.set("user", user);
  await next();
});

app.get("/api/health", (c) => {
  return c.json(
    HealthSchema.parse({
      ok: true,
      service: "mock-api",
      version: process.env.BUILD_INFO ?? "dev",
      now: new Date().toISOString(),
    }),
  );
});

app.get("/api/me", (c) => {
  const user = parseSession(c.req.raw.headers);
  if (!user) return c.json({ error: "Not signed in" }, 401);
  return c.json(user);
});

app.get("/api/catalog", (c) => {
  const q = (c.req.query("q") ?? "").trim().toLowerCase();
  const category = c.req.query("category") ?? "";
  const sort = c.req.query("sort") ?? "relevance";
  const page = Math.max(1, Number(c.req.query("page") ?? "1") || 1);

  let items = catalogItems.filter((item) => {
    const matchesQuery =
      !q ||
      [item.name, item.tagline, item.description, item.category, ...item.regions]
        .join(" ")
        .toLowerCase()
        .includes(q);
    const matchesCategory = !category || item.category === category;
    return matchesQuery && matchesCategory;
  });

  if (sort === "sla") items = items.sort((a, b) => a.slaHours - b.slaHours);
  if (sort === "price") items = items.sort((a, b) => a.priceFrom - b.priceFrom);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return c.json(
    CatalogListSchema.parse({
      items: paged,
      total,
      page: safePage,
      pageSize: PAGE_SIZE,
      pageCount,
      facets: CATEGORIES.map((categoryName) => ({
        category: categoryName,
        count: catalogItems.filter((item) => item.category === categoryName).length,
      })),
    }),
  );
});

app.get("/api/catalog/:id", (c) => {
  const item = catalogItems.find((candidate) => candidate.id === c.req.param("id"));
  if (!item) return c.json({ error: "Service not found" }, 404);
  return c.json(CatalogItemSchema.parse(item));
});

app.get("/api/ops/settings", (c) => {
  return c.json(OpsSettingsSchema.parse(opsSettings));
});

app.put("/api/ops/settings", async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => null);
  const parsed = OpsSettingsUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: "Some settings are invalid", issues: parsed.error.issues },
      400,
    );
  }

  const next = {
    ...parsed.data,
    updatedAt: new Date().toISOString(),
    updatedBy: user.name,
  };
  setOpsSettings(next);

  auditLog.unshift({
    id: `a-${Date.now()}`,
    at: next.updatedAt,
    actor: user.name,
    action: "Updated operations settings",
    detail: `Strategy ${next.routingStrategy}, cutoff ${next.cutoffTime}, SLA target ${next.slaThreshold}%, auto-reroute ${next.autoReroute ? "on" : "off"}, escalations: ${next.escalationEmails.join(", ")}.`,
  });

  return c.json(OpsSettingsSchema.parse(next));
});

app.get("/api/ops/audit", (c) => {
  return c.json(AuditListSchema.parse(auditLog));
});

app.get("/api/reports/summary", (c) => {
  return c.json(ReportSummarySchema.parse(reportSummary));
});

app.get("/api/reports/timeseries", (c) => {
  return c.json(TimeseriesSchema.parse(timeseries));
});

app.get("/api/reports/couriers", (c) => {
  return c.json(CourierListSchema.parse(couriers));
});

/**
 * Demo control plane. In production this would not exist; here it lets a
 * presenter fail one service without touching the others.
 */
app.post("/api/_admin/fail", async (c) => {
  const body = (await c.req.json().catch(() => null)) as
    | { scope?: string; on?: boolean }
    | null;
  if (!body?.scope) return c.json({ error: "scope is required" }, 400);
  if (body.on === false) failures.delete(body.scope);
  else failures.add(body.scope);
  return c.json({ failures: [...failures] });
});

app.post("/api/_admin/reset", (c) => {
  resetData();
  failures.clear();
  return c.json({ ok: true });
});

const port = Number(process.env.PORT ?? 4000);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`mock-api listening on http://localhost:${info.port}`);
});
