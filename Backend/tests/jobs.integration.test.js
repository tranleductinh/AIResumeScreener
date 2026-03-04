import request from "supertest";
import { describe, expect, it } from "vitest";

import { app, createAuthSession, setupTestDatabase } from "./helpers/test-utils.js";

setupTestDatabase();

describe("Jobs API", () => {
  it("creates and lists jobs for an authenticated recruiter", async () => {
    const { accessToken } = await createAuthSession();

    const createResponse = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Frontend Engineer",
        jdText: "Build React and TypeScript UI for recruiting workflows.",
        department: "Engineering",
        seniorityLevel: "mid",
        status: "open",
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data.title).toBe("Frontend Engineer");

    const listResponse = await request(app)
      .get("/api/jobs?page=1&limit=10")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data.items).toHaveLength(1);
    expect(listResponse.body.meta.pagination.total).toBe(1);
  });
});
