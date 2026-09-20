# Domain Model

The core entities behind merchant onboarding, payment collection and payouts.

```mermaid
erDiagram
    MERCHANT ||--o{ PAYMENT_LINK : creates
    MERCHANT ||--o{ TRANSACTION : receives
    MERCHANT ||--o{ PAYOUT : requests
    MERCHANT ||--o{ DISPUTE : escalates
    PAYMENT_LINK ||--o| TRANSACTION : "paid via"
    TRANSACTION ||--o| REFUND : "refunded by"
    PAYOUT ||--o| DISPUTE : "may escalate to"

    MERCHANT {
        string id PK
        string businessName
        string ownerName
        string country
        string currency
        string contactEmail
        string contactPhone
        string kycStatus "pending | approved | rejected"
        int balance
    }
    PAYMENT_LINK {
        string id PK
        string merchantId FK
        int amount
        string currency
        string status "pending | paid | expired"
        string qrCodeUrl
        datetime createdAt
        datetime expiresAt
    }
    TRANSACTION {
        string id PK
        string merchantId FK
        string paymentLinkId FK
        string method "mobile-money | card"
        int amount
        string currency
        string status "pending | completed | failed"
        string externalPaymentId
        datetime createdAt
    }
    REFUND {
        string id PK
        string transactionId FK
        int amount
        string status "pending | completed | failed"
        datetime createdAt
    }
    PAYOUT {
        string id PK
        string merchantId FK
        int amount
        string currency
        string destinationType "bank | mobile-wallet"
        string status "pending | paid | failed"
        string externalPayoutId
        datetime createdAt
    }
    DISPUTE {
        string id PK
        string merchantId FK
        string payoutId FK
        string subject
        string status "open | resolved"
        string resolutionNotes
        datetime createdAt
    }
```

- **Merchant** carries its running `balance` and `kycStatus`, set by Platform
Admin review.
- **PaymentLink** is what a Merchant generates for a sale; a Customer opens it
to pay — its `status` tracks whether it has been paid or has expired.
- **Transaction** records one completed or attempted payment against a
PaymentLink, via mobile money or card, through the payment gateway.
- **Refund** reverses a completed Transaction, in full.
- **Payout** is a Merchant's withdrawal request against its balance, to a bank
account or mobile wallet.
- **Dispute** is an escalated, unresolved payout failure or complaint a
Platform Admin resolves.

