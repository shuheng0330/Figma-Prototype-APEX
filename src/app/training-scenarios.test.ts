import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";

const mem = new Map<string, string>();
const evl: Record<string, Function[]> = {};
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
  (globalThis as any).addEventListener = (t: string, fn: Function) => void ((evl[t] ??= []).push(fn));
  (globalThis as any).dispatchEvent = (e: any) => { (evl[e.type] ?? []).forEach(f => f(e)); return true; };
  (globalThis as any).Event = class { type: string; constructor(t: string) { this.type = t; } } as any;
});

const EMP = "E001", TRN = "E003";

describe("Scenario 1 - clean test", () => {
  it("one reset restores training and course data", async () => {
    const s = await import("./trainingStore");
    const cs = await import("./courseStore");
    s.register("EV02", EMP);
    cs.updateModuleStatus("m13", "rejected");
    (globalThis as any).dispatchEvent(new (globalThis as any).Event("performanceDemoReset"));
    expect(s.myReg("EV02", EMP)).toBeUndefined();
    expect(cs.moduleStatus.m13).toBe("approved");
  });

  it("the only seeded attendance for the employee is EV00", async () => {
    const s = await import("./trainingStore");
    expect(s.completedSessionsFor(EMP).map(d => d.session.id)).toEqual(["EV00"]);
  });
});

