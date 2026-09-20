// Small helpers shared across the resource handlers: id generation, time
// formatting and the pagination envelope every collection GET returns.

import ballerina/time;
import ballerina/uuid;

# A fresh row id.
#
# + return - a random UUID
function newId() returns string {
    return uuid:createRandomUuid();
}

# The current instant, for a `created_at` column.
#
# + return - now, as `time:Utc`
function nowUtc() returns time:Utc {
    return time:utcNow();
}

# An RFC3339 string for a `date-time` field, from a stored `time:Utc`.
#
# + instant - the instant to format
# + return - its RFC3339 representation
function formatUtc(time:Utc instant) returns string {
    return time:utcToString(instant);
}

# Parses an RFC3339 `date-time` string from a request payload.
#
# + text - the string to parse
# + return - the parsed instant, or an error when it is not RFC3339
function parseUtc(string text) returns time:Utc|error {
    return time:utcFromString(text);
}

# The relative URI for the next/previous page of a collection, or `()` when
# there isn't one.
#
# + basePath - the collection's own path, e.g. `/merchants`
# + extraQuery - filter query params already applied (without `limit`/`offset`), already URL-safe
# + total - total matching rows
# + 'limit - the page size requested
# + offset - the offset requested
# + return - [previous, next], each `()` when that page does not exist
function pageLinks(string basePath, string extraQuery, int total, int 'limit, int offset)
        returns [string?, string?] {
    string? previous = ();
    if offset > 0 {
        int prevOffset = offset - 'limit;
        if prevOffset < 0 {
            prevOffset = 0;
        }
        previous = string `${basePath}?${extraQuery}limit=${'limit}&offset=${prevOffset}`;
    }
    string? next = ();
    if offset + 'limit < total {
        next = string `${basePath}?${extraQuery}limit=${'limit}&offset=${offset + 'limit}`;
    }
    return [previous, next];
}

# Clamps a caller-supplied page size to the contract's bounds (max 100).
#
# + requested - the `limit` query parameter as given
# + return - a value between 1 and 100
function clampLimit(int requested) returns int {
    if requested < 1 {
        return 20;
    }
    if requested > 100 {
        return 100;
    }
    return requested;
}

# Clamps a caller-supplied offset to a non-negative value.
#
# + requested - the `offset` query parameter as given
# + return - a value >= 0
function clampOffset(int requested) returns int {
    return requested < 0 ? 0 : requested;
}

function badRequest(string message) returns ErrorBadRequest => {body: {code: 400, message}};

function notFoundError(string message) returns ErrorNotFound => {body: {code: 404, message}};
