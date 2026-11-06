import { expect, test } from "@playwright/test";
import { readMarker, setMarker } from "./helpers";

test.describe("reports zone (Vite)", () => {
  test("renders the shared chrome and navigates client-side inside the zone", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto("/reports");

    await expect(page.getByRole("heading", { name: "Delivery reports" })).toBeVisible();
    await expect(page.getByText("Daily volume")).toBeVisible();
    await expect(page.locator('svg[role="img"]')).toBeVisible();
    await expect(page.getByText("This zone is a Vite SPA")).toBeVisible();

    await page.evaluate(setMarker, "reports");
    await page.getByRole("link", { name: "Courier load" }).click();

    await expect(page).toHaveURL(/\/reports\/couriers$/);
    await expect(page.getByRole("heading", { name: "Courier load" })).toBeVisible();
    expect(await page.evaluate(readMarker)).toBe("reports");

    await page.getByLabel("Filter couriers").fill("Amsterdam");
    await expect(page.locator("table").getByText("Amsterdam West")).toBeVisible();
    await expect(page.locator("table").getByText("Rotterdam South")).toHaveCount(0);
  });

  test("shares the session with the Next zones", async ({ page }) => {
    await page.goto("/auth/login?returnTo=%2Freports");
    await page.getByRole("button", { name: "Continue as Robin Vale" }).click();
    await expect(page).toHaveURL(/\/reports$/);

    await expect(
      page.getByRole("button", { name: /Account menu for Robin Vale/ }),
    ).toBeVisible();
  });
});
