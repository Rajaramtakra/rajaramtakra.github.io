import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { ProtectedRoute, RequirePermission } from "@/routes/ProtectedRoute";
import { AppShell } from "@/layouts/AppShell";
import { Toaster } from "@/components/ui/toaster";
import { LoginPage } from "@/modules/auth/LoginPage";
import { DashboardPage } from "@/modules/dashboard/DashboardPage";
import { AdmissionsListPage } from "@/modules/admissions/AdmissionsListPage";
import { AdmissionDetailPage } from "@/modules/admissions/AdmissionDetailPage";
import { StudentsListPage } from "@/modules/students/StudentsListPage";
import { StudentDetailPage } from "@/modules/students/StudentDetailPage";
import { AcademicSetupPage } from "@/modules/academic/AcademicSetupPage";
import { TeachersListPage } from "@/modules/teachers/TeachersListPage";
import { TeacherDetailPage } from "@/modules/teachers/TeacherDetailPage";
import { TimetablePage } from "@/modules/timetable/TimetablePage";
import { HomeworkListPage } from "@/modules/homework/HomeworkListPage";
import { LessonPlansPage } from "@/modules/lesson-plans/LessonPlansPage";
import { AttendanceMarkPage } from "@/modules/attendance/AttendanceMarkPage";
import { MyChildrenPage } from "@/modules/parent-portal/MyChildrenPage";
import { ChildDetailPage } from "@/modules/parent-portal/ChildDetailPage";
import { NotFoundPage } from "@/modules/misc/NotFoundPage";
import { FeeSetupPage } from "@/modules/fees/FeeSetupPage";
import { InvoicesListPage } from "@/modules/invoices/InvoicesListPage";
import { InvoiceDetailPage } from "@/modules/invoices/InvoiceDetailPage";
import { ExamsSetupPage } from "@/modules/exams/ExamsSetupPage";
import { MarksEntryPage } from "@/modules/exams/MarksEntryPage";
import { ReportCardsPage } from "@/modules/exams/ReportCardsPage";
import { ReportCardDetailPage } from "@/modules/exams/ReportCardDetailPage";
import { AccountingPage } from "@/modules/accounting/AccountingPage";
import { PayrollLandingPage } from "@/modules/payroll/PayrollLandingPage";
import { PayrollRunsPage } from "@/modules/payroll/PayrollRunsPage";
import { PayrollRunDetailPage } from "@/modules/payroll/PayrollRunDetailPage";
import { PayslipDetailPage } from "@/modules/payroll/PayslipDetailPage";
import { JobPostingsListPage } from "@/modules/hr/JobPostingsListPage";
import { JobPostingDetailPage } from "@/modules/hr/JobPostingDetailPage";
import { CandidatesPipelinePage } from "@/modules/hr/CandidatesPipelinePage";
import { CandidateDetailPage } from "@/modules/hr/CandidateDetailPage";
import { StaffMembersListPage } from "@/modules/hr/StaffMembersListPage";
import { StaffMemberDetailPage } from "@/modules/hr/StaffMemberDetailPage";
import { LeaveRequestsPage } from "@/modules/hr/LeaveRequestsPage";
import { BooksListPage } from "@/modules/library/BooksListPage";
import { BookDetailPage } from "@/modules/library/BookDetailPage";
import { CirculationPage } from "@/modules/library/CirculationPage";
import { VehiclesPage } from "@/modules/transport/VehiclesPage";
import { RoutesPage } from "@/modules/transport/RoutesPage";
import { RouteAssignmentsPage } from "@/modules/transport/RouteAssignmentsPage";
import { AssetsListPage } from "@/modules/inventory/AssetsListPage";
import { AssetDetailPage } from "@/modules/inventory/AssetDetailPage";
import { InventoryPurchasingPage } from "@/modules/inventory/InventoryPurchasingPage";
import { PurchaseOrderDetailPage } from "@/modules/inventory/PurchaseOrderDetailPage";
import { CheckoutPage } from "@/modules/pos/CheckoutPage";
import { SalesListPage } from "@/modules/pos/SalesListPage";
import { HostelsPage } from "@/modules/hostel/HostelsPage";
import { AnnouncementsPage } from "@/modules/communication/AnnouncementsPage";
import { MessagesPage } from "@/modules/communication/MessagesPage";
import { SchoolProfilePage } from "@/modules/settings/SchoolProfilePage";
import { UsersRolesPage } from "@/modules/settings/UsersRolesPage";
import { VerifyIdCardPage } from "@/modules/id-cards/VerifyIdCardPage";
import { BulkIdCardPrintPage } from "@/modules/id-cards/BulkIdCardPrintPage";
import { ReportsPage } from "@/modules/reports/ReportsPage";
import { EnquiriesPage } from "@/modules/reception/EnquiriesPage";
import { StudentRequestsPage } from "@/modules/reception/StudentRequestsPage";
import { PtmMeetingsPage } from "@/modules/reception/PtmMeetingsPage";
import { PtmMeetingDetailPage } from "@/modules/reception/PtmMeetingDetailPage";

