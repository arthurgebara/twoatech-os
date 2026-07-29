import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";

const requiredEnvironmentVariables = [
  "DATABASE_URL",
  "ADMIN_NAME",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
] as const;

for (const variable of requiredEnvironmentVariables) {
  if (!process.env[variable]) {
    throw new Error(`Defina ${variable} antes de executar o seed.`);
  }
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL!.trim().toLowerCase();
  const passwordHash = await hash(process.env.ADMIN_PASSWORD!, 12);

  await prisma.user.upsert({
    where: { email },
    create: {
      name: process.env.ADMIN_NAME!.trim(),
      email,
      passwordHash,
    },
    update: {
      name: process.env.ADMIN_NAME!.trim(),
      passwordHash,
      isActive: true,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
