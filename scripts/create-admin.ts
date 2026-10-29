import { rawPrisma } from "../src/server/db/client";
import { hashPassword } from "../src/server/auth/password";

async function main() {
  const email = "admin@gmail12.com";
  const name = "Main Administrator";

  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error("ADMIN_PASSWORD environment variable is required.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const passwordHash = await hashPassword(password);

  const admin = await rawPrisma.platformAdmin.upsert({
    where: {
      email,
    },
    update: {
      name,
      passwordHash,
      isActive: true,
    },
    create: {
      name,
      email,
      passwordHash,
      isActive: true,
    },
  });

  console.log("Platform admin created/updated successfully.");
  console.log("ID:", admin.id);
  console.log("Email:", admin.email);
  console.log("Active:", admin.isActive);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await rawPrisma.$disconnect();
  });