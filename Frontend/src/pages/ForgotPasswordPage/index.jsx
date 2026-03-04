import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/services/api/auth";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await forgotPassword({ email });
      setSent(true);
      toast.success("If your email exists, a reset link has been sent.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-border/80">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email to receive a password reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold">Email Address</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  className="h-11 pl-9"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </label>

            <Button className="h-11 w-full" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            {sent ? (
              <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600">
                Please check your inbox and spam folder for the reset email.
              </p>
            ) : null}

            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              Back to sign in
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;

