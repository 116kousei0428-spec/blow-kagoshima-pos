const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export class PosSyncStore {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const method = request.method.toUpperCase();

    if (method === "GET") {
      const payload = await this.state.storage.get("payload");
      return json(payload ?? null);
    }

    if (method === "PUT") {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return json({ error: "invalid_json" }, 400);
      }

      if (!payload || typeof payload !== "object") {
        return json({ error: "invalid_pos_payload" }, 400);
      }

      await this.state.storage.put("payload", payload);
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

    if (url.pathname === "/kagoshima/main.json") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, PUT, OPTIONS",
            "access-control-allow-headers": "content-type",
            "access-control-max-age": "86400",
          },
        });
      }

      if (env.SYNC_TOKEN) {
        const supplied = url.searchParams.get("auth") || "";
        if (supplied !== env.SYNC_TOKEN) {
          return json({ error: "unauthorized" }, 401);
        }
      }

      const id = env.POS_SYNC.idFromName("kagoshima/main");
      const stub = env.POS_SYNC.get(id);
      const response = await stub.fetch(request);
      const headers = new Headers(response.headers);
      headers.set("access-control-allow-origin", "*");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
