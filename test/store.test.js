import test from "node:test";
import assert from "node:assert/strict";
import { createState, execute, availability } from "../lib/store.js";
import { DEMO } from "../lib/demo.js";
const customer = (name) => ({ role: "customer", customer: name });
const command = (id, actor, actions) => ({ requestId: id, actor, actions });
const create = (milk = "oat") => ({
  type: "create",
  items: [{ product: "latte", milk }],
});
test("confirmation reserves stock; third customer cannot oversell", () => {
  let state = createState();
  for (const [i, name] of ["Aria", "Leo", "Mia"].entries()) {
    state = execute(state, command(`c${i}`, customer(name), [create()])).state;
    if (i < 2)
      state = execute(
        state,
        command(`f${i}`, customer(name), [
          { type: "confirm", orderId: `C${12 + i}` },
        ]),
      ).state;
  }
  const before = structuredClone(state);
  assert.throws(
    () =>
      execute(
        state,
        command("f2", customer("Mia"), [{ type: "confirm", orderId: "C14" }]),
      ),
    { code: "OUT_OF_STOCK" },
  );
  assert.deepEqual(state, before);
  assert.equal(availability(state).oat.available, 0);
});
test("atomic actions roll back, including next order id", () => {
  const state = createState();
  assert.throws(
    () =>
      execute(
        state,
        command("atomic", customer("Aria"), [
          create(),
          { type: "confirm", orderId: "missing" },
        ]),
      ),
    { code: "NOT_FOUND" },
  );
  assert.equal(state.orders.length, 0);
  assert.equal(state.nextOrder, 12);
});
test("idempotent retry and conflicting reuse", () => {
  const input = command("same", customer("Aria"), [create()]);
  const first = execute(createState(), input);
  const retry = execute(first.state, input);
  assert.equal(retry.result.duplicate, true);
  assert.equal(retry.state.orders.length, 1);
  assert.equal(retry.state.revision, 1);
  assert.throws(
    () => execute(first.state, { ...input, actions: [create("dairy")] }),
    { code: "ID_REUSED" },
  );
});
test("late change needs staff acceptance and updates inventory as a delta", () => {
  let state = createState();
  const run = (id, actor, action) => {
    state = execute(state, command(id, actor, [action])).state;
  };
  const owner = customer("Aria"),
    bar = { role: "barista" };
  run("create", owner, create("dairy"));
  run("confirm", owner, { type: "confirm", orderId: "C12" });
  run("start", bar, { type: "start", orderId: "C12", itemId: "C12-1" });
  run("change", owner, {
    type: "change",
    orderId: "C12",
    itemId: "C12-1",
    changes: { milk: "oat" },
  });
  assert.equal(state.orders[0].items[0].milk, "dairy");
  assert.equal(availability(state).dairy.reserved, 1);
  assert.throws(
    () =>
      execute(
        state,
        command("ready", bar, [
          { type: "ready", orderId: "C12", itemId: "C12-1" },
        ]),
      ),
    { code: "INVALID_STATE" },
  );
  run("accept", bar, { type: "acceptChange", orderId: "C12", itemId: "C12-1" });
  assert.equal(availability(state).dairy.reserved, 0);
  assert.equal(availability(state).oat.reserved, 1);
  run("finish", bar, { type: "ready", orderId: "C12", itemId: "C12-1" });
  assert.equal(state.stock.oat, 1);
  assert.equal(availability(state).oat.reserved, 0);
  assert.equal(state.orders[0].status, "complete");
});
test("customer ownership, staff restriction, and stale versions", () => {
  const state = execute(
    createState(),
    command("new", customer("Aria"), [create()]),
  ).state;
  assert.throws(
    () =>
      execute(
        state,
        command("other", customer("Leo"), [
          { type: "confirm", orderId: "C12" },
        ]),
      ),
    { code: "FORBIDDEN" },
  );
  assert.throws(
    () =>
      execute(
        state,
        command("stale", customer("Aria"), [
          { type: "confirm", orderId: "C12", expectedVersion: 0 },
        ]),
      ),
    { code: "STALE_VERSION" },
  );
  assert.throws(
    () =>
      execute(
        state,
        command("stock", customer("Aria"), [
          { type: "restock", ingredient: "oat", amount: 10 },
        ]),
      ),
    { code: "FORBIDDEN" },
  );
});
test("handoff waits for every cup, archives the order, and never consumes stock twice", () => {
  const owner = customer("Aria"), bar = {role:"barista"};
  let state = execute(createState(),command("handoff:create",owner,[{type:"create",items:[{product:"latte",milk:"dairy"},{product:"latte",milk:"oat"}]}])).state;
  state = execute(state,command("handoff:confirm",owner,[{type:"confirm",orderId:"C12"}])).state;
  const finish = (id) => {state=execute(state,command(`handoff:${id}`,bar,[{type:"start",orderId:"C12",itemId:id},{type:"ready",orderId:"C12",itemId:id}])).state;};
  finish("C12-2");
  assert.equal(state.orders[0].status,"confirmed");
  assert.throws(()=>execute(state,command("handoff:early",bar,[{type:"collect",orderId:"C12"}])),{code:"INVALID_STATE"});
  finish("C12-1");
  assert.equal(state.orders[0].status,"complete");
  const stock = structuredClone(state.stock);
  assert.throws(()=>execute(state,command("handoff:customer",owner,[{type:"collect",orderId:"C12"}])),{code:"FORBIDDEN"});
  const collect=command("handoff:collect",bar,[{type:"collect",orderId:"C12"}]);
  state=execute(state,collect).state;
  assert.equal(state.orders[0].status,"collected");
  assert.ok(state.orders[0].collectedAt);
  assert.deepEqual(state.stock,stock);
  assert.equal(execute(state,collect).result.duplicate,true);
  assert.throws(()=>execute(state,command("handoff:again",bar,[{type:"collect",orderId:"C12"}])),{code:"INVALID_STATE"});
  assert.deepEqual(state.stock,stock);
});
test("full authored demo is valid and includes a genuine rejected transaction and duplicate", () => {
  let state = createState(),
    duplicate = false;
  for (const [i, cue] of DEMO.entries()) {
    const input = command(
      `demo:${cue.duplicateOf ?? i}`,
      cue.actor,
      cue.actions,
    );
    if (cue.expectedError) {
      assert.throws(() => execute(state, input), { code: cue.expectedError });
      continue;
    }
    const output = execute(state, input);
    state = output.state;
    duplicate ||= output.result.duplicate;
  }
  assert.equal(state.orders.length, 3);
  assert.equal(state.orders[0].items[1].temperature, "hot");
  assert.equal(state.orders[0].items[1].status, "ready");
  assert.equal(availability(state).oat.available, 0);
  assert.equal(duplicate, true);
});
