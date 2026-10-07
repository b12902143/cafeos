import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { once } from "node:events";
import { WebSocket } from "ws";
import { createApp } from "../server.js";
test("two real clients receive the same committed revision; retry survives restart", async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cafeos-test-"));
  const app = createApp({ dataDir });
  app.server.listen(0, "127.0.0.1");
  await once(app.server, "listening");
  const address = app.server.address(),
    base = `http://127.0.0.1:${address.port}`;
  const a = new WebSocket(`ws://127.0.0.1:${address.port}/ws`),
    b = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
  try {
    await Promise.all([once(a, "open"), once(b, "open")]);
    const waitRevision = (client) =>
      new Promise((resolve) =>
        client.on("message", (data) => {
          const message = JSON.parse(data);
          if (message.state.revision === 1) resolve(message.state);
        }),
      );
    const snapshots = Promise.all([waitRevision(a), waitRevision(b)]);
    const command = {
      requestId: "persisted-confirm",
      actor: { role: "customer", customer: "Aria" },
      actions: [{ type: "create", items: [{ product: "latte", milk: "oat" }] }],
    };
    const post = await fetch(`${base}/api/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });
    assert.equal(post.status, 200);
    const [stateA, stateB] = await snapshots;
    assert.deepEqual(stateA, stateB);
    assert.equal(stateA.orders.length, 1);
    const restarted = createApp({ dataDir });
    restarted.server.listen(0, "127.0.0.1");
    await once(restarted.server, "listening");
    try {
      const retried = await fetch(
        `http://127.0.0.1:${restarted.server.address().port}/api/command`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        },
      );
      assert.equal((await retried.json()).duplicate, true);
      assert.equal(restarted.getState().orders.length, 1);
    } finally {
      await new Promise((resolve) => restarted.server.close(resolve));
    }
  } finally {
    a.terminate();
    b.terminate();
    await new Promise((resolve) => app.server.close(resolve));
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
