import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import path from "node:path";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { swaggerSpec } from "./lib/swagger";
import { authRouter } from "./modules/auth/auth.routes";
import { academicRouter } from "./modules/academic/academic.routes";
import { admissionRouter } from "./modules/admissions/admission.routes";
import { studentRouter } from "./modules/students/student.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { teacherRouter } from "./modules/teachers/teacher.routes";
import { timetableRouter } from "./modules/timetable/timetable.routes";
import { homeworkRouter } from "./modules/homework/homework.routes";
import { lessonPlanRouter } from "./modules/lesson-plans/lessonPlan.routes";
import { attendanceRouter } from "./modules/attendance/attendance.routes";
import { parentRouter } from "./modules/parents/parent.routes";
import { feeRouter } from "./modules/fees/fee.routes";
import { invoiceRouter } from "./modules/invoices/invoice.routes";
import { examRouter } from "./modules/exams/exam.routes";
import { accountingRouter } from "./modules/accounting/accounting.routes";
import { payrollRouter } from "./modules/payroll/payroll.routes";
import { hrRouter } from "./modules/hr/hr.routes";
import { libraryRouter } from "./modules/library/library.routes";
import { transportRouter } from "./modules/transport/transport.routes";
import { inventoryRouter } from "./modules/inventory/inventory.routes";
import { communicationRouter } from "./modules/communication/communication.routes";
import { settingsRouter } from "./modules/settings/settings.routes";
import { idCardPublicRouter } from "./modules/id-cards/idCard.public.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { receptionRouter } from "./modules/reception/reception.routes";
import { posRouter } from "./modules/pos/pos.routes";
import { hostelRouter } from "./modules/hostel/hostel.routes";
import { deviceRouter } from "./modules/devices/device.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(","),
      credentials: true,
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== "test" }));

  const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false });
  app.use("/api", apiLimiter);

  app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use("/api/auth", authRouter);
  app.use("/api/academic", academicRouter);
  app.use("/api/admissions", admissionRouter);
  app.use("/api/students", studentRouter);
  app.use("/api/teachers", teacherRouter);
  app.use("/api/timetable", timetableRouter);
  app.use("/api/homework", homeworkRouter);
  app.use("/api/lesson-plans", lessonPlanRouter);
  app.use("/api/attendance", attendanceRouter);
  app.use("/api/parents", parentRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/fees", feeRouter);
  app.use("/api/invoices", invoiceRouter);
  app.use("/api/exams", examRouter);
  app.use("/api/accounting", accountingRouter);
  app.use("/api/payroll", payrollRouter);
  app.use("/api/hr", hrRouter);
  app.use("/api/library", libraryRouter);
  app.use("/api/transport", transportRouter);
  app.use("/api/inventory", inventoryRouter);
  app.use("/api/communication", communicationRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/id-cards/verify", idCardPublicRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/reception", receptionRouter);
  app.use("/api/pos", posRouter);
  app.use("/api/hostel", hostelRouter);
  app.use("/api/devices", deviceRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
