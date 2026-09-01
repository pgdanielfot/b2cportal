import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_FOT_EMAIL || "admin@propertyguru.com.my";
  const password = process.env.SEED_FOT_PASSWORD || "changeme123";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.fotUser.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name: "FOT Admin" },
  });

  console.log(`Seeded FOT user: ${user.email} (password: ${password})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
