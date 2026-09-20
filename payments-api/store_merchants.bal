// Persistence for the `merchants` table.

import ballerina/sql;
import ballerina/time;
import ballerinax/postgresql;

type MerchantRow record {|
    string id;
    string ownerSub;
    string businessName;
    string ownerName;
    string country;
    string currency;
    string contactEmail;
    string contactPhone;
    string kycStatus;
    int balance;
    time:Utc createdAt;
|};

function toMerchant(MerchantRow row) returns Merchant => {
    id: row.id,
    businessName: row.businessName,
    ownerName: row.ownerName,
    country: row.country,
    currency: row.currency,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    kycStatus: <"pending"|"approved"|"rejected">row.kycStatus,
    balance: row.balance
};

# The merchant a caller (identified by the gateway assertion's `sub`) owns.
#
# + ownerSub - the caller's `sub`
# + return - the merchant, `()` when the caller has not registered one, or an error
function findMerchantByOwner(string ownerSub) returns MerchantRow?|error {
    postgresql:Client dbc = check dbClient();
    stream<MerchantRow, sql:Error?> rows = dbc->query(`
        SELECT id, owner_sub as "ownerSub", business_name as "businessName", owner_name as "ownerName",
               country, currency, contact_email as "contactEmail", contact_phone as "contactPhone",
               kyc_status as "kycStatus", balance, created_at as "createdAt"
        FROM merchants WHERE owner_sub = ${ownerSub}
    `);
    MerchantRow[] result = check from MerchantRow r in rows select r;
    check rows.close();
    return result.length() == 0 ? () : result[0];
}

# Any merchant by its id, regardless of owner.
#
# + merchantId - the merchant's id
# + return - the merchant, `()` when it does not exist, or an error
function findMerchantById(string merchantId) returns MerchantRow?|error {
    postgresql:Client dbc = check dbClient();
    stream<MerchantRow, sql:Error?> rows = dbc->query(`
        SELECT id, owner_sub as "ownerSub", business_name as "businessName", owner_name as "ownerName",
               country, currency, contact_email as "contactEmail", contact_phone as "contactPhone",
               kyc_status as "kycStatus", balance, created_at as "createdAt"
        FROM merchants WHERE id = ${merchantId}
    `);
    MerchantRow[] result = check from MerchantRow r in rows select r;
    check rows.close();
    return result.length() == 0 ? () : result[0];
}

# Every merchant, optionally filtered by KYC status, newest first.
#
# + kycStatus - filter, or `()` for every status
# + 'limit - page size
# + offset - page offset
# + return - [rows, totalMatching], or an error
function listMerchants(string? kycStatus, int 'limit, int offset) returns [MerchantRow[], int]|error {
    postgresql:Client dbc = check dbClient();
    sql:ParameterizedQuery whereClause = kycStatus is string
        ? sql:queryConcat(` WHERE kyc_status = ${kycStatus}`)
        : ``;
    stream<MerchantRow, sql:Error?> rows = dbc->query(sql:queryConcat(
        `SELECT id, owner_sub as "ownerSub", business_name as "businessName", owner_name as "ownerName",
                country, currency, contact_email as "contactEmail", contact_phone as "contactPhone",
                kyc_status as "kycStatus", balance, created_at as "createdAt"
         FROM merchants`, whereClause,
        ` ORDER BY created_at DESC LIMIT ${'limit} OFFSET ${offset}`));
    MerchantRow[] page = check from MerchantRow r in rows select r;
    check rows.close();
    int total = check dbc->queryRow(sql:queryConcat(`SELECT COUNT(*) FROM merchants`, whereClause));
    return [page, total];
}

# Inserts a new merchant profile, `pending` KYC and a zero balance.
#
# + ownerSub - the caller's `sub`, who owns this profile
# + input - the submitted profile details
# + return - the created row, or an error
function insertMerchant(string ownerSub, MerchantInput input) returns MerchantRow|error {
    postgresql:Client dbc = check dbClient();
    string id = newId();
    time:Utc createdAt = nowUtc();
    _ = check dbc->execute(`
        INSERT INTO merchants (id, owner_sub, business_name, owner_name, country, currency,
                                contact_email, contact_phone, kyc_status, balance, created_at)
        VALUES (${id}, ${ownerSub}, ${input.businessName}, ${input.ownerName}, ${input.country},
                ${input.currency}, ${input.contactEmail}, ${input.contactPhone}, 'pending', 0, ${createdAt})
    `);
    return {
        id,
        ownerSub,
        businessName: input.businessName,
        ownerName: input.ownerName,
        country: input.country,
        currency: input.currency,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        kycStatus: "pending",
        balance: 0,
        createdAt
    };
}

# Updates an existing merchant's business/KYC details. KYC status and balance
# are never touched here — only admin review and payment/payout settlement
# change those.
#
# + existing - the row being updated
# + input - the submitted profile details
# + return - the updated row, or an error
function updateMerchantProfile(MerchantRow existing, MerchantInput input) returns MerchantRow|error {
    postgresql:Client dbc = check dbClient();
    _ = check dbc->execute(`
        UPDATE merchants
        SET business_name = ${input.businessName}, owner_name = ${input.ownerName}, country = ${input.country},
            currency = ${input.currency}, contact_email = ${input.contactEmail}, contact_phone = ${input.contactPhone}
        WHERE id = ${existing.id}
    `);
    existing.businessName = input.businessName;
    existing.ownerName = input.ownerName;
    existing.country = input.country;
    existing.currency = input.currency;
    existing.contactEmail = input.contactEmail;
    existing.contactPhone = input.contactPhone;
    return existing;
}

# Sets a merchant's KYC status.
#
# + merchantId - the merchant to update
# + kycStatus - `approved` or `rejected`
# + return - an error when the update fails
function setMerchantKycStatus(string merchantId, string kycStatus) returns error? {
    postgresql:Client dbc = check dbClient();
    _ = check dbc->execute(`UPDATE merchants SET kyc_status = ${kycStatus} WHERE id = ${merchantId}`);
}

# Adjusts a merchant's balance by a delta (positive to credit, negative to debit).
#
# + merchantId - the merchant to update
# + delta - the amount to add (or, if negative, subtract)
# + return - an error when the update fails
function adjustMerchantBalance(string merchantId, int delta) returns error? {
    postgresql:Client dbc = check dbClient();
    _ = check dbc->execute(`UPDATE merchants SET balance = balance + ${delta} WHERE id = ${merchantId}`);
}
