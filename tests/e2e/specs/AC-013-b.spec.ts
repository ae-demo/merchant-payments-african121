// spec: tests/validation/test-plan.md § AC-013-b
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { loginAsAdmin } from "../lib/adminAuth";

test("AC-013-b: a Platform Admin can view a list of payouts across all merchants", async ({ page }) => {
  await page.goto(`${target("admin-webapp")}/payouts`);
  await loginAsAdmin(page);
  // Sign-in always lands on the default landing screen (Onboarding), not the
  // originally requested deep link - navigate to Payouts explicitly.
  await page.goto(`${target("admin-webapp")}/payouts`);

  await expect(page.getByRole("heading", { name: "Payouts" })).toBeVisible();
  await expect(page.getByText("Every payout across all merchants")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Merchant" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Destination" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
});
