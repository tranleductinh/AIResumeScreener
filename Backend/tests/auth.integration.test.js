import request from "supertest";
import { describe, expect, it } from "vitest";

import { app, setupTestDatabase } from "./helpers/test-utils.js";

setupTestDatabase();

describe("Auth API", () => {
  it("rejects google login when idToken is missing", async () => {
    const response = await request(app).post("/api/auth/google").send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("rejects refresh token when cookie is missing", async () => {
    const response = await request(app).get("/api/auth/refresh-token");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
