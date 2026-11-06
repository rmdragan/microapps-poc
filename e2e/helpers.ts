import { expect, type Page } from "@playwright/test";

export async function signIn(page: Page, returnTo = "/"): Promise<void> {
  await page.goto(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  await page.getByRole("button", { name: "Continue as Robin Vale" }).click();
  await expect(page).toHaveURL(new RegExp(`${returnTo.replace(/[/?]/g, "\\$&")}$`));
}

export function setMarker(value: string) {
  (window as unknown as { __zoneMarker?: string }).__zoneMarker = value;
}

export function readMarker(): string | undefined {
  return (window as unknown as { __zoneMarker?: string }).__zoneMarker;
}
