import { expect, test } from "@playwright/test";

async function signInThroughOps(page: import("@playwright/test").Page) {
  await page.goto("/ops");
  await expect(page).toHaveURL(/\/auth\/login\?returnTo=%2Fops/);
  await page.getByRole("button", { name: "Continue as Robin Vale" }).click();
  await expect(page).toHaveURL(/\/ops$/);
}

test.describe("operations zone", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("/api/_admin/reset");
  });

  test("a Server Action saves settings and appends to the audit trail", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await signInThroughOps(page);

    await expect(page.getByRole("heading", { name: "Operations" })).toBeVisible();
    await expect(page.getByText("Current policy")).toBeVisible();

    await page.locator("form").getByText("Fastest", { exact: true }).click();
    await page.getByLabel("Same-day cutoff").fill("18:00");
    await page.getByLabel("On-time target").fill("97");
    await page.getByText("Automatic re-route", { exact: true }).click();
    await page.getByLabel("Escalation contacts").fill("ops-lead@relay.example, oncall@relay.example");

    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(
      page.getByText("Settings saved. The audit trail has a new entry."),
    ).toBeVisible();

    const policy = page.getByTestId("current-policy");
    await expect(policy.getByText("Fastest")).toBeVisible();
    await expect(policy.getByText("18:00")).toBeVisible();
    await expect(policy.getByText("97%")).toBeVisible();
    await expect(policy.getByText("Off", { exact: true })).toBeVisible();

    await page
      .getByRole("navigation", { name: "Operations sections" })
      .getByRole("link", { name: "Audit trail" })
      .click();

    await expect(page).toHaveURL(/\/ops\/audit$/);
    await expect(page.getByRole("heading", { name: "Audit trail" })).toBeVisible();
    await expect(page.getByText("Updated operations settings").first()).toBeVisible();
    await expect(page.getByText("oncall@relay.example").first()).toBeVisible();
  });

  test("invalid settings are rejected by the shared schema", async ({ page, context }) => {
    await context.clearCookies();
    await signInThroughOps(page);

    await page.getByLabel("On-time target").fill("20");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByText("Some fields need attention.")).toBeVisible();
    await expect(page.getByText("Minimum is 50%")).toBeVisible();
  });
});
