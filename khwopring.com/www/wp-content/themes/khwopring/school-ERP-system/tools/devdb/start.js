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
  console.log("Initialising embedded Postgres cluster...");
  await pg.initialise();
  console.log("Starting embedded Postgres...");
  await pg.start();
  console.log("Creating school_erp database if needed...");
  try {
    await pg.createDatabase("school_erp");
    console.log("Database school_erp created.");
  } catch (err) {
    console.log("Database school_erp likely already exists, continuing.", err.message);
  }
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
