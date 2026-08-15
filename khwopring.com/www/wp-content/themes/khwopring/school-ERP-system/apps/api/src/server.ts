import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`School ERP API listening on http://localhost:${env.PORT}`);
  logger.info(`API docs available at http://localhost:${env.PORT}/api/docs`);
});
