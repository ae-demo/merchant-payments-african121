// Covers the four cases `ballerina`/`thunder-authentication` prescribe for a
// service that verifies the gateway's signed assertion:
//
//   1. a valid assertion is accepted
//   2. one signed by a DIFFERENT key is a 401
//   3. one whose payload was edited after signing is a 401 (never anonymous)
//   4. a `security: []` resource answers 200 with no assertion at all
//
// These exercise the same `AssertionInterceptor` the real service wires
// (`gateway_assertion.bal`), through a small dedicated listener rather than
// the production one: the production resources resolve rows through
// payments-db, and this file's job is the interceptor's own correctness, not
// a live database. Nothing here talks to a real gateway or IdP:
// GATEWAY_ASSERTION_CERTIFICATE, GATEWAY_ASSERTION_ISSUER and
// GATEWAY_ASSERTION_HEADER are exported (from a throwaway RSA keypair under
// tests/resources/) before `bal test` runs, so the interceptor verifies
// against that pinned certificate instead of falling back to its unverified
// mode.

import ballerina/http;
import ballerina/jwt;
import ballerina/lang.regexp;
import ballerina/test;

const string ASSERTION_HEADER = "x-jwt-assertion";
const string ASSERTION_ISSUER = "aep-gateway-test";

listener http:Listener testEp = new (9099);

service http:InterceptableService /test on testEp {
    public function createInterceptors() returns AssertionInterceptor => new;

    # A protected resource that needs a verified caller but touches no store.
    resource function get ping(http:RequestContext ctx) returns http:Ok|http:Unauthorized {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        return <http:Ok>{};
    }

    # The `security: []` case: no identity is ever read here.
    resource function get open() returns http:Ok {
        return {};
    }
}

final http:Client testClient = check new ("http://localhost:9099/test");

function mintAssertion(string keyFile, string subject) returns string|error {
    jwt:IssuerConfig issuerConfig = {
        issuer: ASSERTION_ISSUER,
        username: subject,
        expTime: 300,
        customClaims: {"scope": "merchants:manage balance:read", "ouHandle": "test-org"},
        signatureConfig: {
            config: {keyFile, keyPassword: ""}
        }
    };
    return jwt:issue(issuerConfig);
}

# Flips the last character of the payload segment so the signature no longer
# matches — a stand-in for "the payload was edited after signing" that needs
# no base64/JSON round trip to be reliable.
function tamperPayload(string token) returns string {
    string[] parts = regexp:split(re `\.`, token);
    string payload = parts[1];
    string lastChar = payload.substring(payload.length() - 1, payload.length());
    string replacement = lastChar == "A" ? "B" : "A";
    string tampered = payload.substring(0, payload.length() - 1) + replacement;
    return parts[0] + "." + tampered + "." + parts[2];
}

@test:Config {}
function validAssertionIsAccepted() returns error? {
    string token = check mintAssertion("tests/resources/primary.key.pem", "test-caller-1");
    http:Response res = check testClient->get("/ping", {[ASSERTION_HEADER]: token});
    test:assertEquals(res.statusCode, 200, "a validly-signed assertion must be accepted");
}

@test:Config {}
function differentKeySignatureIsRejected() returns error? {
    string token = check mintAssertion("tests/resources/other.key.pem", "test-caller-2");
    http:Response res = check testClient->get("/ping", {[ASSERTION_HEADER]: token});
    test:assertEquals(res.statusCode, 401, "an assertion signed by an unpinned key must be a 401");
}

@test:Config {}
function tamperedPayloadIsRejected() returns error? {
    string token = check mintAssertion("tests/resources/primary.key.pem", "test-caller-3");
    string tampered = tamperPayload(token);
    http:Response res = check testClient->get("/ping", {[ASSERTION_HEADER]: tampered});
    test:assertEquals(res.statusCode, 401, "a tampered assertion must be a 401, never an anonymous caller");
}

@test:Config {}
function publicResourceNeedsNoAssertion() returns error? {
    http:Response res = check testClient->get("/open");
    test:assertEquals(res.statusCode, 200, "a security:[] resource must answer with no assertion at all");
}
