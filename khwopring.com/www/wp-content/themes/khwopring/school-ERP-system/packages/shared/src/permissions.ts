import type { RoleName } from "./enums";

/**
 * Permission strings follow "resource:action". "manage" implies all actions on that resource.
 * This list spans all planned modules (not just Phase 1) so the seeded RBAC matrix does not
 * need to be re-migrated as later phases add modules.
 */
export const PERMISSIONS = [
  // Identity / RBAC / Settings
  "user:manage",
  "role:manage",
  "school:manage",
  "settings:manage",
  "audit_log:read",

  // Academics
  "academic_session:manage",
  "class:manage",
  "section:manage",
  "subject:manage",
  "timetable:manage",
  "timetable:read",
  "homework:manage",
  "homework:read",
  "lesson_plan:manage",
  "syllabus:manage",
  "syllabus:read",

  // Admissions
  "admission:create",
  "admission:read",
  "admission:update",
  "admission:review",
  "admission:approve",
  "admission:enroll",

  // Students
  "student:create",
  "student:read",
  "student:read_own",
  "student:update",
  "student:promote",
  "student:suspend",
  "student:transfer",
  "student:alumni_convert",
  "student:id_card_manage",
  "student:id_card_read_own",
  "guardian:manage",
  "document:manage",
  "document:read_own",

  // Teachers / Staff / HR
  "teacher:manage",
  "teacher:read",
  "staff:manage",
  "hr_recruitment:manage",
  "hr_recruitment:read",
  "payroll:manage",
  "payroll:read_own",

  // Attendance
  "attendance_student:mark",
  "attendance_student:read",
  "attendance_student:read_own",
  "attendance_staff:mark",
  "attendance_staff:read",
  "attendance_staff:read_own",

  // Exams
  "exam:manage",
  "exam:read",
  "mark:enter",
  "mark:read",
  "mark:read_own",
  "report_card:publish",
  "report_card:read_own",

  // Finance
  "fee:manage",
  "fee:read_own",
  "invoice:manage",
  "payment:collect",
  "payment:read_own",
  "discount:approve",
  "accounting:manage",
  "accounting:read",

  // Library
  "library:manage",
  "library:read",
  "library:read_own",

  // Transport
  "transport:manage",
  "transport:read",
  "transport:read_own",

  // Inventory
  "inventory:manage",
  "inventory:read",

  // Communication
  "communication:manage",
  "communication:read_own",
  "announcement:manage",
  "announcement:read",

  // Reception (enquiries, student requests, PTM)
  "reception:manage",
  "reception:read",

  // Sale / POS
  "pos:manage",
  "pos:read",

  // Hostel
  "hostel:manage",
  "hostel:read",
  "hostel:read_own",

  // Reports
  "report:generate",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: Permission[] = [...PERMISSIONS];

/** Seeded role -> permission matrix. SUPER_ADMIN gets every permission implicitly. */
export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  SUPER_ADMIN: ALL,

  SCHOOL_ADMIN: ALL,

  PRINCIPAL: [
    "academic_session:manage",
    "class:manage",
    "section:manage",
    "subject:manage",
    "timetable:read",
    "homework:read",
    "syllabus:read",
    "admission:read",
    "admission:review",
    "admission:approve",
    "student:read",
    "student:promote",
    "student:suspend",
    "student:transfer",
    "student:alumni_convert",
    "student:id_card_manage",
    "teacher:read",
    "hr_recruitment:read",
    "attendance_student:read",
    "attendance_staff:read",
    "exam:manage",
    "exam:read",
    "mark:read",
    "report_card:publish",
    "fee:read_own",
    "accounting:read",
    "library:read",
    "transport:read",
    "inventory:read",
    "announcement:manage",
    "reception:read",
    "hostel:read",
    "report:generate",
    "audit_log:read",
  ],

  ACCOUNTANT: [
    "student:read",
    "fee:manage",
    "invoice:manage",
    "payment:collect",
    "discount:approve",
    "accounting:manage",
    "payroll:manage",
    "pos:manage",
    "report:generate",
  ],

  TEACHER: [
    "student:read",
    "timetable:read",
    "homework:manage",
    "lesson_plan:manage",
    "syllabus:manage",
    "syllabus:read",
    "attendance_student:mark",
    "attendance_student:read",
    "attendance_staff:read_own",
    "exam:read",
    "mark:enter",
    "mark:read",
    "communication:read_own",
    "announcement:read",
    "payroll:read_own",
  ],

  STUDENT: [
    "student:read_own",
    "student:id_card_read_own",
    "document:read_own",
    "timetable:read",
    "homework:read",
    "syllabus:read",
    "attendance_student:read_own",
    "mark:read_own",
    "report_card:read_own",
    "fee:read_own",
    "payment:read_own",
    "library:read_own",
    "transport:read_own",
    "hostel:read_own",
    "communication:read_own",
    "announcement:read",
  ],

  PARENT: [
    "student:read_own",
    "document:read_own",
    "timetable:read",
    "homework:read",
    "syllabus:read",
    "attendance_student:read_own",
    "mark:read_own",
    "report_card:read_own",
    "fee:read_own",
    "payment:read_own",
    "hostel:read_own",
    "communication:read_own",
    "announcement:read",
  ],

  RECEPTIONIST: [
    "admission:create",
    "admission:read",
    "admission:update",
    "student:read",
    "student:id_card_manage",
    "guardian:manage",
    "document:manage",
    "communication:read_own",
    "announcement:read",
    "reception:manage",
    "report:generate",
  ],

  LIBRARIAN: ["library:manage", "student:read", "teacher:read", "report:generate"],

  TRANSPORT_MANAGER: ["transport:manage", "student:read", "report:generate"],

  HR_MANAGER: [
    "hr_recruitment:manage",
    "teacher:manage",
    "staff:manage",
    "payroll:manage",
    "attendance_staff:mark",
    "attendance_staff:read",
    "hostel:manage",
    "report:generate",
  ],
};
