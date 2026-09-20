import { type Page, expect } from "@playwright/test";

// The only pre-provisioned test identity in this environment (see the
// milestone's roles gate ticket): PlatformAdmin. Credentials come from the
// environment only - never hardcode them.
//
// Assumes `page` is already on the identity provider's sign-in gate
// (navigate there first with whichever component's URL the spec needs).
export async function loginAsAdmin(page: Page): Promise<void> {
  const username = process.env.AEP_E2E_USERNAME;
  const password = process.env.AEP_E2E_PASSWORD;
  if (!username || !password) {
    throw new Error("AEP_E2E_USERNAME / AEP_E2E_PASSWORD must be set (see the milestone's roles gate ticket)");
  }
  await page.waitForURL(/\/gate\/signin/);
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("button", { name: new RegExp(`${username}@`) })).toBeVisible({ timeout: 15_000 });
}
