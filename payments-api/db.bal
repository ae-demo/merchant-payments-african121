// The payments-db connection and its schema.
//
// The client is created lazily, on the first request that actually touches
// the database, rather than at module load. `postgresql:Client`'s
// constructor opens a real connection synchronously and fails immediately
// when the database is unreachable — eager module-level construction would
// make every `bal test` run (including the gateway-assertion tests, which
// never touch the database) depend on a live database being reachable at
// compile-check time. Deferring the connection to first use keeps the two
// concerns apart: `bal build`/`bal test` verify the code, and the platform
// supplies a reachable database at deploy time.

import ballerina/log;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

postgresql:Client? dbClientHolder = ();

# The shared database client, connecting on first use and reused afterwards.
#
# + return - the connected client, or the connection error
function dbClient() returns postgresql:Client|error {
    postgresql:Client? existing = dbClientHolder;
    if existing is postgresql:Client {
        return existing;
    }
    int dbPort = 5432;
    int|error parsedPort = int:fromString(paymentsDbPort);
    if parsedPort is int {
        dbPort = parsedPort;
    }
    postgresql:Client newClient = check new (
        host = paymentsDbHost,
        port = dbPort,
        username = paymentsDbUser,
        password = paymentsDbPassword,
        database = paymentsDbName
    );
    check ensureSchema(newClient);
    dbClientHolder = newClient;
    return newClient;
}

# Creates every table this service owns, if it does not already exist.
#
# + dbc - the connected client
# + return - an error when a statement fails
function ensureSchema(postgresql:Client dbc) returns error? {
    _ = check dbc->execute(`
        CREATE TABLE IF NOT EXISTS merchants (
            id TEXT PRIMARY KEY,
            owner_sub TEXT NOT NULL UNIQUE,
            business_name TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            country TEXT NOT NULL,
            currency TEXT NOT NULL,
            contact_email TEXT NOT NULL,
            contact_phone TEXT NOT NULL,
            kyc_status TEXT NOT NULL DEFAULT 'pending',
            balance BIGINT NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
    _ = check dbc->execute(`
        CREATE TABLE IF NOT EXISTS payment_links (
            id TEXT PRIMARY KEY,
            merchant_id TEXT NOT NULL REFERENCES merchants(id),
            amount BIGINT NOT NULL,
            currency TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            qr_code_url TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            expires_at TIMESTAMPTZ
        )
    `);
    _ = check dbc->execute(`
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            merchant_id TEXT NOT NULL REFERENCES merchants(id),
            payment_link_id TEXT NOT NULL REFERENCES payment_links(id),
            method TEXT NOT NULL,
            amount BIGINT NOT NULL,
            currency TEXT NOT NULL,
            status TEXT NOT NULL,
            external_payment_id TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
    _ = check dbc->execute(`
        CREATE TABLE IF NOT EXISTS refunds (
            id TEXT PRIMARY KEY,
            transaction_id TEXT NOT NULL REFERENCES transactions(id),
            amount BIGINT NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
    _ = check dbc->execute(`
        CREATE TABLE IF NOT EXISTS payouts (
            id TEXT PRIMARY KEY,
            merchant_id TEXT NOT NULL REFERENCES merchants(id),
            amount BIGINT NOT NULL,
            currency TEXT NOT NULL,
            destination_type TEXT NOT NULL,
            bank_account_number TEXT,
            bank_code TEXT,
            mobile_wallet_number TEXT,
            status TEXT NOT NULL,
            external_payout_id TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
    _ = check dbc->execute(`
        CREATE TABLE IF NOT EXISTS disputes (
            id TEXT PRIMARY KEY,
            merchant_id TEXT NOT NULL REFERENCES merchants(id),
            payout_id TEXT REFERENCES payouts(id),
            subject TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open',
            resolution_notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
    log:printInfo("payments-db schema ready");
}
