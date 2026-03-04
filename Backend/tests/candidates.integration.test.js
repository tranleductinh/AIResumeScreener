import request from "supertest";
import { describe, expect, it } from "vitest";

import { app, createAuthSession, setupTestDatabase } from "./helpers/test-utils.js";

setupTestDatabase();

describe("Candidates API", () => {
  it("creates and updates a manual candidate profile", async () => {
    const { accessToken } = await createAuthSession();

    const createResponse = await request(app)
      .post("/api/candidates")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        fullName: "Candidate One",
        email: "candidate.one@demo.local",
        currentTitle: "Frontend Developer",
        totalYearsExperience: 3,
        skillsHard: ["React", "TypeScript"],
        skillsSoft: ["Communication"],
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.fullName).toBe("Candidate One");

    const candidateId = createResponse.body.data._id;

    const updateResponse = await request(app)
      .patch(`/api/candidates/${candidateId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        currentCompany: "Demo Product",
        totalYearsExperience: 4,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.currentCompany).toBe("Demo Product");
    expect(updateResponse.body.data.totalYearsExperience).toBe(4);
  });
});
