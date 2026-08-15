/**
 * Integration tests hit a real Postgres database via Prisma. They are skipped
 * automatically unless RUN_INTEGRATION=1 is set, since this sandbox has no
 * reachable Postgres instance. To run for real:
 *   docker compose up -d
 *   npm run db:migrate --workspace=apps/api
 *   RUN_INTEGRATION=1 npm test --workspace=apps/api
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import argon2 from "argon2";
import { createApp } from "../../src/app";
import { prisma } from "../../src/lib/prisma";

const runIntegration = process.env.RUN_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration("Auth + Admissions integration", () => {
  const app = createApp();
  let schoolId: string;
  let sessionId: string;
  let classId: string;
  let sectionId: string;
  const adminEmail = `test-admin-${Date.now()}@example.com`;
  const adminPassword = "Test@12345";

  const schoolCode = `IT${Date.now() % 100000}`;

  beforeAll(async () => {
    const school = await prisma.school.create({
      data: { name: "Integration Test School", code: schoolCode },
    });
    schoolId = school.id;

    const session = await prisma.academicSession.create({
      data: { schoolId, name: "IT-2026", startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31"), isCurrent: true },
    });
    sessionId = session.id;

    const klass = await prisma.class.create({ data: { schoolId, academicSessionId: sessionId, name: "IT Grade 1" } });
    classId = klass.id;
    const section = await prisma.section.create({ data: { schoolId, classId, name: "A" } });
    sectionId = section.id;

    const [permission] = await Promise.all(
      ["admission:create", "admission:read", "admission:update", "admission:review", "admission:approve", "admission:enroll"].map(
        (key) => prisma.permission.upsert({ where: { key }, update: {}, create: { key } })
      )
    );
    const role = await prisma.role.create({ data: { schoolId, name: "IT_ADMIN", isSystem: false } });
    const allPerms = await prisma.permission.findMany({
      where: { key: { in: ["admission:create", "admission:read", "admission:update", "admission:review", "admission:approve", "admission:enroll"] } },
    });
    await prisma.rolePermission.createMany({ data: allPerms.map((p) => ({ roleId: role.id, permissionId: p.id })) });

    const passwordHash = await argon2.hash(adminPassword);
    const user = await prisma.user.create({
      data: { schoolId, email: adminEmail, passwordHash, fullName: "Integration Admin" },
    });
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    void permission;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { schoolId } });
    await prisma.studentGuardian.deleteMany({ where: { student: { schoolId } } });
    await prisma.student.deleteMany({ where: { schoolId } });
    await prisma.guardian.deleteMany({ where: { schoolId } });
    await prisma.admissionGuardian.deleteMany({ where: { admissionApplication: { schoolId } } });
    await prisma.admissionApplication.deleteMany({ where: { schoolId } });
    await prisma.userRole.deleteMany({ where: { user: { schoolId } } });
    await prisma.rolePermission.deleteMany({ where: { role: { schoolId } } });
    await prisma.user.deleteMany({ where: { schoolId } });
    await prisma.role.deleteMany({ where: { schoolId } });
    await prisma.section.deleteMany({ where: { schoolId } });
    await prisma.class.deleteMany({ where: { schoolId } });
    await prisma.academicSession.deleteMany({ where: { schoolId } });
    await prisma.school.delete({ where: { id: schoolId } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  it("logs in and drives an admission Draft -> Enrolled", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({ email: adminEmail, password: adminPassword });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.accessToken as string;

    const createRes = await request(app)
      .post("/api/admissions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        studentFirstName: "Ada",
        studentLastName: "Lovelace",
        dateOfBirth: "2016-05-01",
        gender: "FEMALE",
        address: "1 Analytical Engine Way",
        classAppliedForId: classId,
        academicSessionId: sessionId,
        guardians: [{ fullName: "Lord Byron", relation: "FATHER", phone: "+11234567890", isPrimary: true }],
      });
    expect(createRes.status).toBe(201);
    const applicationId = createRes.body.application.id;

    await request(app).post(`/api/admissions/${applicationId}/submit`).set("Authorization", `Bearer ${token}`).expect(200);
    await request(app).post(`/api/admissions/${applicationId}/review`).set("Authorization", `Bearer ${token}`).send({}).expect(200);
    await request(app)
      .post(`/api/admissions/${applicationId}/decide`)
      .set("Authorization", `Bearer ${token}`)
      .send({ decision: "APPROVED" })
      .expect(200);

    const enrollRes = await request(app)
      .post(`/api/admissions/${applicationId}/enroll`)
      .set("Authorization", `Bearer ${token}`)
      .send({ sectionId })
      .expect(201);

    expect(enrollRes.body.student.registrationNumber).toMatch(new RegExp(`^${schoolCode}-\\d{4}-\\d{5}$`));
  });
});
