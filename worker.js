import { DurableObject } from "cloudflare:workers";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export class PosSyncStore extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
  }

  async fetch(request) {
    const method = request.method.toUpperCase();

    if (method === "GET") {
      const payload = await this.ctx.storage.get("payload");
      return json(payload ?? null);
    }

    if (method === "PUT") {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return json({ error: "invalid_json" }, 400);
      }

      if (!payload || typeof payload !== "object" || !(payload.state || payload.data)) {
        return json({ error: "invalid_pos_payload" }, 400);
      }

      await this.ctx.storage.put("payload", payload);
      return json(payload);
    }

    if (method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }

    return json({ error: "method_not_allowed" }, 405);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Existing POS client calls: /kagoshima/main.json
    if (url.pathname === "/kagoshima/main.json") {
      // Optional hardening: if SYNC_TOKEN is configured as a Worker secret,
      // the existing POS "認証トークン" field is used automatically.
      if (env.SYNC_TOKEN) {
        const supplied = url.searchParams.get("auth") || "";
        if (supplied !== env.SYNC_TOKEN) {
          return json({ error: "unauthorized" }, 401);
        }
      }

      const stub = env.POS_SYNC.getByName("kagoshima/main");
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};
