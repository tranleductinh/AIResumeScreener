import request from "supertest";
import { describe, expect, it } from "vitest";

import {
  app,
  createAuthSession,
  createDemoScreeningGraph,
  setupTestDatabase,
  waitForScreeningCompletion,
} from "./helpers/test-utils.js";
import ScreeningResult from "../src/models/screening-result.model.js";

setupTestDatabase();

describe("Screening API", () => {
  it("creates a screening run and generates at least one screening result", async () => {
    const { user, accessToken } = await createAuthSession();
    const { job, candidate, resumeFile } = await createDemoScreeningGraph({
      recruiterId: user._id,
    });

    const createResponse = await request(app)
      .post("/api/screening-runs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        jobId: job._id.toString(),
        candidateIds: [candidate._id.toString()],
        resumeFileIds: [resumeFile._id.toString()],
        aiProvider: "rule_based",
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.status).toBe("queued");

    const runId = createResponse.body.data._id;
    const { run, results } = await waitForScreeningCompletion(runId);

    expect(run.status).toBe("completed");
    expect(results.length).toBeGreaterThan(0);

    const resultResponse = await request(app)
      .get(`/api/screening-runs/${runId}/results`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(resultResponse.status).toBe(200);
    expect(resultResponse.body.data.items.length).toBeGreaterThan(0);
  });

  it("deletes a completed screening run and cascades its screening results", async () => {
    const { user, accessToken } = await createAuthSession();
    const { job, candidate, resumeFile } = await createDemoScreeningGraph({
      recruiterId: user._id,
    });

    const createResponse = await request(app)
      .post("/api/screening-runs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        jobId: job._id.toString(),
        candidateIds: [candidate._id.toString()],
        resumeFileIds: [resumeFile._id.toString()],
        aiProvider: "rule_based",
      });

    const runId = createResponse.body.data._id;
    await waitForScreeningCompletion(runId);

    const deleteResponse = await request(app)
      .delete(`/api/screening-runs/${runId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.deletedResultsCount).toBeGreaterThan(0);

    const remainingResults = await ScreeningResult.countDocuments({
      screeningRunId: runId,
    });
    expect(remainingResults).toBe(0);
  });
});
