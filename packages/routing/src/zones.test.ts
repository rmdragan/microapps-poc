import { describe, expect, it } from "vitest";
import { isCrossZone, matchZone, navZones, toLocalHref, zoneById, zones } from "./zones";

describe("route registry", () => {
  it("has no collisions", () => {
    const ids = zones.map((zone) => zone.id);
    const paths = zones.map((zone) => zone.path);
    const apps = zones.map((zone) => zone.app);
    const ports = zones.map((zone) => zone.port);
    const assets = zones.flatMap((zone) => (zone.assets ? [zone.assets] : []));

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
    expect(new Set(apps).size).toBe(apps.length);
    expect(new Set(ports).size).toBe(ports.length);
    expect(new Set(assets).size).toBe(assets.length);
  });

  it("matches prefixes on segment boundaries only", () => {
    expect(matchZone("/").id).toBe("shell");
    expect(matchZone("/catalog").id).toBe("catalog");
    expect(matchZone("/catalog/same-day").id).toBe("catalog");
    expect(matchZone("/catalog?q=cold").id).toBe("catalog");
    expect(matchZone("/ops").id).toBe("ops");
    expect(matchZone("/ops/audit").id).toBe("ops");
    expect(matchZone("/opsx").id).toBe("shell");
    expect(matchZone("/catalogue").id).toBe("shell");
    expect(matchZone("/reports/couriers").id).toBe("reports");
  });

  it("rewrites public paths into zone-local paths without eating query strings", () => {
    const catalog = zoneById("catalog");
    expect(toLocalHref("/catalog", catalog)).toBe("/");
    expect(toLocalHref("/catalog/same-day", catalog)).toBe("/same-day");
    expect(toLocalHref("/catalog?q=cold", catalog)).toBe("/?q=cold");
    expect(toLocalHref("/catalog/ops?x=1#top", catalog)).toBe("/ops?x=1#top");
    expect(toLocalHref("/ops", catalog)).toBe("/ops");
  });

  it("treats only other zones as cross-zone", () => {
    expect(isCrossZone("/catalog", "catalog")).toBe(false);
    expect(isCrossZone("/catalog/same-day", "catalog")).toBe(false);
    expect(isCrossZone("/ops", "catalog")).toBe(true);
    expect(isCrossZone("/catalog", "ops")).toBe(true);
    expect(isCrossZone("/", "catalog")).toBe(true);
    expect(isCrossZone("#section", "catalog")).toBe(false);
  });

  it("builds navigation in registry order", () => {
    expect(navZones().map((zone) => zone.id)).toEqual([
      "shell",
      "catalog",
      "ops",
      "reports",
    ]);
  });
});
