import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";

function run(...args: string[]): void {
  execFileSync("pnpm", args, {
    cwd: process.cwd(),
    stdio: "pipe",
    env: process.env,
  });
}

test.describe("failure isolation", () => {
  test.afterAll(() => {
    try {
      run("start", "zone-ops");
    } catch {
      // the dev server may already be gone
    }
  });

  test("a dead zone returns an edge 503 while the rest keeps serving", async ({ page }) => {
    run("stop", "zone-ops");

    const down = await page.goto("/ops");
    expect(down?.status()).toBe(503);
    await expect(page.getByText("This area is temporarily unavailable.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to overview" })).toBeVisible();

    const home = await page.goto("/");
    expect(home?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("One delivery platform");

    const catalog = await page.goto("/catalog");
    expect(catalog?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Service catalog" })).toBeVisible();

    const reports = await page.goto("/reports");
    expect(reports?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Delivery reports" })).toBeVisible();

    run("start", "zone-ops");
    const recovered = await page.goto("/ops");
    expect(recovered?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Sign in to Relay" })).toBeVisible();
  });
});
