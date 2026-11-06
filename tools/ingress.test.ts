import { zones } from "@micro/routing";
import { describe, expect, it } from "vitest";
import { renderIngress } from "./ingress.ts";

function pathsIn(yaml: string): string[] {
  return [...yaml.matchAll(/^\s+- path: (.+)$/gm)].map((match) => match[1] as string);
}

describe("ingress generation", () => {
  const yaml = renderIngress();

  it("routes every zone, asset namespace and service", () => {
    for (const zone of zones) {
      if (zone.path !== "/") {
        expect(yaml).toContain(`- path: ${zone.path}\n`);
      }
      if (zone.assets) {
        expect(yaml).toContain(`- path: ${zone.assets}\n`);
      }
    }
    expect(yaml).toContain("- path: /api\n");
    expect(yaml).toContain("- path: /\n");
  });

  it("has no duplicate paths", () => {
    const paths = pathsIn(yaml);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("puts the shell catch-all last", () => {
    expect(pathsIn(yaml).at(-1)).toBe("/");
  });

  it("does not strip the path prefix", () => {
    expect(yaml).not.toContain("rewrite-target");
  });
});
