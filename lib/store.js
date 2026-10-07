import { createHash } from "node:crypto";

export const MENU = [
  {
    id: "americano",
    name: "Americano",
    zh: "美式咖啡",
    price: 120,
    color: "#583b28",
    ingredient: "espresso",
    milk: false,
    note: "Clean, bold, beautifully simple.",
  },
  {
    id: "latte",
    name: "Caffè latte",
    zh: "拿鐵",
    price: 150,
    color: "#bf9871",
    ingredient: "espresso",
    milk: true,
    note: "Espresso meets silky milk.",
  },
  {
    id: "matcha",
    name: "Matcha latte",
    zh: "抹茶拿鐵",
    price: 160,
    color: "#7e9854",
    ingredient: "matcha",
    milk: true,
    note: "A little green, a little calm.",
  },
  {
    id: "tea",
    name: "Black tea",
    zh: "紅茶",
    price: 80,
    color: "#bd7740",
    ingredient: "tea",
    milk: false,
    note: "Slow-steeped. Bright and balanced.",
  },
];
export const STOCK = { espresso: 24, dairy: 16, oat: 2, matcha: 12, tea: 12 };
export const INGREDIENT_NAMES = {
  espresso: "Espresso",
  dairy: "Dairy milk",
  oat: "Oat milk",
  matcha: "Matcha",
  tea: "Black tea",
};
export class DomainError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
const fail = (code, message) => {
  throw new DomainError(code, message);
};
const assert = (condition, code, message) => {
  if (!condition) fail(code, message);
};
export function createState() {
  return {
    revision: 0,
    nextOrder: 12,
    stock: { ...STOCK },
    orders: [],
    events: [],
    receipts: {},
    createdAt: new Date().toISOString(),
  };
}
export function normalizeItem(input) {
  assert(
    input && typeof input === "object",
    "INVALID_ITEM",
    "A drink is required.",
  );
  const product = MENU.find((p) => p.id === input.product);
  assert(product, "INVALID_ITEM", "That drink is not on the menu.");
  const size = input.size ?? "regular",
    temperature = input.temperature ?? "hot",
    milk = product.milk ? (input.milk ?? "dairy") : "none";
  assert(
    ["regular", "large"].includes(size),
    "INVALID_ITEM",
    "Choose regular or large.",
  );
  assert(
    ["hot", "iced"].includes(temperature),
    "INVALID_ITEM",
    "Choose hot or iced.",
  );
  assert(
    (product.milk ? ["dairy", "oat"] : ["none"]).includes(milk),
    "INVALID_ITEM",
    "Choose dairy or oat milk.",
  );
  return {
    product: product.id,
    size,
    temperature,
    milk,
    price:
      product.price + (size === "large" ? 20 : 0) + (milk === "oat" ? 20 : 0),
  };
}
export function requirements(item) {
  const p = MENU.find((p) => p.id === item.product);
  return { [p.ingredient]: 1, ...(p.milk ? { [item.milk]: 1 } : {}) };
}
export function reservations(state) {
  const total = Object.fromEntries(Object.keys(STOCK).map((k) => [k, 0]));
  for (const order of state.orders)
    if (order.status === "confirmed") {
      for (const item of order.items)
        if (["queued", "making"].includes(item.status)) {
          for (const [k, v] of Object.entries(requirements(item)))
            total[k] += v;
        }
    }
  return total;
}
export function availability(state) {
  const reserved = reservations(state);
  return Object.fromEntries(
    Object.keys(STOCK).map((k) => [
      k,
      {
        name: INGREDIENT_NAMES[k],
        stock: state.stock[k],
        reserved: reserved[k],
        available: state.stock[k] - reserved[k],
      },
    ]),
  );
}
function validateInventory(state) {
  const inv = availability(state);
  for (const [k, v] of Object.entries(inv))
    assert(
      v.available >= 0,
      "OUT_OF_STOCK",
      `${v.name} just ran out. Please choose another option.`,
    );
}
const describe = (item) =>
  `${item.temperature} ${item.milk === "oat" ? "oat " : ""}${MENU.find((p) => p.id === item.product).name}`;
