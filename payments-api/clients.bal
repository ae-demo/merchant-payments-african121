// Clients for the three org-service dependencies. Each is generated from the
// provider's own OpenAPI contract (fetched via list_org_component_endpoints)
// into modules/<name>, and these are the thin wrappers this service's
// handlers call — never the generated client directly, so a shape change on
// either side has one place to fix.

import payments_api.internalemail;
import payments_api.internalpayments;
import payments_api.internalsms;

import ballerina/log;

final internalpayments:Client paymentsGatewayClient = check new (serviceUrl = internalPaymentsUrl);
final internalsms:Client smsGatewayClient = check new (serviceUrl = internalSmsUrl);
final internalemail:Client emailGatewayClient = check new (serviceUrl = internalEmailUrl);

# internal-payments has no notion of "mobile-money vs card" — only the
# channel the payment was initiated from. A mobile money payment is placed
# from the customer's phone, a card payment from the merchant's web checkout,
# so that is the mapping used here.
#
# + method - this contract's own `PaymentRequest.method`
# + return - the channel internal-payments expects
function paymentMethodToChannel(string method) returns internalpayments:Channel {
    return method == "mobile-money" ? "mobile" : "web";
}

# The outcome this service cares about from an internal-payments payment —
# everything a handler needs, without exposing the generated client's own
# types to the rest of the service.
type PaymentOutcome record {|
    "pending"|"declined"|"authorized" status;
    string? externalId;
|};

# The outcome this service cares about from an internal-payments payout.
type PayoutOutcome record {|
    "pending"|"failed"|"paid" status;
    string? externalId;
|};

# Authorises a customer payment through the internal-payments gateway.
#
# + merchantId - the merchant being paid
# + amount - the amount in minor currency units
# + currency - the payment's currency
# + method - `mobile-money` or `card`, from the customer's `PaymentRequest`
# + reference - this service's own transaction id, for correlation
# + return - the outcome, or a client error
function authorisePayment(string merchantId, int amount, string currency, string method, string reference)
        returns PaymentOutcome|error {
    internalpayments:CreatePaymentRequest req = {
        merchantId,
        amount,
        currency,
        channel: paymentMethodToChannel(method),
        reference
    };
    internalpayments:Payment result = check paymentsGatewayClient->/payments.post(req);
    return {status: result.status, externalId: result.paymentId};
}

# internal-payments only pays out to a bank account. A mobile-wallet payout
# is submitted through the same shape, with the wallet number carried as the
# account number and a sentinel bank code — internal-payments publishes no
# separate mobile-wallet field, and this is the minimal mapping onto the
# contract it actually exposes.
#
# + destinationType - `bank` or `mobile-wallet`, from `PayoutInput`
# + bankAccountNumber - present when `destinationType` is `bank`
# + bankCode - present when `destinationType` is `bank`
# + mobileWalletNumber - present when `destinationType` is `mobile-wallet`
# + return - the bank account internal-payments expects
function toGatewayBankAccount(string destinationType, string? bankAccountNumber, string? bankCode,
        string? mobileWalletNumber) returns internalpayments:BankAccount {
    if destinationType == "bank" {
        return {accountNumber: bankAccountNumber ?: "", bankCode: bankCode ?: ""};
    }
    return {accountNumber: mobileWalletNumber ?: "", bankCode: "MOBILE-WALLET"};
}

# Pays a merchant's balance out through the internal-payments gateway.
#
# + merchantId - the merchant being paid out
# + amount - the amount in minor currency units
# + currency - the payout's currency
# + destinationType - `bank` or `mobile-wallet`
# + bankAccountNumber - present when `destinationType` is `bank`
# + bankCode - present when `destinationType` is `bank`
# + mobileWalletNumber - present when `destinationType` is `mobile-wallet`
# + reference - this service's own payout id, for correlation
# + return - the outcome, or a client error
function requestPayout(string merchantId, int amount, string currency, string destinationType,
        string? bankAccountNumber, string? bankCode, string? mobileWalletNumber, string reference)
        returns PayoutOutcome|error {
    internalpayments:CreatePayoutRequest req = {
        merchantId,
        amount,
        currency,
        bankAccount: toGatewayBankAccount(destinationType, bankAccountNumber, bankCode, mobileWalletNumber),
        reference
    };
    internalpayments:Payout result = check paymentsGatewayClient->/payouts.post(req);
    return {status: result.status, externalId: result.payoutId};
}

# Sends an SMS through internal-sms, logging rather than failing the caller's
# request when delivery cannot be accepted — a notification is best-effort
# and never blocks the payment or payout it is about.
#
# + toNumber - the recipient's phone number
# + body - the message text
function sendSms(string toNumber, string body) {
    if toNumber.trim() == "" {
        return;
    }
    internalsms:SendSmsRequest req = {to: toNumber, body};
    internalsms:SmsMessage|error result = smsGatewayClient->/sms.post(req);
    if result is error {
        log:printWarn("sms notification failed", 'error = result, to = toNumber);
    }
}

# Sends an email through internal-email, logging rather than failing the
# caller's request when delivery cannot be accepted.
#
# + toAddress - the recipient's email address
# + subject - the email subject
# + body - the email body
function sendEmail(string toAddress, string subject, string body) {
    if toAddress.trim() == "" {
        return;
    }
    internalemail:SendEmailRequest req = {to: toAddress, subject, body};
    internalemail:EmailMessage|error result = emailGatewayClient->/emails.post(req);
    if result is error {
        log:printWarn("email notification failed", 'error = result, to = toAddress);
    }
}