describe("Scenario 2 - publish training material", () => {
  it("the SOP, its modules, content and quizzes are all reachable", async () => {
    const cs = await import("./courseStore");
    expect(cs.SOPS.some(x => x.id === "s4")).toBe(true);
    const mods = cs.ALL_MODULES.filter(m => m.sopId === "s4");
    expect(mods).toHaveLength(4);
    for (const m of mods) {
      expect(cs.MODULE_BLOCKS[m.id].length).toBeGreaterThan(0);
      expect(cs.ALL_QUIZZES.find(q => q.id === cs.MODULE_QUIZ[m.id])!.questions).toHaveLength(5);
    }
  });

  it("an approved module can be rejected and approved again", async () => {
    const cs = await import("./courseStore");
    expect(cs.moduleStatus.m13).toBe("approved");
    cs.updateModuleStatus("m13", "rejected");
    expect(cs.moduleStatus.m13).toBe("rejected");
    cs.updateModuleStatus("m13", "approved");
    expect(cs.moduleStatus.m13).toBe("approved");
  });

  it("the Reject control is no longer hidden once approved", () => {
    const src = fs.readFileSync("src/app/components/MaterialReview.tsx", "utf8");
    expect(src).toMatch(/An approved module can still be rejected/);
    expect(src).toMatch(/\{!locked && \(/);
  });

  it("Review Quizzes lists the store catalogue and offers a course picker", () => {
    const src = fs.readFileSync("src/app/components/QuizReview.tsx", "utf8");
    expect(src).toMatch(/const MOCK_QUIZZES: Quiz\[\] = STORE_QUIZZES\.map/);
    expect(src).toMatch(/const DEFAULT_SOP = "s4";/);
    // The list is scoped to the chosen course, not every quiz in the system.
    expect(src).toMatch(/const sopQuizzes = MOCK_QUIZZES\.filter\(q => q\.sopId === selectedSop\)/);
    expect(src).not.toMatch(/Installation-Manual\.pdf/);
  });

  it("the trainer owns this material but not other material", async () => {
    const s = await import("./trainingStore");
    expect(s.sopOwner("s4")).toBe(TRN);
    expect(s.sopOwner("s3")).not.toBe(TRN);
  });
});

describe("Scenario 3 - assign training", () => {
  it("the trainer can assign the course they own, and it reaches the learner", async () => {
    const s = await import("./trainingStore");
    expect(s.coursesOwnedBy(TRN).some(c => c.id === "m3")).toBe(true);
    s.assignCourse("m3", {
      mode: "immediate", deadline: "2026-12-31", daysWithin: 7,
      mandatory: true, audience: "All staff", assignedBy: TRN,
    });
    expect(s.immediateAssignments().some(c => c.id === "m3")).toBe(true);
  });
});

describe("Scenario 4 - complete the course", () => {
  it("all four modules are open to the learner and roll up to 100 percent", async () => {
    const s = await import("./trainingStore");
    const cs = await import("./courseStore");
    const mods = cs.ALL_MODULES.filter(m => m.sopId === "s4");
    expect(mods.every(m => cs.moduleStatus[m.id] === "approved")).toBe(true);
    mods.forEach(m => s.recordModuleCompletion(EMP, m.id, 5, 5));
    s.syncCourseProgress("m3", mods.length, mods.length);
    expect(s.COURSES.find(c => c.id === "m3")!.progress).toBe(100);
  });
});

describe("Scenario 5 - schedule and register", () => {
  it("a created session is registrable", async () => {
    const s = await import("./trainingStore");
    s.addSession({
      id: "EVS5", title: "Scenario 5 Session", date: "2026-12-10", time: "09:00 - 11:00",
      venue: "Room S5", trainerId: TRN, kind: "Physical", topic: "Sales",
      kpi: "Skill-Based Training", capacity: 2, mandatory: false,
      registrationOpen: true, description: "demo",
    });
    expect(s.sessionById("EVS5")).toBeTruthy();
    expect(s.register("EVS5", EMP)).toBe("registered");
    expect(s.seatCount("EVS5")).toBe(1);
  });

  it("EV06 is seeded full so registering waitlists", async () => {
    const s = await import("./trainingStore");
    expect(s.isFull(s.sessionById("EV06")!)).toBe(true);
    expect(s.register("EV06", EMP)).toBe("waitlisted");
  });
});

describe("Scenario 6 - attendance", () => {
  it("only recorded attendance turns a registration into a completed record", async () => {
    const s = await import("./trainingStore");
    expect(s.completedSessionsFor(EMP).some(x => x.session.id === "EVS5")).toBe(false);
    expect(s.pendingSessionsFor(EMP).some(x => x.session.id === "EVS5")).toBe(true);
    s.setAttendance("EVS5", EMP, true, "manual", TRN, 85);
    expect(s.completedSessionsFor(EMP).some(x => x.session.id === "EVS5")).toBe(true);
  });
});

describe("Scenario 7 - sharing sessions", () => {
  it("sharing sessions exist company-wide and register like any session", async () => {
    const s = await import("./trainingStore");
    const sharing = s.SESSIONS.filter(x => x.kind === "Sharing Session");
    expect(sharing.some(x => x.id === "EV03")).toBe(true);
    expect(["registered", "waitlisted"]).toContain(s.register("EV03", EMP));
    expect(s.sharingLeaderboard().length).toBeGreaterThan(0);
  });
});

describe("Scenario 8 - learning paths and development plans", () => {
  it("a template assigns to a department and a goal is recorded", async () => {
    const s = await import("./trainingStore");
    const t = s.PATH_TEMPLATES[0];
    s.assignTemplateToDept(t.id, "Sales");
    expect(s.PATH_TEMPLATES.find(x => x.id === t.id)!.assignedTo).toContain("Sales");
    s.setIdpPath(EMP, t.id);
    s.addGoal(EMP, { id: "g-s8", title: "Scenario 8 goal", state: "In Progress" } as any);
    s.updateGoal(EMP, "g-s8", { title: "Scenario 8 goal edited" } as any);
    const idp = s.IDPS.find(i => i.staffId === EMP)!;
    expect(idp.pathTemplateId).toBe(t.id);
    expect(idp.goals.find(g => g.id === "g-s8")!.title).toBe("Scenario 8 goal edited");
  });

  it("the employee sees development plans read-only, the manager does not", async () => {
    const { canEdit } = await import("./access");
    expect(canEdit("staff", "idp")).toBe(false);
    expect(canEdit("manager", "idp")).toBe(true);
  });
});

describe("Scenario 9 - training KPI and reporting", () => {
  it("the KPI counts both the attended session and the completed course", async () => {
    const s = await import("./trainingStore");
    const kpi = s.kpiFor(EMP);
    expect(kpi.skill.done + kpi.product.done).toBeGreaterThan(0);
    expect(kpi.score).toBeGreaterThan(0);
  });

  it("Trainer Effectiveness reports the session whose attendance was just recorded", async () => {
    const s = await import("./trainingStore");
    // EVS5 was created and attended in Scenarios 5 and 6.
    const rows = s.trainerResults(TRN);
    const mine = rows.find(r => r.sessionId === "EVS5");
    expect(mine, "the recorded session must appear in the trainer history").toBeTruthy();
    expect(mine!.headcount).toBe(1);
    expect(mine!.avgQuizScore).toBe(85);

    // And it must move the headline figures, not just the list.
    const stats = s.trainerStats(TRN);
    const seeded = s.PAST_RESULTS.filter(r => r.trainerId === TRN);
    expect(stats.sessions).toBe(seeded.length + 1);
    expect(stats.headcount).toBe(seeded.reduce((a, r) => a + r.headcount, 0) + 1);
  });

  it("a session with no attendance recorded is not counted", async () => {
    const s = await import("./trainingStore");
    s.addSession({
      id: "EVNONE", title: "Nobody attended", date: "2026-12-20", time: "09:00 - 10:00",
      venue: "Room Z", trainerId: TRN, kind: "Physical", topic: "Sales",
      kpi: "Skill-Based Training", capacity: 5, mandatory: false,
      registrationOpen: true, description: "demo",
    });
    s.register("EVNONE", EMP);
    expect(s.trainerResults(TRN).some(r => r.sessionId === "EVNONE")).toBe(false);
  });
});

describe("Scenario 10 - administration and access", () => {
  it("trainer permission, categories and access all behave", async () => {
    const s = await import("./trainingStore");
    const { can } = await import("./access");
    const { pathIsAllowed } = await import("./auth");

    s.grantTrainer("E002", true);
    expect(s.staffById("E002")!.isTrainer).toBe(true);
    s.grantTrainer("E002", false);
    expect(s.staffById("E002")!.isTrainer).toBe(false);

    const cid = s.addCategory("S10 Cat", "#111", "#eee", "X");
    s.updateCategory(cid, { name: "S10 Renamed" });
    expect(s.categoryById(cid).name).toBe("S10 Renamed");
    s.retireCategory(cid);
    expect(s.CATEGORIES.some(c => c.id === cid)).toBe(false);

    expect(can("admin", "access")).toBe(true);
    expect(pathIsAllowed("employee", "/upload")).toBe(false);
    expect(pathIsAllowed("super_admin", "/upload")).toBe(true);
  });
});
