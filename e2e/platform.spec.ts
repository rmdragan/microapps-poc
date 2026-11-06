import { expect, test } from "@playwright/test";
import { readMarker, setMarker } from "./helpers";

test.describe("platform shell", () => {
  test("renders the shared chrome and the live routing map", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Relay/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("One delivery platform");

    const nav = page.getByRole("navigation", { name: "Primary" }).first();
    await expect(nav.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "Service catalog" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Operations" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Reports" })).toBeVisible();

    await expect(page.getByText("Edge routing")).toBeVisible();
    await expect(page.getByText("zone-catalog", { exact: true })).toBeVisible();
  });

  test("cross-zone navigation is a document load; same-zone navigation stays client-side", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(setMarker, "shell");

    await page
      .getByRole("navigation", { name: "Primary" })
      .first()
      .getByRole("link", { name: "Service catalog" })
      .click();

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(page.getByRole("heading", { name: "Service catalog" })).toBeVisible();
    expect(await page.evaluate(readMarker)).toBeUndefined();

    await page.evaluate(setMarker, "catalog");
    await page.getByRole("link", { name: /Same-day parcel/i }).first().click();

    await expect(page).toHaveURL(/\/catalog\/same-day$/);
    await expect(page.getByRole("heading", { name: "Same-day parcel" })).toBeVisible();
    expect(await page.evaluate(readMarker)).toBe("catalog");
  });

  test("every zone marks itself active in the same header", async ({ page }) => {
    const zones = [
      { path: "/", label: "Overview" },
      { path: "/catalog", label: "Service catalog" },
      { path: "/reports", label: "Reports" },
    ];

    for (const zone of zones) {
      await page.goto(zone.path);
      const header = page.locator("header.site-header");
      await expect(header.getByText("Relay", { exact: true })).toBeVisible();
      const nav = header.getByRole("navigation", { name: "Primary" }).first();
      await expect(nav.getByRole("link", { name: zone.label })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
  });
});
