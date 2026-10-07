import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";
import QRCode from "qrcode";
import {
  createState,
  execute,
  publicState,
  DomainError,
  recipe,
} from "./lib/store.js";
import { DEMO } from "./lib/demo.js";
import { parseIntent, remoteStatus, TTS, ASR } from "./lib/inference.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MIME = {
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".wav": "audio/wav",
  ".json": "application/json",
};
const instructions = {
  assistant:
    "A warm, clear young adult female voice with a neutral American English accent. Calm, friendly and confident, like a helpful café host. Natural conversational pace, light warmth, no exaggerated excitement.",
  Aria: "A young adult woman with a clear, relaxed American English voice. Casual and friendly, ordering coffee in a café. Conversational, not a commercial narrator.",
  Leo: "A young adult man with a mellow, clear American English voice. Relaxed and friendly, ordering a coffee. Natural conversational pace.",
  Mia: "A young adult woman with a light, bright American English voice, distinct from a café assistant. Curious and friendly, natural conversational pace.",
  barista:
    "A young adult man with a clear, slightly low American English voice. A focused barista speaking casually to a colleague. Natural and confident.",
};
export function wav(pcm, sampleRate = 24000) {
  const header = Buffer.alloc(44);
  header.write("RIFF");
  header.writeUInt32LE(pcm.length + 36, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
export function createApp({
  dataDir = path.join(ROOT, "data"),
  persist = true,
} = {}) {
  fs.mkdirSync(dataDir, { recursive: true });
  const stateFile = path.join(dataDir, "state.json");
  let state =
    persist && fs.existsSync(stateFile)
      ? JSON.parse(fs.readFileSync(stateFile, "utf8"))
      : createState();
  let demo = {
      runId: null,
      index: -1,
      total: DEMO.length,
      active: false,
      last: null,
    },
    connections = 0;
  let ttsTail = Promise.resolve();
  const save = () => {
    if (persist) {
      fs.writeFileSync(`${stateFile}.tmp`, JSON.stringify(state));
      fs.renameSync(`${stateFile}.tmp`, stateFile);
    }
  };
  const snapshot = () => ({
    type: "snapshot",
    state: publicState(state),
    demo,
    connections,
  });
  const broadcast = () => {
    const payload = JSON.stringify(snapshot());
    for (const client of wss.clients)
      if (client.readyState === 1) client.send(payload);
  };
  const commit = (command) => {
    const out = execute(state, command);
    const old = state;
    state = out.state;
    try {
      save();
    } catch (e) {
      state = old;
      throw e;
    }
    broadcast();
    return out.result;
  };
  const send = (res, status, payload) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(payload));
  };
  const read = async (req, limit = 6_000_000) => {
    let chunks = [],
      size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > limit)
        throw new DomainError("TOO_LARGE", "Request too large.");
      chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString() || "{}");
  };
  const serve = (res, file) => {
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      send(res, 404, { error: "Not found" });
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(file).pipe(res);
  };
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (req.method === "GET" && url.pathname === "/api/state")
        return send(res, 200, snapshot());
      if (req.method === "GET" && url.pathname === "/api/status")
        return send(res, 200, {
          ok: true,
          remote: await remoteStatus(),
          audio: DEMO.every((_,index)=>['user','assistant'].every(kind=>fs.existsSync(path.join(ROOT,`public/audio/${index}-${kind}.wav`)))),
          mode: "Self-hosted GPU / curated playback",
          auth: "Demo role separation; no production authentication",
        });
      if (req.method === "GET" && url.pathname === "/api/recipe") {
        const order = state.orders.find(
            (o) => o.id === url.searchParams.get("orderId"),
          ),
          item = order?.items.find(
            (i) => i.id === url.searchParams.get("itemId"),
          );
        if (!item) throw new DomainError("NOT_FOUND", "Drink not found.");
        return send(res, 200, recipe(item));
      }
      if (req.method === "GET" && url.pathname === "/api/qr") {
        const target = new URL(
          "/customer",
          url.searchParams.get("base") ?? "http://localhost:4317",
        );
        target.searchParams.set(
          "customer",
          url.searchParams.get("customer") ?? "Aria",
        );
        const svg = await QRCode.toString(target.toString(), {
          type: "svg",
          margin: 1,
          color: { dark: "#203b32", light: "#ffffff" },
        });
        res.writeHead(200, { "Content-Type": "image/svg+xml" });
        return res.end(svg);
      }
      if (req.method === "POST" && url.pathname === "/api/command") {
        if (demo.active)
          throw new DomainError(
            "DEMO_LOCKED",
            "Switch to Free play before editing the curated scenario.",
          );
        return send(res, 200, commit(await read(req)));
      }
      if (req.method === "POST" && url.pathname === "/api/demo/reset") {
        state = createState();
        demo = {
          runId: randomUUID(),
          index: -1,
          total: DEMO.length,
          active: true,
          last: null,
        };
        save();
        broadcast();
        return send(res, 200, snapshot());
      }
      if (req.method === "POST" && url.pathname === "/api/demo/next") {
        if (!demo.active)
          throw new DomainError(
            "DEMO_INACTIVE",
            "Start the guided demo first.",
          );
        const index = demo.index + 1;
        if (index >= DEMO.length)
          return send(res, 200, { finished: true, ...snapshot() });
        const cue = DEMO[index],
          requestId = `demo:${cue.duplicateOf ?? index}`;
        let outcome;
        try {
          outcome = commit({
            requestId,
            actor: cue.actor,
            actions: cue.actions,
          });
          if (cue.expectedError)
            throw new Error("Expected constraint did not fire.");
        } catch (e) {
          if (e.code !== cue.expectedError) throw e;
          outcome = { ok: false, code: e.code, message: e.message };
        }
        demo = {
          ...demo,
          index,
          last: {
            ...cue,
            index,
            outcome,
            source: "Authored script + real transactions",
            userAudio: fs.existsSync(
              path.join(ROOT, `public/audio/${index}-user.wav`),
            )
              ? `/audio/${index}-user.wav`
              : null,
            assistantAudio: fs.existsSync(
              path.join(ROOT, `public/audio/${index}-assistant.wav`),
            )
              ? `/audio/${index}-assistant.wav`
              : null,
          },
        };
        broadcast();
        return send(res, 200, snapshot());
      }
      if (req.method === "POST" && url.pathname === "/api/demo/stop") {
        demo = { ...demo, active: false };
        broadcast();
        return send(res, 200, snapshot());
      }
      if (req.method === "POST" && url.pathname === "/api/intent") {
        if (demo.active)
          throw new DomainError(
            "DEMO_LOCKED",
            "Switch to Free play to talk to the remote model.",
          );
        const body = await read(req, 100_000);
        if (
          typeof body.text !== "string" ||
          body.text.trim().length === 0 ||
          body.text.length > 2000
        )
          throw new DomainError(
            "INVALID_TEXT",
            "Please enter a short request.",
          );
        if (
          !body.actor ||
          !["customer", "barista", "manager"].includes(body.actor.role)
        )
          throw new DomainError("FORBIDDEN", "Choose a valid role.");
        const observed = publicState(state);
        const parsed = await parseIntent({ ...body, state: observed });
        if (demo.active || state.createdAt !== observed.createdAt)
          throw new DomainError(
            "STALE_SESSION",
            "The workspace was reset. Please try your request again.",
          );
        let result = { ok: true, message: parsed.reply };
        if (parsed.actions.length) {
          const actions = parsed.actions.map((a) => ({
            ...a,
            ...(a.orderId
              ? {
                  expectedVersion: observed.orders.find(
                    (o) => o.id === a.orderId,
                  )?.version,
                }
              : {}),
          }));
          result = commit({
            requestId: body.requestId,
            actor: body.actor,
            actions,
          });
        }
        return send(res, 200, {
          ...result,
          source: parsed.model,
          elapsedMs: parsed.elapsedMs,
          actions: parsed.actions,
        });
      }
      if (req.method === "POST" && url.pathname === "/api/transcribe") {
        const body = await read(req);
        if (typeof body.audio !== "string" || body.audio.length > 5_500_000)
          throw new DomainError("INVALID_AUDIO", "Record a shorter clip.");
        const response = await fetch(`${ASR}/transcribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: body.audio }),
          signal: AbortSignal.timeout(90000),
        });
        const payload = await response.json();
        return send(res, response.status, payload);
      }
      if (req.method === "POST" && url.pathname === "/api/speak") {
        const body = await read(req, 20000);
        if (typeof body.text !== "string" || body.text.length > 800)
          throw new DomainError("INVALID_TEXT", "Speech text is too long.");
        const voice = Object.hasOwn(instructions, body.voice)
          ? body.voice
          : "assistant";
        const hash = createHash("sha256")
          .update(`qwen3-tts:${TTS}:${voice}:${body.text}`)
          .digest("hex");
        const file = path.join(dataDir, `${hash}.wav`);
        const generate = async () => {
          if (!fs.existsSync(file)) {
            const form = new FormData();
            form.set("text", body.text);
            form.set("voice", voice);
            const response = await fetch(`${TTS}/v1/audio/speech`, {
              method: "POST",
              body: form,
              signal: AbortSignal.timeout(180000),
            });
            if (!response.ok)
              throw new Error("Remote speech generation is unavailable.");
            const pcm = Buffer.from(await response.arrayBuffer());
            if (pcm.length < 1000)
              throw new Error("Remote speech returned no audio.");
            fs.writeFileSync(
              file,
              wav(pcm, Number(response.headers.get("X-Sample-Rate")) || 24000),
            );
          }
        };
        const task = ttsTail.then(generate);
        ttsTail = task.catch(() => {});
        await task;
        return send(res, 200, {
          url: `/api/audio/${hash}`,
          source: "Qwen3-TTS · remote GPU",
        });
      }
      if (
        req.method === "GET" &&
        /^\/api\/audio\/[a-f0-9]{64}$/.test(url.pathname)
      )
        return serve(
          res,
          path.join(dataDir, `${url.pathname.split("/").at(-1)}.wav`),
        );
      if (req.method === "GET") {
        const relative =
          url.pathname === "/" || url.pathname === "/customer"
            ? "index.html"
            : decodeURIComponent(url.pathname).replace(/^\/+/, "");
        const file = path.resolve(ROOT, "public", relative);
        if (!file.startsWith(path.join(ROOT, "public") + path.sep))
          throw new DomainError("FORBIDDEN", "Invalid path.");
        return serve(res, file);
      }
      send(res, 404, { error: "Not found" });
    } catch (e) {
      send(res, e instanceof DomainError ? 409 : 502, {
        ok: false,
        code: e.code ?? "SERVICE_ERROR",
        message: e instanceof SyntaxError ? "Invalid JSON." : e.message,
      });
    }
  });
  const wss = new WebSocketServer({ server, path: "/ws" });
  wss.on("connection", (client) => {
    connections++;
    broadcast();
    client.on("close", () => {
      connections--;
      broadcast();
    });
    client.on("error", () => {});
  });
  const heartbeat = setInterval(() => {
    for (const client of wss.clients) {
      if (client.isAlive === false) {
        client.terminate();
        continue;
      }
      client.isAlive = false;
      client.ping();
    }
  }, 25000);
  heartbeat.unref();
  wss.on("connection", (client) => {
    client.isAlive = true;
    client.on("pong", () => (client.isAlive = true));
  });
  server.on("close", () => {
    clearInterval(heartbeat);
    wss.close();
  });
  return { server, wss, getState: () => publicState(state) };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const { server } = createApp();
  const port = Number(process.env.PORT ?? 4317),
    host = process.env.HOST ?? "127.0.0.1";
  server.listen(port, host, () =>
    console.log(`CafeOS Voice · http://${host}:${port} · optional remote models`),
  );
}
