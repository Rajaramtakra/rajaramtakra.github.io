import { Router } from "express";
import {
  bankStatementReportQuerySchema,
  birthdayReportQuerySchema,
  chequeListReportQuerySchema,
  classWiseStudentReportQuerySchema,
  dailySalesReportQuerySchema,
  dayBookReportQuerySchema,
  feeCollectionsReportQuerySchema,
  pendingFeesReportQuerySchema,
  rankReportQuerySchema,
  stockReportQuerySchema,
  subjectWiseReportQuerySchema,
  workingDaysReportQuerySchema,
} from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateQuery } from "../../middleware/validate.middleware";
import * as controller from "./reports.controller";

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Reports
 *   description: Cross-module reports (student, fee, exam, attendance, etc.), exportable as JSON or CSV
 */

reportsRouter.get(
  "/students/birthdays",
  requirePermission("report:generate", "student:read"),
  validateQuery(birthdayReportQuerySchema),
  controller.getBirthdayReport
);

reportsRouter.get(
  "/students/class-wise",
  requirePermission("report:generate", "student:read"),
  validateQuery(classWiseStudentReportQuerySchema),
  controller.getClassWiseStudentReport
);

reportsRouter.get(
  "/students/subject-wise",
  requirePermission("report:generate", "mark:read"),
  validateQuery(subjectWiseReportQuerySchema),
  controller.getSubjectWiseReport
);

reportsRouter.get(
  "/fees/collections",
  requirePermission("report:generate", "invoice:manage"),
  validateQuery(feeCollectionsReportQuerySchema),
  controller.getFeeCollectionsReport
);

reportsRouter.get(
  "/fees/pending",
  requirePermission("report:generate", "invoice:manage"),
  validateQuery(pendingFeesReportQuerySchema),
  controller.getPendingFeesReport
);

reportsRouter.get(
  "/fees/cheques",
  requirePermission("report:generate", "invoice:manage"),
  validateQuery(chequeListReportQuerySchema),
  controller.getChequeListReport
);

reportsRouter.get(
  "/exams/rank",
  requirePermission("report:generate", "report_card:publish", "mark:read"),
  validateQuery(rankReportQuerySchema),
  controller.getRankReport
);

reportsRouter.get(
  "/attendance/working-days",
  requirePermission("report:generate", "attendance_student:read"),
  validateQuery(workingDaysReportQuerySchema),
  controller.getClassWiseWorkingDaysReport
);

reportsRouter.get(
  "/transport/routes/:routeId",
  requirePermission("report:generate", "transport:manage", "transport:read"),
  controller.getRouteWiseTransportReport
);

reportsRouter.get(
  "/accounting/day-book",
  requirePermission("report:generate", "accounting:read", "accounting:manage"),
  validateQuery(dayBookReportQuerySchema),
  controller.getDayBookReport
);

reportsRouter.get(
  "/accounting/bank-accounts/:bankAccountId/statement",
  requirePermission("report:generate", "accounting:read", "accounting:manage"),
  validateQuery(bankStatementReportQuerySchema),
  controller.getBankStatementReport
);

reportsRouter.get(
  "/inventory/stock",
  requirePermission("report:generate", "inventory:read", "inventory:manage"),
  validateQuery(stockReportQuerySchema),
  controller.getStockReport
);

reportsRouter.get(
  "/pos/daily-sales",
  requirePermission("report:generate", "pos:manage", "pos:read"),
  validateQuery(dailySalesReportQuerySchema),
  controller.getDailySalesReport
);
