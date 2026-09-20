// spec: tests/validation/test-plan.md § AC-015-a
import { test, expect } from "@playwright/test";

test("AC-015-a: a Merchant must sign in before accessing merchant dashboard features", async ({ page }) => {
  // 1. Navigate directly to a protected merchant route with no session
  await page.goto("/dashboard");
  // 2. Assert the app redirects to the identity provider's sign-in gate
  //    instead of rendering dashboard content
  await page.waitForURL(/\/gate\/signin/);
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
});
