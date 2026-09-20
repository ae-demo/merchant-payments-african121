// spec: tests/validation/test-plan.md § AC-015-b
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { loginAsAdmin } from "../lib/adminAuth";

test("AC-015-b: a Platform Admin must sign in before accessing the admin portal", async ({ page }) => {
  // 1. Navigate directly to a protected admin route with no session
  await page.goto(`${target("admin-webapp")}/transactions`);
  // 2. Assert the app redirects to the identity provider's sign-in gate
  await page.waitForURL(/\/gate\/signin/);
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();

  // 3. Sign in with the provisioned PlatformAdmin test user
  await loginAsAdmin(page);

  // 4. Assert the admin shell (rail) is now reachable
  await expect(page.getByRole("link", { name: "Onboarding" })).toBeVisible();
});
