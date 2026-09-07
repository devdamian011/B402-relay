import type { FastifyInstance } from "fastify";
import type { HealthCheckResponse } from "@b402-relay/types";

export function registerHealthRoute(app: FastifyInstance) {
  app.get("/health", async (): Promise<HealthCheckResponse> => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "b402-relay-api"
    };
  });
}
