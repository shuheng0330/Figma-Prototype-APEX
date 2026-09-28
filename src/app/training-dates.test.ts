import { describe, it, expect, beforeAll } from "vitest";

const mem = new Map<string, string>();
beforeAll(() => {
  (globalThis as any).window = globalThis;
  (globalThis as any).localStorage = {
    getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: new Proxy((globalThis as any).localStorage, {
      ownKeys: () => Array.from(mem.keys()),
      getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
    }),
    configurable: true,
  });
  (globalThis as any).addEventListener = () => {};
});

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const TODAY = iso(new Date());

describe("demo dates never go stale", () => {
  it("the assigned course is still ahead of its deadline", async () => {
    const s = await import("./trainingStore");
    const c = s.COURSES.find(x => x.id === "m3")!;
    expect(c.title).toBe("E-Hailing Delivery & Customer Pickup");
    expect(c.deadline! > TODAY, "deadline must be in the future").toBe(true);
    // Roughly a fortnight of runway, so the card never opens as urgent-red.
    expect(s.daysUntil(c.deadline!), "days remaining shown on the card").toBeGreaterThan(7);
    const a = c.assignment!;
    // The card prints assigned date, days-to-complete and due date together,
    // so those three must agree.
    expect(s.daysUntil(a.deadline) - s.daysUntil(a.assignedOn), "days to complete").toBe(a.daysWithin);
    expect(c.assignment!.assignedOn <= TODAY, "assigned in the past").toBe(true);
  });

  it("no mandatory course is overdue at the start of a test drive", async () => {
    const s = await import("./trainingStore");
    const overdue = s.COURSES.filter(c => c.mandatory && c.deadline && c.deadline < TODAY);
    expect(overdue.map(c => c.title)).toEqual([]);
  });

  it("the sessions the guide names are still open for registration", async () => {
    const s = await import("./trainingStore");
    for (const id of ["EV01", "EV02", "EV06"]) {
      const sess = s.sessionById(id)!;
      expect(sess, `${id} exists`).toBeTruthy();
      expect(s.daysUntil(sess.date), `${id} must be upcoming`).toBeGreaterThanOrEqual(0);
    }
  });

  it("enough sessions sit in the next two months to fill the calendar", async () => {
    const s = await import("./trainingStore");
    const upcoming = s.SESSIONS.filter(x => s.daysUntil(x.date) >= 0);
    expect(upcoming.length).toBeGreaterThanOrEqual(8);
  });

  it("the historical session stays in the past so the record is not empty", async () => {
    const s = await import("./trainingStore");
    expect(s.daysUntil(s.sessionById("EV00")!.date)).toBeLessThan(0);
    expect(s.completedSessionsFor("E001").map(x => x.session.id)).toEqual(["EV00"]);
  });

  it("trainer history stays in the past", async () => {
    const s = await import("./trainingStore");
    expect(s.PAST_RESULTS.every(r => r.date < TODAY)).toBe(true);
  });
});
