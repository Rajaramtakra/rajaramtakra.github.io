import { Router } from "express";
import { createBookSchema, issueBookSchema, reserveBookSchema, returnBookSchema, updateBookSchema } from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { upload } from "../../middleware/upload.middleware";
import * as controller from "./library.controller";

export const libraryRouter = Router();
libraryRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Library
 *   description: Book catalog, circulation (issue/return), and reservation queue
 */

libraryRouter.post("/books", requirePermission("library:manage"), validateBody(createBookSchema), controller.createBook);

libraryRouter.get("/books", requirePermission("library:read"), controller.listBooks);

libraryRouter.get("/books/:id", requirePermission("library:read"), controller.getBook);

libraryRouter.patch(
  "/books/:id",
  requirePermission("library:manage"),
  validateBody(updateBookSchema),
  controller.updateBook
);

libraryRouter.post(
  "/books/:id/cover",
  requirePermission("library:manage"),
  upload.single("file"),
  controller.uploadCover
);

libraryRouter.get(
  "/books/:id/reservations",
  requirePermission("library:manage"),
  controller.listReservationsForBook
);

libraryRouter.post("/issues", requirePermission("library:manage"), validateBody(issueBookSchema), controller.issueBook);

libraryRouter.get("/issues", requirePermission("library:manage"), controller.listActiveIssues);

libraryRouter.get(
  "/issues/mine",
  requirePermission("library:read_own", "library:read", "library:manage"),
  controller.listMyIssues
);

libraryRouter.post(
  "/issues/return",
  requirePermission("library:manage"),
  validateBody(returnBookSchema),
  controller.returnBook
);

libraryRouter.post("/issues/:id/lost", requirePermission("library:manage"), controller.markIssueLost);

libraryRouter.post(
  "/reservations",
  requirePermission("library:manage"),
  validateBody(reserveBookSchema),
  controller.reserveBook
);

libraryRouter.get("/reservations", requirePermission("library:manage"), controller.listAllReservations);

libraryRouter.post("/reservations/:id/issue", requirePermission("library:manage"), controller.issueToReservation);

libraryRouter.get(
  "/students/:id/card/pdf",
  requirePermission("library:manage", "library:read", "library:read_own"),
  controller.downloadLibraryCardPdf
);
