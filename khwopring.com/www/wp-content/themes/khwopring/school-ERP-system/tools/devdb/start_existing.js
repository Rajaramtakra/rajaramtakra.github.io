const EmbeddedPostgres = require("embedded-postgres").default;
const path = require("node:path");

const pg = new EmbeddedPostgres({
  databaseDir: path.join(__dirname, "data"),
  user: "erp_user",
  password: "erp_password",
  port: 5432,
  persistent: true,
});

async function main() {
  console.log("Starting embedded Postgres (existing cluster)...");
  await pg.start();
  console.log("READY: embedded postgres listening on port 5432");
}

main().catch((err) => {
  console.error("Failed to start embedded postgres", err);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await pg.stop();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await pg.stop();
  process.exit(0);
});