export default function App() {
  const setSession = useAuthStore((s) => s.setSession);
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        const { data } = await api.post("/auth/refresh");
        if (!cancelled) setSession(data.accessToken, data.user);
      } catch {
        // no valid session; user will be redirected to /login
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setSession, setBootstrapping]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify/:code" element={<VerifyIdCardPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route
              path="/reception/enquiries"
              element={
                <RequirePermission anyOf={["reception:manage", "reception:read"]}>
                  <EnquiriesPage />
                </RequirePermission>
              }
            />
            <Route
              path="/reception/student-requests"
              element={
                <RequirePermission anyOf={["reception:manage", "reception:read"]}>
                  <StudentRequestsPage />
                </RequirePermission>
              }
            />
            <Route
              path="/reception/ptm-meetings"
              element={
                <RequirePermission anyOf={["reception:manage", "reception:read"]}>
                  <PtmMeetingsPage />
                </RequirePermission>
              }
            />
            <Route
              path="/reception/ptm-meetings/:id"
              element={
                <RequirePermission anyOf={["reception:manage", "reception:read"]}>
                  <PtmMeetingDetailPage />
                </RequirePermission>
              }
            />

            <Route path="/admissions" element={<AdmissionsListPage />} />
            <Route path="/admissions/:id" element={<AdmissionDetailPage />} />
            <Route path="/students" element={<StudentsListPage />} />
            <Route path="/students/:id" element={<StudentDetailPage />} />
            <Route
              path="/students/id-cards/print"
              element={
                <RequirePermission anyOf={["student:id_card_manage"]}>
                  <BulkIdCardPrintPage />
                </RequirePermission>
              }
            />
            <Route
              path="/academic"
              element={
                <RequirePermission anyOf={["academic_session:manage", "class:manage", "section:manage", "subject:manage"]}>
                  <AcademicSetupPage />
                </RequirePermission>
              }
            />
            <Route
              path="/teachers"
              element={
                <RequirePermission anyOf={["teacher:read", "teacher:manage"]}>
                  <TeachersListPage />
                </RequirePermission>
              }
            />
            <Route
              path="/teachers/:id"
              element={
                <RequirePermission anyOf={["teacher:read", "teacher:manage"]}>
                  <TeacherDetailPage />
                </RequirePermission>
              }
            />
            <Route
              path="/timetable"
              element={
                <RequirePermission anyOf={["timetable:read", "timetable:manage"]}>
                  <TimetablePage />
                </RequirePermission>
              }
            />
            <Route
              path="/homework"
              element={
                <RequirePermission anyOf={["homework:read", "homework:manage"]}>
                  <HomeworkListPage />
                </RequirePermission>
              }
            />
            <Route
              path="/lesson-plans"
              element={
                <RequirePermission anyOf={["lesson_plan:manage"]}>
                  <LessonPlansPage />
                </RequirePermission>
              }
            />
            <Route
              path="/attendance"
              element={
                <RequirePermission
                  anyOf={[
                    "attendance_student:mark",
                    "attendance_student:read",
                    "attendance_staff:mark",
                    "attendance_staff:read",
                    "attendance_staff:read_own",
                  ]}
                >
                  <AttendanceMarkPage />
                </RequirePermission>
              }
            />
            <Route path="/my-children" element={<MyChildrenPage />} />
            <Route path="/my-children/:studentId" element={<ChildDetailPage />} />

            <Route
              path="/fees"
              element={
                <RequirePermission anyOf={["fee:manage", "discount:approve"]}>
                  <FeeSetupPage />
                </RequirePermission>
              }
            />
            <Route
              path="/invoices"
              element={
                <RequirePermission anyOf={["invoice:manage", "fee:read_own"]}>
                  <InvoicesListPage />
                </RequirePermission>
              }
            />
            <Route
              path="/invoices/:id"
              element={
                <RequirePermission anyOf={["invoice:manage", "fee:read_own"]}>
                  <InvoiceDetailPage />
                </RequirePermission>
              }
            />

            <Route
              path="/exams"
              element={
                <RequirePermission anyOf={["exam:read", "exam:manage"]}>
                  <ExamsSetupPage />
                </RequirePermission>
              }
            />
            <Route
              path="/marks-entry"
              element={
                <RequirePermission anyOf={["mark:enter"]}>
                  <MarksEntryPage />
                </RequirePermission>
              }
            />
            <Route
              path="/report-cards"
              element={
                <RequirePermission anyOf={["report_card:publish", "mark:read", "report_card:read_own"]}>
                  <ReportCardsPage />
                </RequirePermission>
              }
            />
            <Route
              path="/report-cards/:id"
              element={
                <RequirePermission anyOf={["report_card:publish", "mark:read", "report_card:read_own"]}>
                  <ReportCardDetailPage />
                </RequirePermission>
              }
            />

            <Route
              path="/accounting"
              element={
                <RequirePermission anyOf={["accounting:read", "accounting:manage"]}>
                  <AccountingPage />
                </RequirePermission>
              }
            />

            <Route
              path="/payroll"
              element={
                <RequirePermission anyOf={["payroll:manage", "payroll:read_own"]}>
                  <PayrollLandingPage />
                </RequirePermission>
              }
            />
            <Route
              path="/payroll/runs"
              element={
                <RequirePermission anyOf={["payroll:manage"]}>
                  <PayrollRunsPage />
                </RequirePermission>
              }
            />
            <Route
              path="/payroll/runs/:id"
              element={
                <RequirePermission anyOf={["payroll:manage"]}>
                  <PayrollRunDetailPage />
                </RequirePermission>
              }
            />
            <Route
              path="/payroll/payslips/:id"
              element={
                <RequirePermission anyOf={["payroll:manage", "payroll:read_own"]}>
                  <PayslipDetailPage />
                </RequirePermission>
              }
            />

            <Route
              path="/hr/job-postings"
              element={
                <RequirePermission anyOf={["hr_recruitment:manage", "hr_recruitment:read"]}>
                  <JobPostingsListPage />
                </RequirePermission>
              }
            />
            <Route
              path="/hr/job-postings/:id"
              element={
                <RequirePermission anyOf={["hr_recruitment:manage", "hr_recruitment:read"]}>
                  <JobPostingDetailPage />
                </RequirePermission>
              }
            />
            <Route
              path="/hr/candidates"
              element={
                <RequirePermission anyOf={["hr_recruitment:manage", "hr_recruitment:read"]}>
                  <CandidatesPipelinePage />
                </RequirePermission>
              }
            />
            <Route
              path="/hr/candidates/:id"
              element={
                <RequirePermission anyOf={["hr_recruitment:manage", "hr_recruitment:read"]}>
                  <CandidateDetailPage />
                </RequirePermission>
              }
            />
            <Route
              path="/hr/staff"
              element={
                <RequirePermission anyOf={["staff:manage"]}>
                  <StaffMembersListPage />
                </RequirePermission>
              }
            />
            <Route
              path="/hr/staff/:id"
              element={
                <RequirePermission anyOf={["staff:manage"]}>
                  <StaffMemberDetailPage />
                </RequirePermission>
              }
            />
            <Route path="/hr/leave-requests" element={<LeaveRequestsPage />} />

            <Route
              path="/library/books"
              element={
                <RequirePermission anyOf={["library:read", "library:manage"]}>
                  <BooksListPage />
                </RequirePermission>
              }
            />
            <Route
              path="/library/books/:id"
              element={
                <RequirePermission anyOf={["library:read", "library:manage"]}>
                  <BookDetailPage />
                </RequirePermission>
              }
            />
            <Route
              path="/library/circulation"
              element={
                <RequirePermission anyOf={["library:manage", "library:read_own"]}>
                  <CirculationPage />
                </RequirePermission>
              }
            />

            <Route
              path="/transport/vehicles"
              element={
                <RequirePermission anyOf={["transport:manage", "transport:read"]}>
                  <VehiclesPage />
                </RequirePermission>
              }
            />
            <Route
              path="/transport/routes"
              element={
                <RequirePermission anyOf={["transport:manage", "transport:read", "transport:read_own"]}>
                  <RoutesPage />
                </RequirePermission>
              }
            />
            <Route
              path="/transport/assignments"
              element={
                <RequirePermission anyOf={["transport:manage", "transport:read", "transport:read_own"]}>
                  <RouteAssignmentsPage />
                </RequirePermission>
              }
            />

            <Route
              path="/inventory/assets"
              element={
                <RequirePermission anyOf={["inventory:read", "inventory:manage"]}>
                  <AssetsListPage />
                </RequirePermission>
              }
            />
            <Route
              path="/inventory/assets/:id"
              element={
                <RequirePermission anyOf={["inventory:read", "inventory:manage"]}>
                  <AssetDetailPage />
                </RequirePermission>
              }
            />
            <Route
              path="/inventory/purchasing"
              element={
                <RequirePermission anyOf={["inventory:read", "inventory:manage"]}>
                  <InventoryPurchasingPage />
                </RequirePermission>
              }
            />
            <Route
              path="/inventory/purchase-orders/:id"
              element={
                <RequirePermission anyOf={["inventory:read", "inventory:manage"]}>
                  <PurchaseOrderDetailPage />
                </RequirePermission>
              }
            />

            <Route
              path="/pos/checkout"
              element={
                <RequirePermission anyOf={["pos:manage"]}>
                  <CheckoutPage />
                </RequirePermission>
              }
            />
            <Route
              path="/pos/sales"
              element={
                <RequirePermission anyOf={["pos:manage", "pos:read"]}>
                  <SalesListPage />
                </RequirePermission>
              }
            />

            <Route
              path="/hostel"
              element={
                <RequirePermission anyOf={["hostel:manage", "hostel:read"]}>
                  <HostelsPage />
                </RequirePermission>
              }
            />

            <Route
              path="/announcements"
              element={
                <RequirePermission anyOf={["announcement:read", "announcement:manage"]}>
                  <AnnouncementsPage />
                </RequirePermission>
              }
            />
            <Route
              path="/messages"
              element={
                <RequirePermission anyOf={["communication:read_own", "communication:manage"]}>
                  <MessagesPage />
                </RequirePermission>
              }
            />

            <Route
              path="/settings/school"
              element={
                <RequirePermission anyOf={["settings:manage"]}>
                  <SchoolProfilePage />
                </RequirePermission>
              }
            />
            <Route
              path="/settings/users"
              element={
                <RequirePermission anyOf={["settings:manage", "user:manage", "role:manage"]}>
                  <UsersRolesPage />
                </RequirePermission>
              }
            />

            <Route
              path="/reports"
              element={
                <RequirePermission anyOf={["report:generate"]}>
                  <ReportsPage />
                </RequirePermission>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}
