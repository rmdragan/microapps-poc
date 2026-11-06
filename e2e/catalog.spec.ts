import { expect, test } from "@playwright/test";

test.describe("catalog zone", () => {
  test("search narrows the list and a service opens inside the zone", async ({ page }) => {
    await page.goto("/catalog");
    await expect(page.getByText("12 services")).toBeVisible();

    await page.getByPlaceholder("Search services…").fill("cold");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(/q=cold/);
    await expect(page.getByRole("link", { name: /Cold chain 2–8°C/ })).toBeVisible();
    await expect(page.getByText("1 service matching")).toBeVisible();

    await page.getByRole("link", { name: /Cold chain 2–8°C/ }).click();
    await expect(page).toHaveURL(/\/catalog\/cold-chain$/);
    await expect(page.getByRole("heading", { name: "Cold chain 2–8°C" })).toBeVisible();
    await expect(page.getByText("Audit-ready temperature log")).toBeVisible();
  });

  test("category chips and pagination keep the zone path", async ({ page }) => {
    await page.goto("/catalog");
    await page.getByRole("link", { name: /^Freight/ }).first().click();
    await expect(page).toHaveURL(/category=Freight/);
    await expect(page.getByRole("link", { name: /LTL freight/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Cold chain 2–8°C/ })).toHaveCount(0);

    await page.goto("/catalog");
    await page.getByRole("link", { name: "Next", exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText("Page 2 of 2")).toBeVisible();
  });

  test("unknown services get the catalog's own not-found page", async ({ page }) => {
    await page.goto("/catalog/does-not-exist");
    await expect(page.getByText("That service is not in the catalog")).toBeVisible();
    await expect(page.locator("header.site-header")).toBeVisible();
    await expect(page.locator('head meta[name="robots"]').first()).toHaveAttribute(
      "content",
      "noindex",
    );
  });
});
