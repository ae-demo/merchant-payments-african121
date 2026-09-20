// One handler per payments-api operation this app actually calls. Seed rows
// match specs/design/components/merchant-webapp/wireframes.dsl's demo data
// (via wireframes/scripts/seed.mjs) so the mock walk sees the same numbers the
// wireframe draws: balance KES 128,400, two Completed transactions (KES 2,000
// mobile money, KES 8,500 card), a Paid and an Expired payment link, a Paid
// bank payout (KES 50,000) and a Failed M-Pesa one (KES 20,000).
//
// State lives in module scope, not on a server: a full page load re-runs this
// module and resets it. Only in-app navigation carries a change forward.
//
// No scope check here — mock/authz/gateway.ts already refused a caller who
// may not call the operation at all. What this file owes is the operation's
// PATH reach: a /me/… handler answers this one mock merchant's own rows.
import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/payments-api";

type Merchant = components["schemas"]["Merchant"];
type PaymentLink = components["schemas"]["PaymentLink"];
type Transaction = components["schemas"]["Transaction"];
type Payout = components["schemas"]["Payout"];
type Refund = components["schemas"]["Refund"];

const MERCHANT_ID = "merchant-001";

let merchant: Merchant | null = {
  id: MERCHANT_ID,
  businessName: "Acme Traders",
  ownerName: "Amara Okafor",
  country: "Kenya",
  currency: "KES",
  contactEmail: "amara@acmetraders.test",
  contactPhone: "+254700000000",
  kycStatus: "approved",
  balance: 128_400,
};

let balanceAmount = 128_400;
const CURRENCY = "KES";

