import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./lib/env";
import { registerHealthRoute } from "./routes/health";

/**
 * Server bootstrap only. No B402/payment routes yet — those are added in Session 2 per
 * BUILD_ROADMAP.md. Keeping this file thin on purpose so later sessions add routes/plugins
 * without re-touching this bootstrap logic.
 */
async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  registerHealthRoute(app);

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    reply.status(error.statusCode ?? 500).send({
      error: {
        message: error.message ?? "Internal server error",
        code: error.code ?? "INTERNAL_ERROR"
      }
    });
  });

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
