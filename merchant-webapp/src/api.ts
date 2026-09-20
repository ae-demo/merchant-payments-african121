// The payments-api client: openapi-fetch, typed against the generated client
// in src/generated/payments-api.ts (never hand-written shapes), reached
// same-origin at /api (react-webapp) — nginx proxies it to the payments-api
// sibling. Authorization is entirely src/authz/client.ts's: this file adds
// nothing of its own about it (thunder-authentication).
import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./generated/payments-api";
import { authorizationHeader, classifyResponse, ForbiddenError } from "./authz/client";

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const header = await authorizationHeader();
    if (header) request.headers.set("Authorization", header);
    return request;
  },
  async onResponse({ response }) {
    if ((await classifyResponse(response.status)) === "forbidden") {
      throw new ForbiddenError(response.status);
    }
    return response;
  },
};

export const paymentsApi = createClient<paths>({ baseUrl: "/api" });
paymentsApi.use(authMiddleware);