let paymentLinks: PaymentLink[] = [
  {
    id: "8f3ac2",
    merchantId: MERCHANT_ID,
    amount: 2_000,
    currency: CURRENCY,
    status: "paid",
    qrCodeUrl: "https://pay.example/qr/8f3ac2.png",
    createdAt: new Date().toISOString(),
    expiresAt: null,
  },
  {
    id: "b1c9d4",
    merchantId: MERCHANT_ID,
    amount: 1_200,
    currency: CURRENCY,
    status: "expired",
    qrCodeUrl: "https://pay.example/qr/b1c9d4.png",
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    expiresAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
];

let transactions: Transaction[] = [
  {
    id: "txn-1",
    merchantId: MERCHANT_ID,
    paymentLinkId: "8f3ac2",
    method: "mobile-money",
    amount: 2_000,
    currency: CURRENCY,
    status: "completed",
    externalPaymentId: "ext-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "txn-2",
    merchantId: MERCHANT_ID,
    paymentLinkId: "8f3ac2",
    method: "card",
    amount: 8_500,
    currency: CURRENCY,
    status: "completed",
    externalPaymentId: "ext-2",
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
];

let payouts: Payout[] = [
  {
    id: "payout-1",
    merchantId: MERCHANT_ID,
    amount: 50_000,
    currency: CURRENCY,
    destinationType: "bank",
    status: "paid",
    externalPayoutId: "ext-payout-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "payout-2",
    merchantId: MERCHANT_ID,
    amount: 20_000,
    currency: CURRENCY,
    destinationType: "mobile-wallet",
    status: "failed",
    externalPayoutId: null,
    createdAt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
  },
];

let refunds: Refund[] = [];
// Transaction.status (pending|completed|failed) has no "refunded" state, so a
// refunded transaction stays "completed" — this set is what stops a second
// refund on the same one.
const refundedTransactionIds = new Set<string>();
let nextId = 100;

export const handlers = [
  // --- merchant profile -----------------------------------------------------
  http.get("/api/me/merchant", () => {
    if (!merchant) {
      return HttpResponse.json(
        { code: 404, message: "no merchant profile yet" },
        { status: 404 },
      );
    }
    return HttpResponse.json(merchant);
  }),

  http.put("/api/me/merchant", async ({ request }) => {
    const input = (await request.json()) as components["schemas"]["MerchantInput"];
    merchant = {
      id: MERCHANT_ID,
      kycStatus: merchant?.kycStatus ?? "pending",
      balance: merchant?.balance ?? balanceAmount,
      ...input,
    };
    return HttpResponse.json(merchant);
  }),

  // --- payment links (caller's own) -----------------------------------------
  http.get("/api/me/payment-links", ({ request }) => {
    const status = new URL(request.url).searchParams.get("status");
    const data = status ? paymentLinks.filter((l) => l.status === status) : paymentLinks;
    return HttpResponse.json({ count: data.length, next: null, previous: null, data });
  }),

  http.post("/api/me/payment-links", async ({ request }) => {
    const input = (await request.json()) as components["schemas"]["PaymentLinkInput"];
    if (!input?.amount || input.amount <= 0) {
      return HttpResponse.json({ code: 400, message: "amount is required" }, { status: 400 });
    }
    const id = `link-${nextId++}`;
    const created: PaymentLink = {
      id,
      merchantId: MERCHANT_ID,
      amount: input.amount,
      currency: input.currency,
      status: "pending",
      qrCodeUrl: `https://pay.example/qr/${id}.png`,
      createdAt: new Date().toISOString(),
      expiresAt: input.expiresAt ?? null,
    };
    paymentLinks = [created, ...paymentLinks];
    return HttpResponse.json(created, { status: 201 });
  }),

  // Specific id before the parameterised sibling route below is unnecessary
  // here (different path shape), but most-specific-first still applies among
  // these two:
  http.get("/api/me/payment-links/:linkId", ({ params }) => {
    const link = paymentLinks.find((l) => l.id === params.linkId);
    if (!link) return HttpResponse.json({ code: 404, message: "not found" }, { status: 404 });
    return HttpResponse.json(link);
  }),

  // --- payment links (public, for the customer paying them) -----------------
  http.get("/api/payment-links/:linkId", ({ params }) => {
    const link = paymentLinks.find((l) => l.id === params.linkId);
    if (!link || !merchant) {
      return HttpResponse.json({ code: 404, message: "not found" }, { status: 404 });
    }
    return HttpResponse.json({
      id: link.id,
      merchantName: merchant.businessName,
      amount: link.amount,
      currency: link.currency,
      status: link.status,
    });
  }),

  http.post("/api/payment-links/:linkId/pay", async ({ request, params }) => {
    const link = paymentLinks.find((l) => l.id === params.linkId);
    if (!link) return HttpResponse.json({ code: 404, message: "not found" }, { status: 404 });
    if (link.status !== "pending") {
      return HttpResponse.json({ code: 400, message: `link is ${link.status}` }, { status: 400 });
    }
    const input = (await request.json()) as components["schemas"]["PaymentRequest"];
    if (input.method === "mobile-money" && !input.payerPhone) {
      return HttpResponse.json({ code: 400, message: "payerPhone is required" }, { status: 400 });
    }
    if (input.method === "card" && !input.payerCardToken) {
      return HttpResponse.json({ code: 400, message: "payerCardToken is required" }, { status: 400 });
    }
    link.status = "paid";
    const created: Transaction = {
      id: `txn-${nextId++}`,
      merchantId: link.merchantId,
      paymentLinkId: link.id,
      method: input.method,
      amount: link.amount,
      currency: link.currency,
      status: "completed",
      externalPaymentId: `ext-${nextId}`,
      createdAt: new Date().toISOString(),
    };
    transactions = [created, ...transactions];
    balanceAmount += link.amount;
    if (merchant) merchant.balance = balanceAmount;
    return HttpResponse.json(created, { status: 201 });
  }),

  // --- transactions (caller's own) ------------------------------------------
  http.get("/api/me/transactions", ({ request }) => {
    const params = new URL(request.url).searchParams;
    const status = params.get("status");
    const method = params.get("method");
    let data = transactions;
    if (status) data = data.filter((t) => t.status === status);
    if (method) data = data.filter((t) => t.method === method);
    const limit = Number(params.get("limit") ?? data.length);
    return HttpResponse.json({
      count: data.length,
      next: null,
      previous: null,
      data: data.slice(0, limit),
    });
  }),

  http.post("/api/me/transactions/:transactionId/refund", ({ params }) => {
    const txn = transactions.find((t) => t.id === params.transactionId);
    if (!txn) return HttpResponse.json({ code: 404, message: "not found" }, { status: 404 });
    if (txn.status !== "completed" || refundedTransactionIds.has(txn.id)) {
      return HttpResponse.json(
        { code: 400, message: "only a completed, not-yet-refunded transaction may be refunded" },
        { status: 400 },
      );
    }
    refundedTransactionIds.add(txn.id);
    balanceAmount -= txn.amount;
    if (merchant) merchant.balance = balanceAmount;
    const refund: Refund = {
      id: `refund-${nextId++}`,
      transactionId: txn.id,
      amount: txn.amount,
      status: "completed",
      createdAt: new Date().toISOString(),
    };
    refunds = [refund, ...refunds];
    return HttpResponse.json(refund, { status: 201 });
  }),

  // --- balance ---------------------------------------------------------------
  http.get("/api/me/balance", () =>
    HttpResponse.json({ merchantId: MERCHANT_ID, amount: balanceAmount, currency: CURRENCY }),
  ),

  // --- payouts (caller's own) -------------------------------------------------
  http.get("/api/me/payouts", ({ request }) => {
    const status = new URL(request.url).searchParams.get("status");
    const data = status ? payouts.filter((p) => p.status === status) : payouts;
    return HttpResponse.json({ count: data.length, next: null, previous: null, data });
  }),

  http.post("/api/me/payouts", async ({ request }) => {
    const input = (await request.json()) as components["schemas"]["PayoutInput"];
    if (!input?.amount || input.amount <= 0) {
      return HttpResponse.json({ code: 400, message: "amount is required" }, { status: 400 });
    }
    if (input.amount > balanceAmount) {
      return HttpResponse.json(
        { code: 400, message: "amount exceeds the available balance" },
        { status: 400 },
      );
    }
    const created: Payout = {
      id: `payout-${nextId++}`,
      merchantId: MERCHANT_ID,
      amount: input.amount,
      currency: CURRENCY,
      destinationType: input.destinationType,
      status: "paid",
      externalPayoutId: `ext-payout-${nextId}`,
      createdAt: new Date().toISOString(),
    };
    payouts = [created, ...payouts];
    balanceAmount -= input.amount;
    if (merchant) merchant.balance = balanceAmount;
    return HttpResponse.json(created, { status: 201 });
  }),
];
