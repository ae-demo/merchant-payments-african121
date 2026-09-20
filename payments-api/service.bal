// The payments-api HTTP service — implements
// specs/design/components/payments-api/openapi.yaml exactly: same paths,
// schemas and status codes.
//
// The gateway has already enforced every operation's scope from that same
// contract before a request reaches this process, so no handler here holds
// an operation -> scope table. A `/me/...` handler resolves its rows through
// the gateway assertion's `sub` (via `requireGatewayCaller`) and nothing the
// client sent; every other handler reaches every row and filters on nothing.

import ballerina/http;
import ballerina/time;

listener http:Listener ep0 = new (9090);

service http:InterceptableService / on ep0 {
    public function createInterceptors() returns AssertionInterceptor => new;

    # Liveness check
    resource function get health() returns http:Ok {
        return {};
    }

    // ---- merchants ---------------------------------------------------

    # The caller's own merchant profile
    resource function get me/merchant(http:RequestContext ctx) returns Merchant|ErrorNotFound|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        MerchantRow? found = check findMerchantByOwner(caller.userId);
        if found is () {
            return notFoundError("no merchant profile yet");
        }
        return toMerchant(found);
    }

    # Create or update the caller's own merchant profile and KYC details
    resource function put me/merchant(http:RequestContext ctx, @http:Payload MerchantInput payload)
            returns Merchant|ErrorBadRequest|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        if payload.businessName.trim() == "" || payload.ownerName.trim() == "" || payload.country.trim() == ""
                || payload.currency.trim() == "" || payload.contactEmail.trim() == "" || payload.contactPhone.trim() == "" {
            return badRequest("every merchant field is required");
        }
        MerchantRow? existing = check findMerchantByOwner(caller.userId);
        MerchantRow saved;
        if existing is MerchantRow {
            saved = check updateMerchantProfile(existing, payload);
        } else {
            saved = check insertMerchant(caller.userId, payload);
        }
        return toMerchant(saved);
    }

    # Every merchant, optionally filtered by KYC status
    resource function get merchants("pending"|"approved"|"rejected"? kycStatus, int 'limit = 20, int offset = 0)
            returns MerchantPage|error {
        int pageLimit = clampLimit('limit);
        int pageOffset = clampOffset(offset);
        [MerchantRow[], int] pageResult = check listMerchants(kycStatus, pageLimit, pageOffset);
        Merchant[] data = from MerchantRow r in pageResult[0] select toMerchant(r);
        string extraQuery = kycStatus is string ? string `kycStatus=${kycStatus}&` : "";
        [string?, string?] links = pageLinks("/merchants", extraQuery, pageResult[1], pageLimit, pageOffset);
        return {count: pageResult[1], previous: links[0], next: links[1], data};
    }

    # Any merchant by id
    resource function get merchants/[string merchantId]() returns Merchant|ErrorNotFound|error {
        MerchantRow? found = check findMerchantById(merchantId);
        if found is () {
            return notFoundError("no merchant with that id");
        }
        return toMerchant(found);
    }

    # Approve a merchant's KYC application
    resource function post merchants/[string merchantId]/approve() returns MerchantOk|ErrorNotFound|error {
        MerchantRow? found = check findMerchantById(merchantId);
        if found is () {
            return notFoundError("no merchant with that id");
        }
        check setMerchantKycStatus(merchantId, "approved");
        found.kycStatus = "approved";
        sendEmail(found.contactEmail, "Your merchant application was approved",
            string `Congratulations ${found.businessName}, your merchant account has been approved. `
                + "You can now collect payments.");
        return {body: toMerchant(found)};
    }

    # Reject a merchant's KYC application
    resource function post merchants/[string merchantId]/reject(@http:Payload RejectMerchantRequest payload)
            returns MerchantOk|ErrorNotFound|error {
        MerchantRow? found = check findMerchantById(merchantId);
        if found is () {
            return notFoundError("no merchant with that id");
        }
        check setMerchantKycStatus(merchantId, "rejected");
        found.kycStatus = "rejected";
        sendEmail(found.contactEmail, "Your merchant application was rejected",
            string `We're sorry, ${found.businessName}, your merchant application was rejected: ${payload.reason}`);
        return {body: toMerchant(found)};
    }

    // ---- payment links -------------------------------------------------

    # The caller's own payment links
    resource function get me/payment\-links(http:RequestContext ctx, "pending"|"paid"|"expired"? status,
            int 'limit = 20, int offset = 0) returns PaymentLinkPage|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        int pageLimit = clampLimit('limit);
        int pageOffset = clampOffset(offset);
        MerchantRow? merchant = check findMerchantByOwner(caller.userId);
        if merchant is () {
            return {count: 0, data: []};
        }
        [PaymentLinkRow[], int] pageResult = check listPaymentLinksForMerchant(merchant.id, status, pageLimit, pageOffset);
        PaymentLink[] data = from PaymentLinkRow r in pageResult[0] select toPaymentLink(r);
        string extraQuery = status is string ? string `status=${status}&` : "";
        [string?, string?] links = pageLinks("/me/payment-links", extraQuery, pageResult[1], pageLimit, pageOffset);
        return {count: pageResult[1], previous: links[0], next: links[1], data};
    }

    # Generate a payment link/QR code for a sale
    resource function post me/payment\-links(http:RequestContext ctx, @http:Payload PaymentLinkInput payload)
            returns PaymentLink|ErrorBadRequest|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        if payload.amount <= 0 || payload.currency.trim() == "" {
            return badRequest("amount must be positive and currency is required");
        }
        string? expiresAtText = payload?.expiresAt;
        if expiresAtText is string {
            time:Utc|error parsed = parseUtc(expiresAtText);
            if parsed is error {
                return badRequest("expiresAt must be an RFC3339 date-time");
            }
        }
        MerchantRow? merchant = check findMerchantByOwner(caller.userId);
        if merchant is () {
            return badRequest("create a merchant profile before generating payment links");
        }
        PaymentLinkRow created = check insertPaymentLink(merchant.id, payload);
        return toPaymentLink(created);
    }

    # One of the caller's own payment links, with its status
    resource function get me/payment\-links/[string linkId](http:RequestContext ctx)
            returns PaymentLink|ErrorNotFound|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        MerchantRow? merchant = check findMerchantByOwner(caller.userId);
        if merchant is () {
            return notFoundError("no payment link with that id");
        }
        PaymentLinkRow? link = check findPaymentLinkById(linkId);
        if link is () || link.merchantId != merchant.id {
            return notFoundError("no payment link with that id");
        }
        return toPaymentLink(link);
    }

    # A payment link's public details, for the customer paying it
    resource function get payment\-links/[string linkId]() returns PaymentLinkPublic|ErrorNotFound|error {
        PaymentLinkRow? link = check findPaymentLinkById(linkId);
        if link is () {
            return notFoundError("no payment link with that id");
        }
        MerchantRow? merchant = check findMerchantById(link.merchantId);
        string merchantName = merchant is MerchantRow ? merchant.businessName : "";
        return {
            id: link.id,
            merchantName,
            amount: link.amount,
            currency: link.currency,
            status: effectivePaymentLinkStatus(link)
        };
    }

    # Pay a payment link via mobile money or card
    resource function post payment\-links/[string linkId]/pay(@http:Payload PaymentRequest payload)
            returns Transaction|ErrorBadRequest|ErrorNotFound|error {
        PaymentLinkRow? link = check findPaymentLinkById(linkId);
        if link is () {
            return notFoundError("no payment link with that id");
        }
        string effectiveStatus = effectivePaymentLinkStatus(link);
        if effectiveStatus != "pending" {
            return badRequest(string `this payment link is already ${effectiveStatus}`);
        }
        string? payerPhone = payload?.payerPhone;
        string? payerCardToken = payload?.payerCardToken;
        if payload.method == "mobile-money" {
            if payerPhone is () || payerPhone.trim() == "" {
                return badRequest("payerPhone is required for mobile-money");
            }
        } else {
            if payerCardToken is () || payerCardToken.trim() == "" {
                return badRequest("payerCardToken is required for card");
            }
        }
        TransactionRow txn = check insertTransaction(link.merchantId, link.id, payload.method, link.amount, link.currency);
        PaymentOutcome|error outcome = authorisePayment(link.merchantId, link.amount, link.currency, payload.method, txn.id);
        if outcome is error {
            check settleTransaction(txn.id, "failed", ());
            txn.status = "failed";
            return toTransaction(txn);
        }
        if outcome.status == "authorized" {
            check settleTransaction(txn.id, "completed", outcome.externalId);
            check markPaymentLinkPaid(link.id);
            check adjustMerchantBalance(link.merchantId, link.amount);
            txn.status = "completed";
            txn.externalPaymentId = outcome.externalId;
            if payerPhone is string {
                sendSms(payerPhone, string `Payment of ${link.amount} ${link.currency} received. Thank you!`);
            }
            MerchantRow? merchant = check findMerchantById(link.merchantId);
            if merchant is MerchantRow {
                sendEmail(merchant.contactEmail, "You received a payment",
                    string `You received a payment of ${link.amount} ${link.currency}.`);
            }
        } else {
            check settleTransaction(txn.id, "failed", outcome.externalId);
            txn.status = "failed";
            txn.externalPaymentId = outcome.externalId;
        }
        return toTransaction(txn);
    }

    // ---- transactions & refunds -----------------------------------------

    # The caller's own transactions
    resource function get me/transactions(http:RequestContext ctx, "pending"|"completed"|"failed"? status,
            "mobile-money"|"card"? method, int 'limit = 20, int offset = 0)
            returns TransactionPage|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        int pageLimit = clampLimit('limit);
        int pageOffset = clampOffset(offset);
        MerchantRow? merchant = check findMerchantByOwner(caller.userId);
        if merchant is () {
            return {count: 0, data: []};
        }
        [TransactionRow[], int] pageResult =
            check listTransactionsForMerchant(merchant.id, status, method, pageLimit, pageOffset);
        Transaction[] data = from TransactionRow r in pageResult[0] select toTransaction(r);
        string extraQuery = "";
        if status is string {
            extraQuery = extraQuery + string `status=${status}&`;
        }
        if method is string {
            extraQuery = extraQuery + string `method=${method}&`;
        }
        [string?, string?] links = pageLinks("/me/transactions", extraQuery, pageResult[1], pageLimit, pageOffset);
        return {count: pageResult[1], previous: links[0], next: links[1], data};
    }

    # Every transaction, across merchants
    resource function get transactions(string? merchantId, int 'limit = 20, int offset = 0)
            returns TransactionPage|error {
        int pageLimit = clampLimit('limit);
        int pageOffset = clampOffset(offset);
        [TransactionRow[], int] pageResult = check listAllTransactions(merchantId, pageLimit, pageOffset);
        Transaction[] data = from TransactionRow r in pageResult[0] select toTransaction(r);
        string extraQuery = merchantId is string ? string `merchantId=${merchantId}&` : "";
        [string?, string?] links = pageLinks("/transactions", extraQuery, pageResult[1], pageLimit, pageOffset);
        return {count: pageResult[1], previous: links[0], next: links[1], data};
    }

    # Refund one of the caller's own completed transactions, in full
    resource function post me/transactions/[string transactionId]/refund(http:RequestContext ctx)
            returns Refund|ErrorBadRequest|ErrorNotFound|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        MerchantRow? merchant = check findMerchantByOwner(caller.userId);
        if merchant is () {
            return notFoundError("no transaction with that id");
        }
        TransactionRow? txn = check findTransactionForMerchant(transactionId, merchant.id);
        if txn is () {
            return notFoundError("no transaction with that id");
        }
        if txn.status != "completed" {
            return badRequest("only a completed transaction can be refunded");
        }
        boolean alreadyRefunded = check hasCompletedRefund(txn.id);
        if alreadyRefunded {
            return badRequest("this transaction has already been refunded");
        }
        RefundRow refund = check insertRefund(txn.id, txn.amount);
        check adjustMerchantBalance(merchant.id, -txn.amount);
        return toRefund(refund);
    }

    // ---- balance ---------------------------------------------------------

    # The caller's own running balance
    resource function get me/balance(http:RequestContext ctx) returns Balance|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        MerchantRow? merchant = check findMerchantByOwner(caller.userId);
        if merchant is () {
            return {merchantId: "", amount: 0, currency: ""};
        }
        return {merchantId: merchant.id, amount: merchant.balance, currency: merchant.currency};
    }

    // ---- payouts -----------------------------------------------------------

    # The caller's own payout requests
    resource function get me/payouts(http:RequestContext ctx, "pending"|"paid"|"failed"? status,
            int 'limit = 20, int offset = 0) returns PayoutPage|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        int pageLimit = clampLimit('limit);
        int pageOffset = clampOffset(offset);
        MerchantRow? merchant = check findMerchantByOwner(caller.userId);
        if merchant is () {
            return {count: 0, data: []};
        }
        [PayoutRow[], int] pageResult = check listPayoutsForMerchant(merchant.id, status, pageLimit, pageOffset);
        Payout[] data = from PayoutRow r in pageResult[0] select toPayout(r);
        string extraQuery = status is string ? string `status=${status}&` : "";
        [string?, string?] links = pageLinks("/me/payouts", extraQuery, pageResult[1], pageLimit, pageOffset);
        return {count: pageResult[1], previous: links[0], next: links[1], data};
    }

    # Request a payout of the caller's balance to a bank account or mobile wallet
    resource function post me/payouts(http:RequestContext ctx, @http:Payload PayoutInput payload)
            returns Payout|ErrorBadRequest|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        if payload.amount <= 0 {
            return badRequest("amount must be positive");
        }
        if payload.destinationType == "bank" {
            string? bankAccountNumber = payload?.bankAccountNumber;
            string? bankCode = payload?.bankCode;
            if bankAccountNumber is () || bankAccountNumber.trim() == "" || bankCode is () || bankCode.trim() == "" {
                return badRequest("bankAccountNumber and bankCode are required for a bank payout");
            }
        } else {
            string? mobileWalletNumber = payload?.mobileWalletNumber;
            if mobileWalletNumber is () || mobileWalletNumber.trim() == "" {
                return badRequest("mobileWalletNumber is required for a mobile-wallet payout");
            }
        }
        MerchantRow? merchant = check findMerchantByOwner(caller.userId);
        if merchant is () {
            return badRequest("create a merchant profile before requesting a payout");
        }
        if payload.amount > merchant.balance {
            return badRequest("payout amount exceeds available balance");
        }
        PayoutRow payout = check insertPayout(merchant.id, payload.amount, merchant.currency, payload);
        PayoutOutcome|error outcome = requestPayout(merchant.id, payout.amount, merchant.currency,
            payout.destinationType, payout.bankAccountNumber, payout.bankCode, payout.mobileWalletNumber, payout.id);
        if outcome is error {
            check settlePayout(payout.id, "failed", ());
            _ = check insertDispute(merchant.id, payout.id,
                string `Payout ${payout.id} could not reach the payment gateway`);
            payout.status = "failed";
            return toPayout(payout);
        }
        if outcome.status == "paid" {
            check settlePayout(payout.id, "paid", outcome.externalId);
            check adjustMerchantBalance(merchant.id, -payout.amount);
            payout.status = "paid";
            payout.externalPayoutId = outcome.externalId;
            sendSms(merchant.contactPhone, string `Your payout of ${payout.amount} ${payout.currency} was successful.`);
        } else if outcome.status == "failed" {
            check settlePayout(payout.id, "failed", outcome.externalId);
            _ = check insertDispute(merchant.id, payout.id, string `Payout ${payout.id} failed at the payment gateway`);
            payout.status = "failed";
            payout.externalPayoutId = outcome.externalId;
        } else {
            payout.externalPayoutId = outcome.externalId;
        }
        return toPayout(payout);
    }

    # Every payout, across merchants
    resource function get payouts("pending"|"paid"|"failed"? status, int 'limit = 20, int offset = 0)
            returns PayoutPage|error {
        int pageLimit = clampLimit('limit);
        int pageOffset = clampOffset(offset);
        [PayoutRow[], int] pageResult = check listAllPayouts(status, pageLimit, pageOffset);
        Payout[] data = from PayoutRow r in pageResult[0] select toPayout(r);
        string extraQuery = status is string ? string `status=${status}&` : "";
        [string?, string?] links = pageLinks("/payouts", extraQuery, pageResult[1], pageLimit, pageOffset);
        return {count: pageResult[1], previous: links[0], next: links[1], data};
    }

    # Resolve a failed payout, retrying or marking it settled
    resource function post payouts/[string payoutId]/resolve(@http:Payload ResolvePayoutRequest payload)
            returns PayoutOk|ErrorNotFound|error {
        PayoutRow? payout = check findPayoutById(payoutId);
        if payout is () {
            return notFoundError("no payout with that id");
        }
        if payout.status != "paid" {
            check settlePayout(payout.id, "paid", payout.externalPayoutId);
            check adjustMerchantBalance(payout.merchantId, -payout.amount);
            payout.status = "paid";
        }
        check resolveOpenDisputesForPayout(payout.id, payload.resolutionNotes);
        MerchantRow? merchant = check findMerchantById(payout.merchantId);
        if merchant is MerchantRow {
            sendSms(merchant.contactPhone, string `Your payout of ${payout.amount} ${payout.currency} has been resolved.`);
        }
        return {body: toPayout(payout)};
    }

    // ---- disputes ----------------------------------------------------------

    # Every dispute
    resource function get disputes("open"|"resolved"? status, int 'limit = 20, int offset = 0)
            returns DisputePage|error {
        int pageLimit = clampLimit('limit);
        int pageOffset = clampOffset(offset);
        [DisputeRow[], int] pageResult = check listDisputes(status, pageLimit, pageOffset);
        Dispute[] data = from DisputeRow r in pageResult[0] select toDispute(r);
        string extraQuery = status is string ? string `status=${status}&` : "";
        [string?, string?] links = pageLinks("/disputes", extraQuery, pageResult[1], pageLimit, pageOffset);
        return {count: pageResult[1], previous: links[0], next: links[1], data};
    }

    # Resolve an escalated dispute
    resource function post disputes/[string disputeId]/resolve(@http:Payload ResolveDisputeRequest payload)
            returns DisputeOk|ErrorNotFound|error {
        DisputeRow? dispute = check findDisputeById(disputeId);
        if dispute is () {
            return notFoundError("no dispute with that id");
        }
        check resolveDisputeRow(disputeId, payload.resolutionNotes);
        dispute.status = "resolved";
        dispute.resolutionNotes = payload.resolutionNotes;
        return {body: toDispute(dispute)};
    }
}
