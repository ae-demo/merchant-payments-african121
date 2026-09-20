// spec: tests/validation/test-plan.md § AC-013-a
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { loginAsAdmin } from "../lib/adminAuth";

test("AC-013-a: a Platform Admin can view a list of transactions across all merchants", async ({ page }) => {
  await page.goto(`${target("admin-webapp")}/transactions`);
  await loginAsAdmin(page);
  // Sign-in always lands on the default landing screen (Onboarding), not the
  // originally requested deep link - navigate to Transactions explicitly.
  await page.goto(`${target("admin-webapp")}/transactions`);

  await expect(page.getByRole("heading", { name: "Transactions" })).toBeVisible();
  await expect(page.getByText("Every transaction across all merchants")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Merchant" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Amount" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
});
