
const request = require("supertest");
const { app, tasks, activities } = require("./server");

describe("Newtonite Operations API", () => {
 beforeEach(() => {
  tasks.length = 0;
  activities.length = 0;
  idempotencyKeys.clear();
});

  test("rejects unauthenticated task requests", async () => {
    const response = await request(app).get("/api/tasks");

    expect(response.status).toBe(401);
  });

  test("rejects a repeated task-creation request", async () => {
    const key = "test-create-task-001";

    const first = await request(app)
      .post("/api/tasks")
      .set("x-demo-user", "u1")
      .set("Idempotency-Key", key)
      .send({
        title: "Investigate payment issue",
        priority: "High"
      });

    const second = await request(app)
      .post("/api/tasks")
      .set("x-demo-user", "u1")
      .set("Idempotency-Key", key)
      .send({
        title: "Investigate payment issue",
        priority: "High"
      });

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(tasks).toHaveLength(1);
  });

  test("rejects an update based on a stale version", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .set("x-demo-user", "u1")
      .set("Idempotency-Key", "test-stale-task-001")
      .send({ title: "Investigate incident" });

    expect(created.status).toBe(201);

    const task = created.body.item;

    const updated = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set("x-demo-user", "u1")
      .set("If-Match", "1")
      .send({ priority: "High" });

    expect(updated.status).toBe(200);
    expect(updated.body.item.version).toBe(2);

    const stale = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set("x-demo-user", "u1")
      .set("If-Match", "1")
      .send({ priority: "Low" });

    expect(stale.status).toBe(412);
    expect(tasks[0].priority).toBe("High");
  });
});
