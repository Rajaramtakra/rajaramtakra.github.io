import { prisma } from "../../lib/prisma";

async function nextSequence(schoolId: string, counterKey: "application" | "registration"): Promise<number> {
  const year = new Date().getFullYear();
  const count =
    counterKey === "application"
      ? await prisma.admissionApplication.count({ where: { schoolId, createdAt: { gte: new Date(`${year}-01-01`) } } })
      : await prisma.student.count({ where: { schoolId, createdAt: { gte: new Date(`${year}-01-01`) } } });
  return count + 1;
}

export async function generateApplicationNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const seq = (await nextSequence(schoolId, "application")) + attempt;
    const candidate = `ADM-${year}-${String(seq).padStart(5, "0")}`;
    const exists = await prisma.admissionApplication.findUnique({ where: { applicationNumber: candidate } });
    if (!exists) return candidate;
  }
  throw new Error("Failed to generate a unique application number");
}

export async function generateRegistrationNumber(schoolId: string, schoolCode: string): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const seq = (await nextSequence(schoolId, "registration")) + attempt;
    const candidate = `${schoolCode}-${year}-${String(seq).padStart(5, "0")}`;
    const exists = await prisma.student.findUnique({ where: { registrationNumber: candidate } });
    if (!exists) return candidate;
  }
  throw new Error("Failed to generate a unique registration number");
}
