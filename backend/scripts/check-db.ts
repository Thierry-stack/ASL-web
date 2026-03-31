import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  console.log("Database connection OK");
}

main()
  .catch((e) => {
    console.error("Database connection failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
