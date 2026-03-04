import { ArrowLeft, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/services/api/auth";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  const hasValidQuery = useMemo(() => Boolean(token && email), [email, token]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!hasValidQuery) {
      toast.error("Invalid reset link.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Confirm password does not match");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        email,
        token,
        newPassword: password,
      });
      toast.success("Password reset successful. Please sign in.");
      navigate("/login");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Reset password failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-border/80">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Set a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasValidQuery ? (
            <div className="space-y-4">
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                Invalid or incomplete reset link. Please request a new link.
              </p>
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="size-3.5" />
                Go to forgot password
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold">New Password</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    className="h-11 pl-9"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Confirm Password</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    className="h-11 pl-9"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </div>
              </label>

              <Button className="h-11 w-full" type="submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="size-3.5" />
                Back to sign in
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;

