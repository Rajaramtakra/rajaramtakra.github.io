import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { PERMISSIONS, ROLE_PERMISSIONS, ROLE_NAMES } from "@erp/shared";

const prisma = new PrismaClient();

async function main() {
  const schoolName = process.env.SEED_SCHOOL_NAME ?? "Khwopring International School";
  const schoolCode = process.env.SEED_SCHOOL_CODE ?? "KIS";
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@khwopring.edu";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";

  console.log("Seeding permissions...");
  await Promise.all(
    PERMISSIONS.map((key) =>
      prisma.permission.upsert({ where: { key }, update: {}, create: { key } })
    )
  );
  const allPermissions = await prisma.permission.findMany();
  const permissionByKey = new Map(allPermissions.map((p) => [p.key, p.id]));

  console.log("Seeding school...");
  const school = await prisma.school.upsert({
    where: { code: schoolCode },
    update: {},
    create: {
      name: schoolName,
      code: schoolCode,
      address: "123 Education Lane, Kathmandu",
      phone: "+977-1-4000000",
      email: "info@khwopring.edu",
    },
  });

  console.log("Seeding system roles + permission matrix...");
  for (const roleName of ROLE_NAMES) {
    const role = await prisma.role.upsert({
      where: { schoolId_name: { schoolId: school.id, name: roleName } },
      update: {},
      create: { schoolId: school.id, name: roleName, isSystem: true, description: `System role: ${roleName}` },
    });

    const permissionKeys = ROLE_PERMISSIONS[roleName];
    for (const key of permissionKeys) {
      const permissionId = permissionByKey.get(key);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  console.log("Seeding admin user...");
  const passwordHash = await argon2.hash(adminPassword);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      schoolId: school.id,
      email: adminEmail,
      passwordHash,
      fullName: "System Administrator",
      phone: "+977-9800000000",
      isActive: true,
    },
  });

  const superAdminRole = await prisma.role.findFirstOrThrow({
    where: { schoolId: school.id, name: "SUPER_ADMIN" },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: superAdminRole.id },
  });

  console.log("Seeding baseline academic structure...");
  const session = await prisma.academicSession.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "2026-2027" } },
    update: {},
    create: {
      schoolId: school.id,
      name: "2026-2027",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2027-03-31"),
      isCurrent: true,
    },
  });

  const gradeNames = ["Grade 1", "Grade 2", "Grade 3"];
  for (const [index, name] of gradeNames.entries()) {
    const klass = await prisma.class.upsert({
      where: { academicSessionId_name: { academicSessionId: session.id, name } },
      update: {},
      create: { schoolId: school.id, academicSessionId: session.id, name, order: index },
    });
    await prisma.section.upsert({
      where: { classId_name: { classId: klass.id, name: "A" } },
      update: {},
      create: { schoolId: school.id, classId: klass.id, name: "A", capacity: 40 },
    });
  }

  console.log("\nSeed complete.");
  console.log(`  School:        ${school.name} (${school.code})`);
  console.log(`  Admin login:   ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
