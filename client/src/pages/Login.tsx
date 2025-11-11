import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, LockKeyhole, Mail, User2 } from "lucide-react";

import { APP_TITLE, getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { loginWithCredentials, devLogin as devLoginService } from "@/_core/services/auth";

// Local type for form values
interface LoginFormValues {
  emailOrUsername: string;
  password: string;
  rememberMe: boolean;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: false });
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    defaultValues: {
      emailOrUsername: "",
      password: "",
      rememberMe: true,
    },
    mode: "onBlur",
  });

  // If already authenticated, go home
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const disabled = useMemo(() => submitting || loading, [submitting, loading]);

  const validateEmailOrUsername = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return "Please enter a valid email or username";
    // Basic email check; usernames allowed too
    const looksLikeEmail = /.+@.+\..+/.test(trimmed);
    if (!looksLikeEmail && trimmed.length < 3) return "Username must be at least 3 characters";
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value || value.length < 8) return "Password must be at least 8 characters";
    return true;
  };

  const tryDevLogin = async () => {
    // Use a full-page navigation so the Set-Cookie + 302 redirect works reliably
    devLoginService();
  };

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      // Client-side validation guard
      const emailOrUsernameValid = validateEmailOrUsername(values.emailOrUsername);
      if (emailOrUsernameValid !== true) {
        setError("emailOrUsername", { type: "manual", message: emailOrUsernameValid });
        return;
      }
      const passwordValid = validatePassword(values.password);
      if (passwordValid !== true) {
        setError("password", { type: "manual", message: passwordValid });
        return;
      }

      // Attempt real login endpoint if available; fallback to dev login
      const result = await loginWithCredentials(
        values.emailOrUsername.trim(),
        values.password,
        values.rememberMe
      );

      if (result.shouldFallbackToDev) {
        toast.info("Using developer login (no email/password endpoint configured)");
        tryDevLogin();
        return;
      }

      if (!result.ok) {
        toast.error(result.error || "Login failed");
        return;
      }

      const redirectTo = result.redirect || "/";
      setLocation(redirectTo);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Access {APP_TITLE}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailOrUsername">Email or Username</Label>
              <div className="relative">
                <Input
                  id="emailOrUsername"
                  type="text"
                  autoComplete="username"
                  disabled={disabled}
                  placeholder="you@example.com or username"
                  className="pl-9"
                  {...register("emailOrUsername", { validate: validateEmailOrUsername })}
                />
                <User2 className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
              {errors.emailOrUsername && (
                <p className="text-destructive text-xs mt-1">{errors.emailOrUsername.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  disabled={disabled}
                  placeholder="••••••••"
                  className="pl-9"
                  {...register("password", { validate: validatePassword })}
                />
                <LockKeyhole className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
              {errors.password && (
                <p className="text-destructive text-xs mt-1">{errors.password.message as string}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  id="rememberMe"
                  checked
                  {...register("rememberMe")}
                  disabled={disabled}
                />
                Remember me
              </label>

              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className="text-sm text-primary hover:underline focus-ring" disabled={disabled}>
                    Forgot password?
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Forgot Password</DialogTitle>
                    <DialogDescription>
                      Password reset is not configured. Please contact your administrator.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button onClick={() => window.open("mailto:admin@example.com?subject=Password%20Reset", "_blank")}>
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Admin
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={disabled}>
                {submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                Sign in
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={tryDevLogin} disabled={disabled}>
                Use Developer Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}