export function recipe(item) {
  const p = MENU.find((p) => p.id === item.product),
    milk = item.milk === "oat" ? "oat milk" : "dairy milk";
  const steps =
    p.id === "latte"
      ? [
          "Check the ticket: " + describe(item) + ".",
          "Extract a double espresso according to the café recipe.",
          item.temperature === "hot"
            ? `Steam ${milk} until silky; use the café temperature target.`
            : `Add ice and cold ${milk} to the cup.`,
          "Pour espresso, finish the drink, and check the ticket again.",
        ]
      : p.id === "matcha"
        ? [
            "Check the ticket: " + describe(item) + ".",
            "Sift and whisk one portion of matcha with water until smooth.",
            item.temperature === "hot"
              ? `Steam ${milk} and combine with the matcha.`
              : `Add ice and cold ${milk}, then pour in the matcha.`,
            "Mix, wipe the cup, and check the ticket.",
          ]
        : p.id === "americano"
          ? [
              "Check the ticket: " + describe(item) + ".",
              "Extract a double espresso according to the café recipe.",
              item.temperature === "iced"
                ? "Fill the cup with ice and filtered water."
                : "Add hot filtered water to the cup.",
              "Combine, wipe the cup, and check the ticket.",
            ]
          : [
              "Check the ticket: " + describe(item) + ".",
              "Use one portion of the café black tea.",
              item.temperature === "iced"
                ? "Pour the tea over ice."
                : "Pour hot tea into the cup.",
              "Check the cup and ticket before serving.",
            ];
  return {
    steps,
    index: item.step ?? 0,
    current: steps[Math.min(item.step ?? 0, steps.length - 1)],
    basis: "Store recipe + staff-reported progress",
  };
}
export function publicState(state) {
  return {
    revision: state.revision,
    orders: state.orders,
    inventory: availability(state),
    events: state.events,
    menu: MENU,
    createdAt: state.createdAt,
  };
}
function mutate(state, action, actor) {
  assert(
    action && typeof action.type === "string",
    "INVALID_COMMAND",
    "An action is required.",
  );
  const staff = ["barista", "manager"].includes(actor.role);
  const order = state.orders.find((o) => o.id === action.orderId);
  const getOrder = () => {
    assert(order, "NOT_FOUND", "Order not found.");
    assert(
      staff || order.customer === actor.customer,
      "FORBIDDEN",
      "This order belongs to another customer.",
    );
    return order;
  };
  const getItem = () => {
    getOrder();
    const i = order.items.find((i) => i.id === action.itemId);
    assert(i, "NOT_FOUND", "Drink not found.");
    return i;
  };
  const bump = () => {
    order.version++;
    order.updatedAt = new Date().toISOString();
  };
  switch (action.type) {
    case "create": {
      assert(
        actor.role === "customer" &&
          typeof actor.customer === "string" &&
          actor.customer.length > 0 &&
          actor.customer.length <= 40,
        "FORBIDDEN",
        "Choose a customer first.",
      );
      assert(
        Array.isArray(action.items) &&
          action.items.length > 0 &&
          action.items.length <= 8,
        "INVALID_ITEM",
        "Choose 1 to 8 drinks.",
      );
      assert(
        !state.orders.some(
          (o) => o.customer === actor.customer && o.status === "draft",
        ),
        "DRAFT_EXISTS",
        "Finish your current draft first.",
      );
      const id = `C${state.nextOrder++}`;
      const created = {
        id,
        customer: actor.customer,
        name: actor.customer,
        version: 1,
        status: "draft",
        items: action.items.map((i, index) => ({
          ...normalizeItem(i),
          id: `${id}-${index + 1}`,
          status: "draft",
          step: 0,
        })),
        createdAt: new Date().toISOString(),
      };
      state.orders.push(created);
      return {
        orderId: id,
        message: `Draft ${id} is ready. Review it before sending.`,
      };
    }
    case "add": {
      getOrder();
      assert(
        order.status === "draft",
        "INVALID_STATE",
        "Only a draft can receive another drink.",
      );
      assert(
        Array.isArray(action.items) &&
          action.items.length > 0 &&
          order.items.length + action.items.length <= 8,
        "INVALID_ITEM",
        "A draft can contain up to 8 drinks.",
      );
      const offset = order.items.length;
      order.items.push(
        ...action.items.map((i, index) => ({
          ...normalizeItem(i),
          id: `${order.id}-${offset + index + 1}`,
          status: "draft",
          step: 0,
        })),
      );
      bump();
      return {
        orderId: order.id,
        message: "Added to your draft. Review it before sending.",
      };
    }
    case "confirm": {
      getOrder();
      assert(
        order.status === "draft",
        "INVALID_STATE",
        "This order has already been sent.",
      );
      order.status = "confirmed";
      for (const i of order.items) i.status = "queued";
      bump();
      return {
        orderId: order.id,
        message: `${order.id} is sent to the bar. Ingredients are reserved.`,
      };
    }
    case "change": {
      const item = getItem();
      assert(
        ["draft", "confirmed"].includes(order.status) &&
          !["ready", "cancelled"].includes(item.status),
        "INVALID_STATE",
        "This drink can no longer be changed.",
      );
      const next = normalizeItem({ ...item, ...action.changes });
      if (item.status === "making") {
        item.pendingChange = next;
        bump();
        return {
          orderId: order.id,
          pending: true,
          message:
            "The drink is already in progress. Your barista will review the change.",
        };
      }
      Object.assign(item, next);
      bump();
      return { orderId: order.id, message: `Updated to ${describe(item)}.` };
    }
    case "acceptChange":
    case "rejectChange": {
      assert(staff, "FORBIDDEN", "A barista must review this change.");
      const item = getItem();
      assert(
        item.pendingChange,
        "INVALID_STATE",
        "There is no pending change.",
      );
      if (action.type === "acceptChange") {
        Object.assign(item, item.pendingChange);
        item.step = 0;
      }
      delete item.pendingChange;
      bump();
      return {
        orderId: order.id,
        message:
          action.type === "acceptChange"
            ? "Change accepted. The recipe is updated."
            : "Change declined. The original drink stays on the ticket.",
      };
    }
    case "start": {
      assert(staff, "FORBIDDEN", "Only staff can start a drink.");
      const item = getItem();
      assert(
        item.status === "queued",
        "INVALID_STATE",
        "This drink is not queued.",
      );
      item.status = "making";
      bump();
      return { orderId: order.id, message: `Now making ${describe(item)}.` };
    }
    case "step": {
      assert(staff, "FORBIDDEN", "Only staff can report progress.");
      const item = getItem();
      assert(
        item.status === "making" && !item.pendingChange,
        "INVALID_STATE",
        "Resolve the change request before continuing.",
      );
      assert(
        item.step < recipe(item).steps.length - 1,
        "INVALID_STATE",
        "All recipe steps are complete. Mark the drink ready.",
      );
      item.step++;
      bump();
      return { orderId: order.id, message: recipe(item).current };
    }
    case "ready": {
      assert(staff, "FORBIDDEN", "Only staff can finish a drink.");
      const item = getItem();
      assert(
        item.status === "making" && !item.pendingChange,
        "INVALID_STATE",
        "Start the drink and resolve changes before finishing.",
      );
      for (const [k, v] of Object.entries(requirements(item)))
        state.stock[k] -= v;
      item.status = "ready";
      item.step = recipe(item).steps.length;
      bump();
      if (order.items.every((i) => ["ready", "cancelled"].includes(i.status)))
        order.status = "complete";
      return {
        orderId: order.id,
        message: `${order.id}: your ${describe(item)} is ready.`,
      };
    }
    case "collect": {
      assert(staff, "FORBIDDEN", "Only staff can confirm a handoff.");
      getOrder();
      assert(order.status === "complete", "INVALID_STATE", "Every drink must be ready before this order is collected.");
      order.status = "collected";
      order.collectedAt = new Date().toISOString();
      bump();
      return {orderId: order.id, message: `${order.id} collected. Removed from the active counter.`};
    }
    case "cancel": {
      getOrder();
      assert(
        ["draft", "confirmed"].includes(order.status) &&
          order.items.every((i) => ["draft", "queued"].includes(i.status)),
        "INVALID_STATE",
        "Staff must handle an order already being made.",
      );
      order.status = "cancelled";
      order.items.forEach((i) => (i.status = "cancelled"));
      bump();
      return {
        orderId: order.id,
        message: "Order cancelled. Reserved ingredients are released.",
      };
    }
    case "restock": {
      assert(
        actor.role === "manager",
        "FORBIDDEN",
        "Only the manager can restock.",
      );
      assert(
        Object.hasOwn(STOCK, action.ingredient) &&
          Number.isInteger(action.amount) &&
          action.amount > 0 &&
          action.amount <= 100,
        "INVALID_STOCK",
        "Add 1 to 100 portions.",
      );
      state.stock[action.ingredient] += action.amount;
      return {
        message: `${INGREDIENT_NAMES[action.ingredient]}: added ${action.amount} portions.`,
      };
    }
    default:
      fail("INVALID_COMMAND", "Unknown action.");
  }
}
export function execute(state, command) {
  const { requestId, actor, actions } = command ?? {};
  assert(
    typeof requestId === "string" && /^[a-zA-Z0-9:_-]{1,100}$/.test(requestId),
    "INVALID_COMMAND",
    "A valid request ID is required.",
  );
  assert(
    actor && ["customer", "barista", "manager"].includes(actor.role),
    "FORBIDDEN",
    "A valid role is required.",
  );
  assert(
    Array.isArray(actions) && actions.length > 0 && actions.length <= 12,
    "INVALID_COMMAND",
    "Choose 1 to 12 actions.",
  );
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ actor, actions }))
    .digest("hex");
  const receipt = state.receipts[requestId];
  if (receipt) {
    assert(
      receipt.fingerprint === fingerprint,
      "ID_REUSED",
      "This request ID was used for a different action.",
    );
    return { state, result: { ...receipt.result, duplicate: true } };
  }
  for (const action of actions)
    if (action.expectedVersion !== undefined) {
      const current = state.orders.find((o) => o.id === action.orderId);
      assert(
        current && action.expectedVersion === current.version,
        "STALE_VERSION",
        "The ticket changed. Refresh it and try again.",
      );
    }
  const next = structuredClone(state),
    results = [];
  for (const action of actions) {
    results.push(mutate(next, action, actor));
    validateInventory(next);
  }
  next.revision++;
  const result = {
    ok: true,
    revision: next.revision,
    results,
    message: results.at(-1).message,
    duplicate: false,
  };
  next.events.unshift({
    id: next.revision,
    time: new Date().toISOString(),
    actor: actor.customer ?? actor.role,
    types: actions.map((a) => a.type),
    message: result.message,
  });
  next.events = next.events.slice(0, 100);
  next.receipts[requestId] = { fingerprint, result };
  return { state: next, result };
}
