import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation } from "react-router-dom";
import { loginSchema, type LoginInput } from "@erp/shared";
import { CalendarClock, ClipboardCheck, GraduationCap, Loader2, UsersRound } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const DEV_AUTO_LOGIN_EMAIL = import.meta.env.DEV ? import.meta.env.VITE_DEV_AUTO_LOGIN_EMAIL : undefined;
const DEV_AUTO_LOGIN_PASSWORD = import.meta.env.DEV ? import.meta.env.VITE_DEV_AUTO_LOGIN_PASSWORD : undefined;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const autoLoginAttempted = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    try {
      const { data } = await api.post("/auth/login", values);
      setSession(data.accessToken, data.user);
      sessionStorage.removeItem("loggedOut");
      const from = (location.state as { from?: Location })?.from?.pathname ?? "/";
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  // Dev convenience: auto-fill and submit with VITE_DEV_AUTO_LOGIN_* from .env.local.
  // Stripped from production builds since import.meta.env.DEV is statically false there.
  // Skipped after an explicit logout (flagged both via router state and sessionStorage, so it
  // stays skipped across a hard refresh too), otherwise logout would immediately re-authenticate.
  useEffect(() => {
    if (!DEV_AUTO_LOGIN_EMAIL || !DEV_AUTO_LOGIN_PASSWORD) return;
    if ((location.state as { loggedOut?: boolean })?.loggedOut) return;
    if (sessionStorage.getItem("loggedOut")) return;
    if (autoLoginAttempted.current) return;
    autoLoginAttempted.current = true;
    onSubmit({ email: DEV_AUTO_LOGIN_EMAIL, password: DEV_AUTO_LOGIN_PASSWORD, rememberMe: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-indigo-800 p-10 text-primary-foreground lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

        <div className="relative flex items-center gap-2 text-lg font-semibold">
          <GraduationCap className="h-6 w-6" />
          Greenwood ERP
        </div>
        <div className="relative space-y-5">
          <h1 className="text-3xl font-semibold leading-tight">
            One platform for admissions, academics, finance, and every role in your school.
          </h1>
          <p className="max-w-md text-sm text-primary-foreground/80">
            Manage students, staff, fees, exams, and communication from a single, secure, role-based
            dashboard.
          </p>
          <div className="flex flex-col gap-2 pt-2 text-sm text-primary-foreground/90">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 shrink-0" /> Timetables, homework, and attendance in one place
            </div>
            <div className="flex items-center gap-2">
              <UsersRound className="h-4 w-4 shrink-0" /> Dedicated portals for teachers and parents
            </div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 shrink-0" /> Role-based access down to every action
            </div>
          </div>
        </div>
        <p className="relative text-xs text-primary-foreground/60">
          &copy; {new Date().getFullYear()} Greenwood International School
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">Enter your credentials to access your dashboard.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="you@school.edu" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  {...register("rememberMe")}
                />
                Remember me?
              </label>
              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className="text-sm font-medium text-primary hover:underline">
                    Forgot password?
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Forgot your password?</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Self-service password reset isn&apos;t available yet. Please contact your school administrator
                    and ask them to reset your password.
                  </p>
                </DialogContent>
              </Dialog>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
