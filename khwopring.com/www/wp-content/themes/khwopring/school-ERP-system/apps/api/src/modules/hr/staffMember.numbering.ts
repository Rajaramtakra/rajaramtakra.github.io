import { prisma } from "../../lib/prisma";

/** Generates a unique employeeCode for a new StaffMember, e.g. STF-2026-00001. */
export async function generateStaffEmployeeCode(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.staffMember.count({ where: { schoolId, createdAt: { gte: new Date(`${year}-01-01`) } } });
    const candidate = `STF-${year}-${String(count + 1 + attempt).padStart(5, "0")}`;
    const exists = await prisma.staffMember.findUnique({ where: { employeeCode: candidate } });
    if (!exists) return candidate;
  }
  throw new Error("Failed to generate a unique employee code");
}
