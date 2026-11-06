import { expect, test } from "@playwright/test";

test("anonymous /ops redirects to sign-in, and the session is shared by every zone", async ({
  page,
  context,
}) => {
  await context.clearCookies();

  await page.goto("/ops");
  await expect(page).toHaveURL(/\/auth\/login\?returnTo=%2Fops/);
  await expect(page.getByRole("heading", { name: "Sign in to Relay" })).toBeVisible();

  await page.getByRole("button", { name: "Continue as Robin Vale" }).click();
  await expect(page).toHaveURL(/\/ops$/);
  await expect(page.getByRole("heading", { name: "Operations" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Account menu for Robin Vale/ }),
  ).toBeVisible();

  await page.goto("/catalog");
  await expect(
    page.getByRole("button", { name: /Account menu for Robin Vale/ }),
  ).toBeVisible();

  await page.goto("/reports");
  await expect(
    page.getByRole("button", { name: /Account menu for Robin Vale/ }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Account menu for Robin Vale/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();

  await expect(page).toHaveURL("http://localhost:3000/");
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("a zone can require a session while the shell stays public", async ({ page, context }) => {
  await context.clearCookies();

  await page.goto("/catalog");
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Service catalog" })).toBeVisible();

  await page.goto("/ops");
  await expect(page).toHaveURL(/\/auth\/login/);
});
