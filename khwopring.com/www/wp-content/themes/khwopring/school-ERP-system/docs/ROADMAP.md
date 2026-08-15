# Roadmap

This system is being built in phases so that each phase ships fully working,
tested code rather than a large surface of stubs. The complete data model
(`apps/api/prisma/schema.prisma`) is already in place for every phase below —
later phases add business logic, routes, and UI on top of tables that already
exist.

## Phase 1 — Foundation (done)

- Monorepo scaffold, tooling, Docker Compose Postgres
- Full Prisma schema across every module
- Auth (JWT + rotating refresh tokens), RBAC (11 roles, full permission matrix)
- Academic Setup: sessions, classes, sections, subjects, subject assignment
- Admissions: Draft → Submitted → Review → Approved/Rejected → Enrolled,
  document upload, registration-number generation
- Student Management: profile, guardians, emergency contacts, search,
  promotion, suspension/reinstatement, transfer certificate, alumni conversion
- Role-aware dashboards backed by real queries (no fabricated widgets)
- Audit logging, pagination, soft deletes, Swagger API docs, unit + integration tests

## Phase 2 — Academics & People

- Timetable management
- Homework & lesson planning
- Attendance: student/teacher/staff, manual entry with QR/RFID/biometric-ready
  method field already in the schema
- Teacher management + teacher portal (attendance entry, marks entry, homework upload)
- Parent portal with multi-child support

## Phase 3 — Finance

- Fees: categories, structures, discounts, scholarships, fines, installments
- Accounting: chart of accounts, ledger, journal entries, cash book, bank accounts
- Billing & PDF generation: receipts, invoices, ID cards, certificates,
  transfer certificates, report cards, with QR verification
- Payroll: salary structures, allowances/deductions, payroll runs, payslips

## Phase 4 — Exams & Reporting

- Exam creation/scheduling, marks entry, grade/GPA calculation, report card publication
- Ranking and progress reports
- Cross-module Reports & Analytics with PDF/Excel/CSV export

## Phase 5 — Operations

- HR & Recruitment: job postings, candidates, interviews, offer letters, employee conversion
- Library: catalog, issue/return, reservations, fines
- Transport: vehicles, drivers, routes, pickup points, fees
- Inventory: assets, stock, purchase orders, vendors
- Communication: internal messaging, email/SMS notifications, announcements
- Settings module, dark mode polish, remaining audit/activity-log surfacing
