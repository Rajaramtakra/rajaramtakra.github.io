import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Archive,
  Briefcase,
  BookOpen,
  Building2,
  CalendarClock,
  CalendarOff,
  ChevronDown,
  ChevronRight,
  CalendarHeart,
  ClipboardCheck,
  ClipboardList,
  FileBadge,
  FileBarChart,
  GraduationCap,
  HeartHandshake,
  IdCard,
  Landmark,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Moon,
  MapPin,
  MessageCircleQuestion,
  NotebookPen,
  PhoneCall,
  Receipt,
  Repeat,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Truck,
  UserCog2,
  UserPlus,
  Users,
  Users2,
  UsersRound,
  Wallet,
  Warehouse,
  X,
} from "lucide-react";
import type { Permission, RoleName } from "@erp/shared";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions?: Permission[];
  roles?: RoleName[];
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ label: "Dashboard", to: "/", icon: LayoutDashboard }],
  },
  {
    label: "Reception",
    items: [
      { label: "Enquiries", to: "/reception/enquiries", icon: PhoneCall, permissions: ["reception:manage", "reception:read"] },
      {
        label: "Student Requests",
        to: "/reception/student-requests",
        icon: MessageCircleQuestion,
        permissions: ["reception:manage", "reception:read"],
      },
      { label: "PTM Meetings", to: "/reception/ptm-meetings", icon: CalendarHeart, permissions: ["reception:manage", "reception:read"] },
    ],
  },
  {
    label: "Admissions & Students",
    items: [
      { label: "Admissions", to: "/admissions", icon: UserPlus, permissions: ["admission:read"] },
      { label: "Students", to: "/students", icon: Users, permissions: ["student:read", "student:read_own"] },
      { label: "Print ID Cards", to: "/students/id-cards/print", icon: IdCard, permissions: ["student:id_card_manage"] },
    ],
  },
  {
    label: "Academics",
    items: [
      {
        label: "Academic Setup",
        to: "/academic",
        icon: GraduationCap,
        permissions: ["academic_session:manage", "class:manage", "section:manage", "subject:manage"],
      },
      { label: "Timetable", to: "/timetable", icon: CalendarClock, permissions: ["timetable:read", "timetable:manage"] },
      { label: "Homework", to: "/homework", icon: ScrollText, permissions: ["homework:read", "homework:manage"] },
      { label: "Lesson Plans", to: "/lesson-plans", icon: NotebookPen, permissions: ["lesson_plan:manage"] },
    ],
  },
  {
    label: "People",
    items: [{ label: "Teachers", to: "/teachers", icon: UsersRound, permissions: ["teacher:read", "teacher:manage"] }],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Attendance",
        to: "/attendance",
        icon: ClipboardCheck,
        permissions: [
          "attendance_student:mark",
          "attendance_student:read",
          "attendance_staff:mark",
          "attendance_staff:read",
          "attendance_staff:read_own",
        ],
      },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Fees", to: "/fees", icon: Wallet, permissions: ["fee:manage", "discount:approve"] },
      { label: "Invoices", to: "/invoices", icon: Receipt, permissions: ["invoice:manage", "fee:read_own"] },
      { label: "Accounting", to: "/accounting", icon: Landmark, permissions: ["accounting:read", "accounting:manage"] },
      { label: "Payroll", to: "/payroll", icon: Wallet, permissions: ["payroll:manage", "payroll:read_own"] },
    ],
  },
  {
    label: "Exams & Results",
    items: [
      { label: "Exam Setup", to: "/exams", icon: ClipboardList, permissions: ["exam:read", "exam:manage"] },
      { label: "Marks Entry", to: "/marks-entry", icon: NotebookPen, permissions: ["mark:enter"] },
      {
        label: "Report Cards",
        to: "/report-cards",
        icon: FileBadge,
        permissions: ["report_card:publish", "mark:read", "report_card:read_own"],
      },
    ],
  },
  {
    label: "HR & Recruitment",
    items: [
      { label: "Job Postings", to: "/hr/job-postings", icon: Briefcase, permissions: ["hr_recruitment:manage", "hr_recruitment:read"] },
      { label: "Candidates", to: "/hr/candidates", icon: Users2, permissions: ["hr_recruitment:manage", "hr_recruitment:read"] },
      { label: "Staff Members", to: "/hr/staff", icon: UserCog2, permissions: ["staff:manage"] },
      { label: "Leave Requests", to: "/hr/leave-requests", icon: CalendarOff },
    ],
  },
  {
    label: "Library",
    items: [
      { label: "Books", to: "/library/books", icon: BookOpen, permissions: ["library:read", "library:manage"] },
      { label: "Circulation", to: "/library/circulation", icon: Repeat, permissions: ["library:manage", "library:read_own"] },
    ],
  },
  {
    label: "Transport",
    items: [
      { label: "Vehicles & Drivers", to: "/transport/vehicles", icon: Truck, permissions: ["transport:manage", "transport:read"] },
      {
        label: "Routes & Assignments",
        to: "/transport/routes",
        icon: MapPin,
        permissions: ["transport:manage", "transport:read", "transport:read_own"],
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Assets", to: "/inventory/assets", icon: Archive, permissions: ["inventory:read", "inventory:manage"] },
      {
        label: "Inventory & Purchasing",
        to: "/inventory/purchasing",
        icon: Warehouse,
        permissions: ["inventory:read", "inventory:manage"],
      },
    ],
  },
  {
    label: "Sale / POS",
    items: [
      { label: "Checkout", to: "/pos/checkout", icon: ShoppingCart, permissions: ["pos:manage"] },
      { label: "Sales", to: "/pos/sales", icon: Receipt, permissions: ["pos:manage", "pos:read"] },
    ],
  },
  {
    label: "Hostel",
    items: [{ label: "Hostel", to: "/hostel", icon: Building2, permissions: ["hostel:manage", "hostel:read"] }],
  },
  {
    label: "Communication",
    items: [
      { label: "Announcements", to: "/announcements", icon: Megaphone, permissions: ["announcement:read", "announcement:manage"] },
      { label: "Messages", to: "/messages", icon: MessageSquare, permissions: ["communication:read_own", "communication:manage"] },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "School Profile", to: "/settings/school", icon: Building2, permissions: ["settings:manage"] },
      {
        label: "Users & Roles",
        to: "/settings/users",
        icon: ShieldCheck,
        permissions: ["settings:manage", "user:manage", "role:manage"],
      },
    ],
  },
  {
    label: "Family",
    items: [{ label: "My Children", to: "/my-children", icon: HeartHandshake, roles: ["PARENT"] }],
  },
  {
    label: "Reports",
    items: [{ label: "Reports", to: "/reports", icon: FileBarChart, permissions: ["report:generate"] }],
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const COLLAPSED_GROUPS_STORAGE_KEY = "erp.sidebar.collapsedGroups";

function loadCollapsedGroups(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(COLLAPSED_GROUPS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const userRoles = useAuthStore((s) => s.user?.roles ?? []);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsedGroups);

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.roles && !item.roles.some((r) => userRoles.includes(r))) return false;
      if (item.permissions && !hasPermission(...item.permissions)) return false;
      return true;
    }),
  })).filter((group) => group.items.length > 0);

  function toggleGroup(label: string) {
    setCollapsed((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      try {
        localStorage.setItem(COLLAPSED_GROUPS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable (e.g. private mode) — collapse state just won't persist
      }
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/60 text-sm font-bold text-primary-foreground shadow-sm">
          G
        </div>
        <span className="text-sm font-semibold tracking-tight">Greenwood ERP</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {visibleGroups.map((group, groupIndex) => {
          const key = group.label ?? `group-${groupIndex}`;
          const isCollapsed = group.label ? collapsed[group.label] : false;
          return (
            <div key={key} className="space-y-1 pb-3">
              {group.label && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label!)}
                  className="flex w-full items-center justify-between rounded-md px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 hover:text-sidebar-foreground/70"
                >
                  <span>{group.label}</span>
                  {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              )}
              {!isCollapsed &&
                group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md border-l-2 border-transparent px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "border-primary bg-sidebar-accent text-white"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
            </div>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-xs text-sidebar-foreground/50">School ERP</div>
    </div>
  );
}

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } finally {
      clearSession();
      sessionStorage.setItem("loggedOut", "1");
      navigate("/login", { replace: true, state: { loggedOut: true } });
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/30">
      <aside className="hidden w-64 shrink-0 border-r border-border md:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 w-64">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
          <button
            className="absolute right-4 top-4 z-50 text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle dark mode">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                      {user ? initials(user.fullName) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">{user?.fullName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.fullName}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
