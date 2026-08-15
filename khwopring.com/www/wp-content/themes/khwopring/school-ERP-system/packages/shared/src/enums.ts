export const ROLE_NAMES = [
  "SUPER_ADMIN",
  "SCHOOL_ADMIN",
  "PRINCIPAL",
  "ACCOUNTANT",
  "TEACHER",
  "STUDENT",
  "PARENT",
  "RECEPTIONIST",
  "LIBRARIAN",
  "TRANSPORT_MANAGER",
  "HR_MANAGER",
] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

export const ADMISSION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "REVIEW",
  "APPROVED",
  "REJECTED",
  "ENROLLED",
] as const;
export type AdmissionStatus = (typeof ADMISSION_STATUSES)[number];

export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export type Gender = (typeof GENDERS)[number];

export const STUDENT_STATUSES = [
  "ACTIVE",
  "SUSPENDED",
  "RUSTICATED",
  "TRANSFERRED",
  "ALUMNI",
  "EXPELLED",
] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const ENQUIRY_STATUSES = ["NEW", "FOLLOW_UP", "CONVERTED", "CLOSED"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const STUDENT_REQUEST_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
export type StudentRequestStatus = (typeof STUDENT_REQUEST_STATUSES)[number];

export const GUARDIAN_RELATIONS = [
  "FATHER",
  "MOTHER",
  "GUARDIAN",
  "GRANDFATHER",
  "GRANDMOTHER",
  "OTHER",
] as const;
export type GuardianRelation = (typeof GUARDIAN_RELATIONS)[number];

export const DOCUMENT_CATEGORIES = [
  "BIRTH_CERTIFICATE",
  "PREVIOUS_MARKSHEET",
  "TRANSFER_CERTIFICATE",
  "PHOTO",
  "ID_PROOF",
  "ADDRESS_PROOF",
  "MEDICAL_RECORD",
  "OTHER",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const EMPLOYMENT_STATUSES = ["ACTIVE", "ON_LEAVE", "TERMINATED", "RESIGNED", "RETIRED"] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "EXCUSED"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDANCE_METHODS = ["MANUAL", "QR", "RFID", "BIOMETRIC"] as const;
export type AttendanceMethod = (typeof ATTENDANCE_METHODS)[number];

export const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const FEE_FREQUENCIES = ["ONE_TIME", "MONTHLY", "QUARTERLY", "ANNUAL"] as const;
export type FeeFrequency = (typeof FEE_FREQUENCIES)[number];

export const DISCOUNT_TYPES = ["PERCENT", "FIXED"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const FINE_STATUSES = ["PENDING", "PAID", "WAIVED"] as const;
export type FineStatus = (typeof FINE_STATUSES)[number];

export const INVOICE_STATUSES = ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_METHODS = ["CASH", "CARD", "BANK_TRANSFER", "CHEQUE", "ONLINE"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const PAYROLL_STATUSES = ["DRAFT", "PROCESSED", "PAID"] as const;
export type PayrollStatus = (typeof PAYROLL_STATUSES)[number];
