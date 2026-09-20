// All environment-driven configuration for this service, in one place.
//
// Every value has a sensible default so the service starts with no required
// environment variables; the platform overrides each one via the wiring in
// workload.yaml when it deploys this component.

import ballerina/os;

# One environment variable, or a default when it is unset.
#
# + name - the environment variable to read
# + default - the value to use when it is unset
# + return - the environment variable's value, or `default`
function envOrDefault(string name, string default) returns string {
    string value = os:getEnv(name);
    return value == "" ? default : value;
}

// payments-db (platform-resource, postgres-cnpg) — see design.json's wiring block.
configurable string paymentsDbHost = envOrDefault("PAYMENTS_DB_HOST", "localhost");
configurable string paymentsDbPort = envOrDefault("PAYMENTS_DB_PORT", "5432");
configurable string paymentsDbName = envOrDefault("PAYMENTS_DB_DBNAME", "payments");
configurable string paymentsDbUser = envOrDefault("PAYMENTS_DB_USER", "postgres");
configurable string paymentsDbPassword = envOrDefault("PAYMENTS_DB_PASSWORD", "postgres");

// org-service dependencies — each address is injected as <DEP_NAME>_URL.
configurable string internalPaymentsUrl = envOrDefault("INTERNAL_PAYMENTS_URL", "http://localhost:8080/v1");
configurable string internalSmsUrl = envOrDefault("INTERNAL_SMS_URL", "http://localhost:8081/v1");
configurable string internalEmailUrl = envOrDefault("INTERNAL_EMAIL_URL", "http://localhost:8082/v1");
